from flask import current_app
from .utils import is_valid_uuid
from .models import db, Task, List, Group, Project, Status
from .utils import _parse_iso_datetime


def get_entity_by_type_and_id(entity_type, entity_id, user_id):
    """Получает сущность по типу и ID, используя новую схему UUID."""
    current_app.logger.info(f'get_entity_by_type_and_id called: type={entity_type}, id={entity_id}, user_id={user_id}')
    
    model_map = {
        'list': List,
        'group': Group,
        'project': Project,
        'task': Task,
    }
    
    model = model_map.get(entity_type)
    if not model:
        current_app.logger.error(f"❌ Invalid entity type: {entity_type}")
        return None
        
    try:
        obj = model.query.filter_by(id=entity_id, user_id=user_id).first()
        current_app.logger.info(f"Resolved {entity_type} ID {entity_id} -> {obj}")
        return obj
    except Exception as e:
        current_app.logger.error(f"❌ get_entity_by_type_and_id failed for {entity_type}:{entity_id}: {e}")
        return None


def get_entity_by_id(raw_id, user_id, entity_type=None):
    """
    Получает сущность по ID. Если тип не указан, пытается определить его.
    Эта функция оставлена для обратной совместимости, но рекомендуется использовать get_entity_by_type_and_id.
    """
    current_app.logger.info(f'get_entity_by_id called: raw_id={raw_id}, user_id={user_id}, entity_type={entity_type}')
    
    if entity_type:
        return get_entity_by_type_and_id(entity_type, raw_id, user_id)

    models_to_check = [Task, List, Group, Project]
    for model in models_to_check:
        instance = model.query.filter_by(id=raw_id, user_id=user_id).first()
        if instance:
            current_app.logger.info(f"Resolved ID {raw_id} to {type(instance).__name__} -> {instance}")
            return instance
            
    current_app.logger.warning(f"get_entity_by_id failed to find entity for ID {raw_id}")
    return None



