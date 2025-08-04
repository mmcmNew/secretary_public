from flask import current_app

from .models import db, Task, List, Group, Project, Status
from .utils import _parse_iso_datetime


def parse_entity(entity_id, user_id, entity_type):
    """Общая функция для извлечения сущности по ID и типу"""
    try:
        entity_id_int = int(str(entity_id).split('_')[1])
    except (ValueError, IndexError):
        raise ValueError(f"Invalid {entity_type} ID format")

    model_map = {
        'group': Group,
        'project': Project,
        'list': List,
    }

    model = model_map.get(entity_type)
    if not model:
        raise ValueError(f"Unsupported entity type: {entity_type}")

    instance = model.query.filter_by(id=entity_id_int, user_id=user_id).first()
    if not instance:
        raise ValueError(f"{entity_type.capitalize()} not found")
    return instance


def get_entity_by_id(raw_id, user_id):
    if isinstance(raw_id, int):
        obj = List.query.filter_by(id=raw_id, user_id=user_id).first()
        current_app.logger.debug(f"Resolved int ID {raw_id} → {obj}")
        return obj

    raw_id = str(raw_id)
    try:
        if raw_id.startswith('group_'):
            obj = Group.query.filter_by(id=int(raw_id.split('_')[1]), user_id=user_id).first()
            current_app.logger.debug(f"Resolved group ID {raw_id} → {obj}")
            return obj
        elif raw_id.startswith('project_'):
            obj = Project.query.filter_by(id=int(raw_id.split('_')[1]), user_id=user_id).first()
            current_app.logger.debug(f"Resolved project ID {raw_id} → {obj}")
            return obj
        else:
            obj = List.query.filter_by(id=int(raw_id), user_id=user_id).first()
            current_app.logger.debug(f"Resolved list ID {raw_id} → {obj}")
            return obj
    except Exception as e:
        current_app.logger.error(f"get_entity_by_id failed for {raw_id}: {e}")
        raise ValueError(f"Invalid ID format: {raw_id}")


def link_group_list(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for link_group_list")

    source = None
    target = None

    try:
        source_id = data.get('source_id')
        target_id = data.get('target_id')

        if not source_id or not target_id:
            return {"error": "source_id and target_id must be provided"}, 400

        source = get_entity_by_id(source_id, user_id)
        if not source:
            return {"error": "Source entity not found"}, 404

        target = get_entity_by_id(target_id, user_id)
        if not target:
            return {"error": "Target entity not found"}, 404

        current_app.logger.debug(f"source: {source}, type: {type(source)}")
        current_app.logger.debug(f"target: {target}, type: {type(target)}")

        # Обработка связей
        if str(target_id).startswith('group_'):
            if isinstance(source, List) and target not in source.groups:
                source.groups.append(target)
            elif isinstance(source, Group) and target not in source.projects:
                source.projects.append(target)

        elif str(target_id).startswith('project_'):
            if isinstance(source, List) and target not in source.projects:
                source.projects.append(target)
            elif isinstance(source, Group) and target not in source.projects:
                source.projects.append(target)

        elif isinstance(target_id, int) or str(target_id).isdigit():
            if not isinstance(source, Task):
                return {"error": "Only tasks can be linked to list"}, 400
            if source_id not in target.childes_order:
                updated = target.childes_order.copy()
                updated.append(source_id)
                target.childes_order = updated

        # Сохраняем
        db.session.add(source)
        db.session.add(target)
        db.session.commit()

        return {"success": True}, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'link_group_list failed: {e}', exc_info=True)
        return {"error": "Internal server error"}, 500


