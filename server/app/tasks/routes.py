# to_do_app/routes.py
from . import to_do_app
from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required
from .list_handlers import (
    get_lists_and_groups_data,
    get_lists_tree_data,
    add_object,
    edit_list,
)
from .task_handlers import (
    add_task,
    add_subtask,
    edit_task,
    change_task_status,
    get_tasks,
    get_tasks_by_ids,
    del_task,
    get_subtasks_by_parent_id,
)
from .entity_handlers import (
    link_group_list,
    delete_from_childes,
    link_task,
    sort_items,
    sort_items_in_container,
    link_items,
    move_items,
)
from .models import DataVersion, TaskTypeGroup, TaskType
from app import db, cache
from flask_jwt_extended import current_user
from app.socketio_utils import notify_data_update, notify_task_change


def make_cache_key(prefix, version_key='tasksVersion'):
    def _key():
        version = DataVersion.get_version(version_key)
        return f"{prefix}:{current_user.id}:{version}:{request.full_path}"
    return _key

def etag(version_key):
    """
    Декоратор, который добавляет обработку ETag к маршруту Flask.
    Обернутая функция должна возвращать данные для json-сериализации
    или кортеж (данные, код_статуса).
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Вызываем исходную функцию маршрута
            rv = f(*args, **kwargs)

            data, status_code = rv if isinstance(rv, tuple) else (rv, 200)

            # Не добавляем ETag для ответов с ошибками
            if status_code >= 300:
                return jsonify(data), status_code

            version = DataVersion.get_version(version_key)
            response = jsonify(data)
            if version is not None:
                response.set_etag(version)
            
            # make_conditional вернет 304 Not Modified, если ETag совпадает
            return response.make_conditional(request)
        return decorated_function
    return decorator


@to_do_app.route('/tasks/get_lists', methods=['GET'])
@jwt_required()
# @cache.cached(timeout=60, key_prefix=make_cache_key('lists', 'tasksVersion'))
# @etag('tasksVersion')
def get_lists_and_groups():
    client_timezone = request.args.get('time_zone', 'UTC')
    user_id = current_user.id
    data = get_lists_and_groups_data(client_timezone, user_id=user_id)
    if isinstance(data, dict) and 'error' in data:
        return data, 500
    return data


@to_do_app.route('/tasks/get_lists_tree', methods=['GET'])
@jwt_required()
# @etag('tasksVersion')
# @cache.cached(timeout=60, key_prefix=make_cache_key('lists', 'tasksVersion'))
def get_lists_tree():
    client_timezone = request.args.get('time_zone', 'UTC')
    user_id = current_user.id
    data = get_lists_tree_data(client_timezone, user_id=user_id)
    if isinstance(data, dict) and 'error' in data:
        return data, 500
    return data


@to_do_app.route('/tasks/add_list', methods=['POST'])
@jwt_required()
def add_object_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = add_object(data, user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code


@to_do_app.route('/tasks/add_task', methods=['POST'])
@jwt_required()
def add_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = add_task(data, user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
        if 'task' in result:
            lists_data = get_lists_and_groups_data(user_id=user_id)
            calendar_events = [result['task']]
            notify_task_change('added', result['task'], data.get('listId'), lists_data=lists_data, calendar_events=calendar_events)
    return response, status_code


@to_do_app.route('/tasks/edit_list', methods=['PUT'])
@jwt_required()
def edit_list_route():
    try:
        data = request.get_json()
    except Exception as e:
        current_app.logger.error(f'edit_list_route: Failed to parse JSON: {e}')
        return jsonify({'success': False, 'message': 'Invalid JSON data'}), 400
    
    if data is None:
        current_app.logger.error('edit_list_route: No JSON data provided')
        return jsonify({'success': False, 'message': 'Invalid JSON data'}), 400
    
    current_app.logger.info(f'edit_list_route: data: {data}')
    if not isinstance(data, dict):
        current_app.logger.error(f'edit_list_route: Invalid data type: {type(data)}, data: {data}')
        return jsonify({'success': False, 'message': 'Invalid JSON data'}), 400
    result, status_code = edit_list(data, user_id=current_user.id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code


@to_do_app.route('/tasks/add_subtask', methods=['POST'])
@jwt_required()
def add_subtask_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = add_subtask(data, user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code


@to_do_app.route('/tasks/edit_task', methods=['PUT'])
@jwt_required()
def edit_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = edit_task(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
        if 'task' in result:
            lists_data = get_lists_and_groups_data(user_id=user_id)
            calendar_events = [result['task']]
            notify_task_change('updated', result['task'], data.get('listId'), lists_data=lists_data, calendar_events=calendar_events)
    return response, status_code


@to_do_app.route('/tasks/change_status', methods=['PUT'])
@jwt_required()
def change_task_status_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = change_task_status(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
        lists_data = get_lists_and_groups_data(user_id=user_id)
        # Для календаря: если есть changed_ids, отправляем задачи по этим id
        calendar_events = None
        if 'changed_ids' in result:
            from .models import Task
            changed_tasks = Task.query.filter(Task.id.in_(result['changed_ids'])).all()
            calendar_events = [t.to_dict() for t in changed_tasks]
            notify_task_change('status_changed', {'changed_ids': result['changed_ids'], 'status_id': data.get('status_id'), 'completed_at': data.get('completed_at')}, data.get('listId'), lists_data=lists_data, calendar_events=calendar_events)
        elif 'task' in result:
            calendar_events = [result['task']]
            notify_task_change('status_changed', result['task'], data.get('listId'), lists_data=lists_data, calendar_events=calendar_events)
    return response, status_code


@to_do_app.route('/tasks/get_tasks', methods=['GET'])
@jwt_required()
@etag('tasksVersion')
def get_tasks_route():
    list_id = request.args.get('list_id', None)
    if not list_id:
        return {'error': 'list_id is required'}, 400
    start = request.args.get('start')
    end = request.args.get('end')
    client_timezone = request.args.get('time_zone', 'UTC')
    user_id = current_user.id
    # current_app.logger.info(f'get_tasks, list_id: {list_id}')
    return get_tasks(list_id, client_timezone, start, end, user_id=user_id)




@to_do_app.route('/tasks/get_tasks_by_ids', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix=make_cache_key('tasks_by_ids', 'tasksVersion'))
@etag('tasksVersion')
def get_tasks_by_ids_route():
    ids_param = request.args.get('ids', '')
    try:
        ids = [i.strip() for i in ids_param.split(',') if i.strip()]
    except ValueError:
        return {'error': 'Invalid ids'}, 400
    user_id = current_user.id
    return get_tasks_by_ids(ids, user_id=user_id)


@to_do_app.route('/tasks/del_task', methods=['DELETE'])
@jwt_required()
def del_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = del_task(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
        lists_data = get_lists_and_groups_data(user_id=user_id)
        calendar_events = [{'id': data.get('taskId'), 'deleted': True}]
        notify_task_change('deleted', {'id': data.get('taskId')}, data.get('listId'), lists_data=lists_data, calendar_events=calendar_events)
    return response, status_code


@to_do_app.route('/tasks/link_group_list', methods=['PUT'])
@jwt_required()
def link_group_list_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = link_group_list(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code


@to_do_app.route('/tasks/delete_from_childes', methods=['DELETE'])
@jwt_required()
def delete_from_childes_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = delete_from_childes(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code


@to_do_app.route('/tasks/link_task', methods=['PUT'])
@jwt_required()
def link_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = link_task(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code




@to_do_app.route('/tasks/sort_items', methods=['PUT'])
@jwt_required()
def sort_items_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = sort_items(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code

@to_do_app.route('/tasks/sort_items_in_container', methods=['PUT'])
@jwt_required()
def sort_items_in_container_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = sort_items_in_container(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code

@to_do_app.route('/tasks/link_items', methods=['PUT'])
@jwt_required()
def link_items_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = link_items(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code

@to_do_app.route('/tasks/move_items', methods=['PUT'])
@jwt_required()
def move_items_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = move_items(data, user_id=user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code

@to_do_app.route('/tasks/move_list_or_group', methods=['PUT'])
@jwt_required()
def move_list_or_group_route():
    """Legacy route for backward compatibility"""
    data = request.get_json()
    user_id = current_user.id
    action = data.get('action', 'move')
    
    if action == 'sort':
        # Определяем тип сортировки
        if 'container_id' in data:
            result, status_code = sort_items_in_container(data, user_id=user_id)
        else:
            result, status_code = sort_items(data, user_id=user_id)
    elif action == 'link':
        result, status_code = link_items(data, user_id=user_id)
    else:
        result, status_code = move_items(data, user_id=user_id)
    
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code


@to_do_app.route('/tasks/add_to_general_list', methods=['PUT'])
@jwt_required()
def add_to_general_list_route():
    data = request.get_json()
    user_id = current_user.id
    item_id = data.get('item_id')
    
    if not item_id:
        return jsonify({'error': 'item_id is required'}), 400
    
    try:
        from .entity_handlers import get_entity_by_id
        entity = get_entity_by_id(item_id, user_id)
        if not entity:
            return jsonify({'error': 'Entity not found'}), 404
        
        entity.in_general_list = True
        db.session.add(entity)
        db.session.commit()
        
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response = jsonify({'success': True})
        response.set_etag(new_version)
        return response, 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'add_to_general_list failed: {e}', exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@to_do_app.route('/tasks/fields_config', methods=['GET'])
@jwt_required()
@cache.cached(timeout=3600, key_prefix=make_cache_key('fields_config', 'taskTypesVersion'))
@etag('taskTypesVersion')
def get_fields_config():
    # Заглушка полей задач
    fields = {
        "range": {"id": 1, "type": "range", "name": "Срок"},
        "completed_at": {"id": 17, "type": "datetime", "name": "Дата выполнения"},
        "divider1": {"id": 3, "type": "divider"},
        "is_background": {"id": 4, "type": "toggle", "name": "Фоновая задача"},
        "color": {"id": 5, "type": "color", "name": "Цвет на календаре"},
        "divider2": {"id": 6, "type": "divider"},
        "reward": {"id": 7, "type": "toggle", "name": "Награда"},
        "cost": {"id": 8, "type": "number", "name": "Добавить файл"},
        "divider3": {"id": 9, "type": "divider"},
        "priority_id": {
            "id": 10,
            "type": "select",
            "name": "Приоритет",
            "options": [
                {"value": 1, "label": "Low"},
                {"value": 2, "label": "Medium"},
                {"value": 3, "label": "High"}
            ]
        },
        "interval_id": {
            "id": 11,
            "type": "select",
            "name": "Повтор",
            "options": [
                {"value": 1, "label": "День"},
                {"value": 2, "label": "Неделя"},
                {"value": 3, "label": "Месяц"},
                {"value": 4, "label": "Год"},
                {"value": 5, "label": "Рабочие дни"},
                {"value": None, "label": "Без повтора"}
            ]
        },
        "is_infinite": {"id": 12, "type": "toggle", "name": "Бесконечно повторять на календаре"},
        "divider4": {"id": 13, "type": "divider"},
        "type_id": {
            "id": 14,
            "type": "select",
            "name": "Тип задачи",
            "groupBy": "type",
            "options": []  # будет заполнено данными из БД
        },
        "attachments": {"id": 15, "type": "string", "name": "Добавить файл"},
        "note": {"id": 16, "type": "text", "name": "Заметка"}
    }

    task_types = TaskType.query.filter_by(user_id=current_user.id, is_active=True).all()
    groups = TaskTypeGroup.query.filter_by(user_id=current_user.id).all()
    group_map = {g.id: g.name for g in groups}
    types_list = [
        {
            "value": t.id,
            "label": t.name,
            "color": t.color,
            "description": t.description,
            "group_id": t.group_id,
            "groupLabel": group_map.get(t.group_id, "Без группы"),
        }
        for t in task_types
    ]

    fields["type_id"]["options"] = types_list

    return fields


@to_do_app.route('/tasks/task_type_groups', methods=['GET'])
@jwt_required()
@cache.cached(timeout=3600, key_prefix=make_cache_key('task_type_groups', 'taskTypesVersion'))
@etag('taskTypesVersion')
def get_task_type_groups():
    groups = TaskTypeGroup.query.filter_by(user_id=current_user.id).all()
    return {g.id: g.to_dict() for g in groups}


@to_do_app.route('/tasks/task_type_groups', methods=['POST'])
@jwt_required()
def add_task_type_group():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Name required'}), 400
    group = TaskTypeGroup(
        user_id=current_user.id,
        name=name,
        color=data.get('color'),
        order=data.get('order'),
        is_active=data.get('is_active', True),
        description=data.get('description')
    )
    db.session.add(group)
    db.session.commit()
    new_version = DataVersion.update_version('taskTypesVersion')
    notify_data_update(taskTypesVersion=new_version)
    return jsonify(group.to_dict()), 201, {'ETag': new_version}


@to_do_app.route('/tasks/task_type_groups/<string:group_id>', methods=['PUT'])
@jwt_required()
def edit_task_type_group(group_id):
    group = TaskTypeGroup.query.filter_by(id=group_id, user_id=current_user.id).first()
    if not group:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    group.name = data.get('name', group.name)
    group.color = data.get('color', group.color)
    group.order = data.get('order', group.order)
    group.is_active = data.get('is_active', group.is_active)
    group.description = data.get('description', group.description)
    db.session.commit()
    new_version = DataVersion.update_version('taskTypesVersion')
    notify_data_update(taskTypesVersion=new_version)
    return jsonify(group.to_dict()), 200, {'ETag': new_version}


@to_do_app.route('/tasks/task_type_groups/<string:group_id>', methods=['DELETE'])
@jwt_required()
def delete_task_type_group(group_id):
    group = TaskTypeGroup.query.filter_by(id=group_id, user_id=current_user.id).first()
    if not group:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(group)
    db.session.commit()
    new_version = DataVersion.update_version('taskTypesVersion')
    notify_data_update(taskTypesVersion=new_version)
    return jsonify({'result': 'deleted'}), 200, {'ETag': new_version}


@to_do_app.route('/tasks/task_types', methods=['GET'])
@jwt_required()
@cache.cached(timeout=3600, key_prefix=make_cache_key('task_types', 'taskTypesVersion'))
@etag('taskTypesVersion')
def get_task_types_route():
    types = TaskType.query.filter_by(user_id=current_user.id).all()
    return {t.id: t.to_dict() for t in types}


@to_do_app.route('/tasks/task_types', methods=['POST'])
@jwt_required()
def add_task_type_route():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Name required'}), 400
    group_id = data.get('group_id')
    if group_id is not None:
        group = TaskTypeGroup.query.filter_by(id=group_id, user_id=current_user.id).first()
        if not group:
            return jsonify({'error': 'Group not found'}), 400
    task_type = TaskType(
        user_id=current_user.id,
        name=name,
        color=data.get('color', '#3788D8'),
        description=data.get('description'),
        order=data.get('order'),
        group_id=group_id,
        is_active=data.get('is_active', True)
    )
    db.session.add(task_type)
    db.session.commit()
    new_version = DataVersion.update_version('taskTypesVersion')
    notify_data_update(taskTypesVersion=new_version)
    return jsonify(task_type.to_dict()), 201, {'ETag': new_version}


@to_do_app.route('/tasks/task_types/<string:type_id>', methods=['PUT'])
@jwt_required()
def edit_task_type_route(type_id):
    task_type = TaskType.query.filter_by(id=type_id, user_id=current_user.id).first()
    if not task_type:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    group_id = data.get('group_id', task_type.group_id)
    if group_id != task_type.group_id and group_id is not None:
        group = TaskTypeGroup.query.filter_by(id=group_id, user_id=current_user.id).first()
        if not group:
            return jsonify({'error': 'Group not found'}), 400
    task_type.name = data.get('name', task_type.name)
    task_type.color = data.get('color', task_type.color)
    task_type.description = data.get('description', task_type.description)
    task_type.order = data.get('order', task_type.order)
    task_type.group_id = group_id
    task_type.is_active = data.get('is_active', task_type.is_active)
    db.session.commit()
    new_version = DataVersion.update_version('taskTypesVersion')
    notify_data_update(taskTypesVersion=new_version)
    return jsonify(task_type.to_dict()), 200, {'ETag': new_version}


@to_do_app.route('/tasks/task_types/<string:type_id>', methods=['DELETE'])
@jwt_required()
def delete_task_type_route(type_id):
    task_type = TaskType.query.filter_by(id=type_id, user_id=current_user.id).first()
    if not task_type:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(task_type)
    db.session.commit()
    new_version = DataVersion.update_version('taskTypesVersion')
    notify_data_update(taskTypesVersion=new_version)
    return jsonify({'result': 'deleted'}), 200, {'ETag': new_version}


@to_do_app.route('/tasks/get_subtasks', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix=make_cache_key('subtasks', 'tasksVersion'))
@etag('tasksVersion')
def get_subtasks_route():
    parent_task_id = request.args.get('parent_task_id')
    user_id = current_user.id
    return get_subtasks_by_parent_id(parent_task_id, user_id=user_id)