def delete_from_childes(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for delete_from_childes")
    
    try:
        source_id = data.get('source_id')
        source_type = data.get('source_type')
        parent_id = data.get('parent_id')
        parent_type = data.get('parent_type')

        if not all([source_id, source_type]):
            return {"error": "source_id and source_type are required"}, 400

        source = get_entity_by_type_and_id(source_type, source_id, user_id)
        if not source:
            return {"error": "Source entity not found"}, 404

        parent = None
        if not parent_id or not parent_type:
            if hasattr(source, 'in_general_list'):
                source.in_general_list = False
                db.session.add(source)
                db.session.commit()
            return {"success": True, "message": "Removed from general list", "source": source.to_dict()}, 200
        
        if parent_id in ['my_day', 'tasks', 'important', 'all', 'events']:
            return {"success": True}, 200

        parent = get_entity_by_type_and_id(parent_type, parent_id, user_id)
        if not parent:
            return {"error": "Parent entity not found"}, 404

        if hasattr(parent, 'childes_order') and parent.childes_order and source_id in parent.childes_order:
            updated_childes_order = parent.childes_order.copy()
            updated_childes_order.remove(source_id)
            parent.childes_order = updated_childes_order
            db.session.add(parent)

        if isinstance(source, Task):
            if parent in source.lists:
                source.lists.remove(parent)
            if parent in source.parent_tasks:
                source.parent_tasks.remove(parent)
        elif isinstance(source, List):
            if parent in source.groups:
                source.groups.remove(parent)
            if parent in source.projects:
                source.projects.remove(parent)
        elif isinstance(source, Group):
            if parent in source.projects:
                source.projects.remove(parent)

        db.session.add(source)
        db.session.commit()

        response = {"success": True, "source": source.to_dict()}
        if parent:
            response["parent"] = parent.to_dict()

        return response, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return {"error": str(e)}, 500


def link_task(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for link_task")
    try:
        task_id = data.get('task_id')
        target_id = data.get('target_id')
        target_type = data.get('target_type')
        action = data.get('action', 'link')
        source_list_id = data.get('source_list_id')

        if not all([task_id, target_id, target_type]):
            return {"error": "task_id, target_id, and target_type are required"}, 400

        if not is_valid_uuid(task_id) or not is_valid_uuid(target_id):
            return {"error": "Invalid ID format"}, 400

        task = get_entity_by_type_and_id('task', task_id, user_id)
        if not task:
            return {"error": "Task not found"}, 404

        target = get_entity_by_type_and_id(target_type, target_id, user_id)
        if not target:
            return {"error": "Target entity not found"}, 404

        if isinstance(target, Task):
            if task.id == target.id or task in target.parent_tasks or task in target.subtasks:
                return {"error": "Task cannot be linked to itself"}, 400
            if task not in target.subtasks:
                task.parent_tasks.append(target)
        elif isinstance(target, List):
            if task not in target.tasks:
                task.lists.append(target)
        else:
            return {"error": f"Tasks cannot be linked to entities of type {target_type}"}, 400

        if hasattr(target, 'childes_order'):
            childes_order = target.childes_order.copy() if target.childes_order else []
            if task.id not in childes_order:
                childes_order.append(task.id)
                target.childes_order = childes_order
        
        db.session.add(target)
        db.session.add(task)
        db.session.commit()

        response_data = {"success": True, "task": task.to_dict(), "target": target.to_dict()}

        if action == 'move' and source_list_id:
            delete_result, _ = delete_from_childes({'source_id': task_id, 'source_type': 'task', 'parent_id': source_list_id, 'parent_type': 'list'}, user_id=user_id)
            if delete_result and delete_result.get('success'):
                if 'parent' in delete_result:
                    response_data['old_parent'] = delete_result['parent']
                # task in response_data will be updated with the latest version from delete_from_childes
                if 'source' in delete_result:
                    response_data['task'] = delete_result['source']

        return response_data, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'link_task: Error {e}')
        return {"error": str(e)}, 500


def sort_items(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided")
    
    source_id = data.get('source_id')
    source_type = data.get('source_type')
    new_order = data.get('new_order')
    
    if not source_id or not source_type:
        return {"error": "source_id and source_type are required"}, 400
    
    try:
        source_entity = get_entity_by_type_and_id(source_type, source_id, user_id)
        if not source_entity:
            return {"error": "Source entity not found"}, 404
        
        if new_order is not None and hasattr(source_entity, 'order'):
            source_entity.order = new_order
        
        db.session.add(source_entity)
        db.session.commit()
        
        _normalize_orders_by_type(type(source_entity), user_id)
        
        return {"success": True}, 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'sort_items failed: {e}', exc_info=True)
        return {"error": "Internal server error"}, 500


def sort_items_in_container(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided")
    
    container_id = data.get('container_id')
    container_type = data.get('container_type')
    source_id = data.get('source_id')
    new_position = data.get('new_position')
    
    if not all([container_id, container_type, source_id, new_position is not None]):
        return {"error": "container_id, container_type, source_id, and new_position are required"}, 400
    
    try:
        container_entity = get_entity_by_type_and_id(container_type, container_id, user_id)
        if not container_entity:
            return {"error": "Container entity not found"}, 404
        
        if not hasattr(container_entity, 'childes_order'):
            return {"error": "Container entity does not support child ordering"}, 400

        childes_order = container_entity.childes_order.copy() if container_entity.childes_order else []
        
        if source_id in childes_order:
            childes_order.remove(source_id)
        
        childes_order.insert(new_position, source_id)
        
        container_entity.childes_order = childes_order
        db.session.add(container_entity)
        db.session.commit()
        
        return {"success": True}, 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'sort_items_in_container failed: {e}', exc_info=True)
        return {"error": "Internal server error"}, 500


def link_items(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided")
    
    source_type = data.get('source_type')
    source_id = data.get('source_id')
    target_type = data.get('target_type')
    target_id = data.get('target_id')
    
    current_app.logger.info(f'🔗 link_items called: source_type={source_type}, source_id={source_id}, target_type={target_type}, target_id={target_id}, user_id={user_id}')
    
    if not source_id or not target_id or not source_type or not target_type:
        current_app.logger.error('❌ link_items: Missing required parameters')
        return {"error": "source_type, source_id, target_type and target_id are required"}, 400
    
    try:
        source_entity = get_entity_by_type_and_id(source_type, source_id, user_id)
        target_entity = get_entity_by_type_and_id(target_type, target_id, user_id)
        
        current_app.logger.info(f'📋 link_items: source_entity={source_entity}, target_entity={target_entity}')
        
        if not source_entity or not target_entity:
            current_app.logger.error('❌ link_items: Source or target entity not found')
            return {"error": "Source or target entity not found"}, 404
        
        if source_type == 'list' and target_type in ['group', 'project']:
            current_app.logger.info(f'🔗 link_items: Linking List to {target_type}')
            childes_order = target_entity.childes_order or []
            if source_entity.id not in childes_order:
                childes_order.append(source_entity.id)
                target_entity.childes_order = childes_order
                current_app.logger.info(f'✅ link_items: Updated childes_order: {childes_order}')
        elif source_type == 'group' and target_type == 'project':
            current_app.logger.info(f'🔗 link_items: Linking Group to Project')
            childes_order = target_entity.childes_order or []
            if source_entity.id not in childes_order:
                childes_order.append(source_entity.id)
                target_entity.childes_order = childes_order
                current_app.logger.info(f'✅ link_items: Updated childes_order: {childes_order}')
        else:
            current_app.logger.error(f'❌ link_items: Invalid link combination - source: {source_type}, target: {target_type}')
            return {"error": "Invalid link combination"}, 400
        
        db.session.add(target_entity)
        db.session.commit()
        current_app.logger.info('✅ link_items: Successfully linked items')
        
        return {"success": True, "parent": target_entity.to_dict()}, 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'link_items failed: {e}', exc_info=True)
        return {"error": "Internal server error"}, 500


def move_items(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided")
    
    source_type = data.get('source_type')
    source_id = data.get('source_id')
    target_type = data.get('target_type')
    target_id = data.get('target_id')
    # Parameters to specify the exact parent to remove from
    source_parent_id = data.get('source_parent_id')
    source_parent_type = data.get('source_parent_type')
    
    current_app.logger.info(f'📦 move_items called: source_type={source_type}, source_id={source_id}, target_type={target_type}, target_id={target_id}, source_parent_id={source_parent_id}, source_parent_type={source_parent_type}, user_id={user_id}')
    
    if not source_id or not source_type:
        current_app.logger.error('❌ move_items: Missing required parameters')
        return {"error": "source_type and source_id are required"}, 400
    
    # Require source_parent_id
    if not source_parent_id:
        current_app.logger.error('❌ move_items: Missing source_parent_id')
        return {"error": "source_parent_id is required"}, 400
    
    # For non-general list sources, require source_parent_type
    if source_parent_id != 'generalList' and not source_parent_type:
        current_app.logger.error('❌ move_items: Missing source_parent_type')
        return {"error": "source_parent_type is required"}, 400
    
    # For groups, they cannot be moved from general list
    if source_type == 'group' and source_parent_id == 'generalList':
        current_app.logger.error('❌ move_items: Groups cannot be moved from general list')
        return {"error": "Groups cannot be moved from general list"}, 400
    
    try:
        source_entity = get_entity_by_type_and_id(source_type, source_id, user_id)
        
        if not source_entity:
            current_app.logger.error('❌ move_items: Source entity not found')
            return {"error": "Source entity not found"}, 404

        old_parents = []
        # Remove from old parents
        if source_type == 'list':
            if source_parent_id == 'generalList':
                # Remove from general list
                if hasattr(source_entity, 'in_general_list'):
                    source_entity.in_general_list = False
                    db.session.add(source_entity)
            else:
                # Remove from specific parent only
                parent_entity = get_entity_by_type_and_id(source_parent_type, source_parent_id, user_id)
                if parent_entity:
                    old_parents.append(parent_entity)
                    if parent_entity.childes_order and source_id in parent_entity.childes_order:
                        new_order = list(parent_entity.childes_order)
                        new_order.remove(source_id)
                        parent_entity.childes_order = new_order
                        db.session.add(parent_entity)
                    if parent_entity in source_entity.groups:
                        source_entity.groups.remove(parent_entity)
                    elif parent_entity in source_entity.projects:
                        source_entity.projects.remove(parent_entity)
        elif source_type == 'group':
            # Remove from specific parent only (groups cannot be in general list, already checked above)
            parent_entity = get_entity_by_type_and_id(source_parent_type, source_parent_id, user_id)
            if parent_entity:
                old_parents.append(parent_entity)
                if parent_entity.childes_order and source_id in parent_entity.childes_order:
                    new_order = list(parent_entity.childes_order)
                    new_order.remove(source_id)
                    parent_entity.childes_order = new_order
                    db.session.add(parent_entity)
                if parent_entity in source_entity.projects:
                    source_entity.projects.remove(parent_entity)

        target_entity = None
        if target_id == 'generalList':
            # Move to general list
            if hasattr(source_entity, 'in_general_list'):
                source_entity.in_general_list = True
                db.session.add(source_entity)
        else:
            if not target_type or not target_id:
                return {"error": "target_type and target_id are required"}, 400

            target_entity = get_entity_by_type_and_id(target_type, target_id, user_id)
            if not target_entity:
                current_app.logger.error('❌ move_items: Target entity not found')
                return {"error": "Target entity not found"}, 404

            # Add to new parent
            if target_type == 'group' and source_type == 'list':
                source_entity.groups.append(target_entity)
            elif target_type == 'project':
                if source_type == 'list' or source_type == 'group':
                    source_entity.projects.append(target_entity)
                else:
                    return {"error": "Invalid move combination"}, 400
            else:
                return {"error": "Invalid target for move"}, 400

            childes_order = target_entity.childes_order or []
            if source_entity.id not in childes_order:
                new_order = list(childes_order)
                new_order.append(source_entity.id)
                target_entity.childes_order = new_order
                db.session.add(target_entity)
            
            if hasattr(source_entity, 'in_general_list'):
                source_entity.in_general_list = False
                db.session.add(source_entity)

        db.session.commit()
        current_app.logger.info('✅ move_items: Successfully moved items')
        
        response_data = {"success": True}
        if target_entity:
            response_data["parent"] = target_entity.to_dict()
        
        response_data["old_parents"] = [p.to_dict() for p in old_parents]
        response_data["source_entity"] = source_entity.to_dict()

        return response_data, 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'move_items failed: {e}', exc_info=True)
        return {"error": "Internal server error"}, 500


def _normalize_orders_by_type(entity_type, user_id):
    """Normalize order values for all entities of the same type"""
    siblings = entity_type.query.filter_by(user_id=user_id).order_by(entity_type.order).all()
    
    for i, sibling in enumerate(siblings):
        sibling.order = i
        db.session.add(sibling)
    
    db.session.commit()