def delete_from_childes(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for delete_from_childes")
    # print(f'delete_from_childes: data: {data}')
    try:
        source_id = data['source_id']
        group_id = data.get('group_id', None)

        # print(f'delete_from_childes: source_id: {source_id}, target_id: {group_id}')

        if group_id in ['my_day', 'tasks', 'important', 'all', 'events']:
            return {"success": True}, 200

        # Обработка source_id
        # Если source_id уже является целым числом, используем его напрямую
        if isinstance(source_id, int):
            source_id_int = source_id
            source = List.query.filter_by(id=source_id_int, user_id=user_id).first()
        elif str(source_id).startswith('task_'):
            try:
                source_id_int = int(source_id.split('_')[1])
                source = Task.query.filter_by(id=source_id_int, user_id=user_id).first()
            except (ValueError, IndexError):
                return {"error": "Invalid source_id format for task"}, 400
        elif str(source_id).startswith('group_'):
            try:
                source_id_int = int(source_id.split('_')[1])
                source = Group.query.filter_by(id=source_id_int, user_id=user_id).first()
            except (ValueError, IndexError):
                return {"error": "Invalid source_id format for group"}, 400
        else:
            # Предполагаем, что это ID списка
            try:
                source_id_int = int(source_id)
                source = List.query.filter_by(id=source_id_int, user_id=user_id).first()
            except ValueError:
                return {"error": "Invalid source_id format for list"}, 400

        if (isinstance(source, List) or isinstance(source, Group) or isinstance(source, Project)) and group_id is None:
            source.in_general_list = False
            db.session.add(source)
            db.session.commit()
            return {"success": True}, 200

        # Обработка group_id
        if group_id is not None:
            # Если group_id уже является целым числом, используем его напрямую
            if isinstance(group_id, int):
                group_id_int = group_id
                group = List.query.filter_by(id=group_id_int, user_id=user_id).first()
            elif str(group_id).startswith('task_'):
                try:
                    group_id_int = int(group_id.split('_')[1])
                    group = Task.query.filter_by(id=group_id_int, user_id=user_id).first()
                except (ValueError, IndexError):
                    return {"error": "Invalid group_id format for task"}, 400
            elif str(group_id).startswith('group_'):
                try:
                    group_id_int = int(group_id.split('_')[1])
                    group = Group.query.filter_by(id=group_id_int, user_id=user_id).first()
                except (ValueError, IndexError):
                    return {"error": "Invalid group_id format for group"}, 400
            elif str(group_id).startswith('project_'):
                try:
                    group_id_int = int(group_id.split('_')[1])
                    group = Project.query.filter_by(id=group_id_int, user_id=user_id).first()
                except (ValueError, IndexError):
                    return {"error": "Invalid group_id format for project"}, 400
            else:
                # Предполагаем, что это ID списка
                try:
                    group_id_int = int(group_id)
                    group = List.query.filter_by(id=group_id_int, user_id=user_id).first()
                except ValueError:
                    return {"error": "Invalid group_id format for list"}, 400

        if source and group_id is not None and group:
            # Удаление элемента из списка детей
            if source_id_int in group.childes_order:
                updated_childes_order = group.childes_order.copy()
                updated_childes_order.remove(source_id_int)
                group.childes_order = updated_childes_order

            # Разрыв связи между source и group
            if isinstance(source, Task):
                if group in source.lists:
                    source.lists.remove(group)
                elif group in source.parent_tasks:
                    source.parent_tasks.remove(group)
            elif isinstance(source, List):
                if group in source.groups:
                    source.groups.remove(group)
                elif group in source.projects:
                    source.projects.remove(group)
            elif isinstance(source, Group):
                if group in source.projects:
                    source.projects.remove(group)

            db.session.add(group)
            db.session.add(source)
            db.session.commit()

        return {"success": True}, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return {"error": str(e)}, 500


def link_task(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for link_task")
    try:
        task_id = data['task_id']
        target_id = data['list_id']
        action = data.get('action', 'link')
        source_list_id = data.get('source_list_id')

        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if str(target_id).startswith('task_'):
            try:
                target_id_int = int(target_id.split('_')[1])
            except (ValueError, IndexError):
                return {"error": "Invalid target_id format for task"}, 400
            
            if task_id == target_id_int or task in task.parent_tasks or task in task.subtasks:
                return {"error": "Task cannot be linked to itself"}, 400
            target = Task.query.filter_by(id=target_id_int, user_id=user_id).first()
            if task and target and task_id not in [t.id for t in target.subtasks]:
                task.parent_tasks.append(target)
        else:
            try:
                target_id_int = int(target_id)
            except ValueError:
                return {"error": "Invalid target_id format for list"}, 400
            target = List.query.filter_by(id=target_id_int, user_id=user_id).first()
            if task and target and task_id not in [t.id for t in target.tasks]:
                task.lists.append(target)
        if target and task and task_id not in target.childes_order:
            updated_childes_order = target.childes_order.copy() or []
            updated_childes_order.append(task_id)
            target.childes_order = updated_childes_order

        db.session.add(target)
        db.session.add(task)
        db.session.commit()

        if action == 'move' and source_list_id:
            delete_from_childes({'source_id': f'task_{task_id}', 'group_id': source_list_id}, user_id=user_id)

        return {"success": True}, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'link_task: Error {e}')
        return {"error": str(e)}, 500