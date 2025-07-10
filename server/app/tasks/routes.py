# to_do_app/routes.py
from . import to_do_app
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required
from .handlers import (
    get_lists_and_groups_data,
    add_object,
    add_task,
    edit_list,
    add_subtask,
    edit_task,
    change_task_status,
    get_tasks,
    get_tasks_by_ids,
    del_task,
    link_group_list,
    delete_from_childes,
    link_task,
    get_anti_schedule,
    add_anti_task,
    edit_anti_task,
    del_anti_task,
)
from .versioning import check_version
from .models import DataVersion, TaskTypeGroup, TaskType
from app import db
from flask_jwt_extended import current_user
from app.socketio_utils import notify_data_update, notify_task_change


@to_do_app.route('/tasks/get_lists', methods=['GET'])
@jwt_required()
def get_lists_and_groups():
    client_timezone = int(request.args.get('time_zone', 0))
    user_id = current_user.id
    data = get_lists_and_groups_data(client_timezone, user_id=user_id)
    if isinstance(data, dict) and 'error' in data:
        return jsonify(data), 500
    data['tasksVersion'] = DataVersion.get_version('tasksVersion')
    return data


@to_do_app.route('/tasks/add_list', methods=['POST'])
@jwt_required()
def add_object_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = add_object(data, user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/add_task', methods=['POST'])
@jwt_required()
def add_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = add_task(data, user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        if 'task' in result:
            # Получаем актуальные списки
            lists_data = get_lists_and_groups_data(user_id=user_id)
            # Для календаря: просто отправляем новую задачу
            calendar_events = [result['task']]
            notify_task_change('added', result['task'], data.get('listId'), lists_data=lists_data, calendar_events=calendar_events)
    return jsonify(result), status_code


@to_do_app.route('/tasks/edit_list', methods=['PUT'])
@jwt_required()
def edit_list_route():
    data = request.get_json()
    if not isinstance(data, dict):
        current_app.logger.error(f'edit_list_route: Invalid data type: {type(data)}, data: {data}')
        return jsonify({'success': False, 'message': 'Invalid JSON data'}), 400
    result, status_code = edit_list(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/add_subtask', methods=['POST'])
@jwt_required()
def add_subtask_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = add_subtask(data, user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/edit_task', methods=['PUT'])
@jwt_required()
def edit_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = edit_task(data, user_id=user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        if 'task' in result:
            lists_data = get_lists_and_groups_data(user_id=user_id)
            # Для календаря: отправляем изменённую задачу
            calendar_events = [result['task']]
            notify_task_change('updated', result['task'], data.get('listId'), lists_data=lists_data, calendar_events=calendar_events)
    return jsonify(result), status_code


@to_do_app.route('/tasks/change_status', methods=['PUT'])
@jwt_required()
def change_task_status_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = change_task_status(data, user_id=user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
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
    return jsonify(result), status_code


@to_do_app.route('/tasks/get_tasks', methods=['GET'])
@jwt_required()
def get_tasks_route():
    list_id = request.args.get('list_id')
    start = request.args.get('start')
    end = request.args.get('end')
    client_timezone = int(request.args.get('time_zone', 0))
    user_id = current_user.id
    # current_app.logger.info(f'get_tasks, list_id: {list_id}')
    result, status_code = get_tasks(list_id, client_timezone, start, end, user_id=user_id)
    if status_code == 200:
        result['tasksVersion'] = DataVersion.get_version('tasksVersion')
    return jsonify(result), status_code


@to_do_app.route('/tasks/get_tasks_by_ids', methods=['GET'])
@jwt_required()
def get_tasks_by_ids_route():
    ids_param = request.args.get('ids', '')
    try:
        ids = [int(i) for i in ids_param.split(',') if i.strip()]
    except ValueError:
        return jsonify({'error': 'Invalid ids'}), 400
    user_id = current_user.id
    result, status_code = get_tasks_by_ids(ids, user_id=user_id)
    if status_code == 200:
        result['tasksVersion'] = DataVersion.get_version('tasksVersion')
    return jsonify(result), status_code


@to_do_app.route('/tasks/get_anti_schedule', methods=['GET'])
@jwt_required()
def get_anti_schedule_route():
    current_app.logger.info('get_anti_schedule')
    user_id = current_user.id
    result, status_code = get_anti_schedule(user_id)
    if status_code == 200:
        result['tasksVersion'] = DataVersion.get_version('tasksVersion')
    return jsonify(result), status_code


@to_do_app.route('/tasks/add_anti_task', methods=['POST'])
@jwt_required()
def add_anti_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = add_anti_task(data, user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/edit_anti_task', methods=['PUT'])
@jwt_required()
def edit_anti_task_route():
    data = request.get_json()
    result, status_code = edit_anti_task(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/del_anti_task', methods=['DELETE'])
@jwt_required()
def del_anti_task_route():
    data = request.get_json()
    result, status_code = del_anti_task(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/del_task', methods=['DELETE'])
@jwt_required()
def del_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = del_task(data, user_id=user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        lists_data = get_lists_and_groups_data(user_id=user_id)
        # Для календаря: просто отправляем id удалённой задачи
        calendar_events = [{'id': data.get('taskId'), 'deleted': True}]
        notify_task_change('deleted', {'id': data.get('taskId')}, data.get('listId'), lists_data=lists_data, calendar_events=calendar_events)
    return jsonify(result), status_code


@to_do_app.route('/tasks/link_group_list', methods=['PUT'])
@jwt_required()
def link_group_list_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = link_group_list(data, user_id=user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/delete_from_childes', methods=['DELETE'])
@jwt_required()
def delete_from_childes_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = delete_from_childes(data, user_id=user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/link_task', methods=['PUT'])
@jwt_required()
def link_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = link_task(data, user_id=user_id)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/fields_config', methods=['GET'])
@jwt_required()
def get_fields_config():
    # Заглушка полей задач
    fields = {
        "start": {"id": 1, "type": "datetime", "name": "Дата начала"},
        "end": {"id": 2, "type": "datetime", "name": "Дата завершения"},
        "completed_at": {"id": 17, "type": "datetime", "name": "Дата выполнения"},
        "divider1": {"id": 3, "type": "divider"},
        "is_background": {"id": 4, "type": "toggle", "name": "Фоновая задача"},
        "color": {"id": 5, "type": "color", "name": "Цвет на календаре"},
        "divider1": {"id": 6, "type": "divider"},
        "reward": {"id": 7, "type": "toggle", "name": "Награда"},
        "cost": {"id": 8, "type": "number", "name": "Добавить файл"},
        "divider2": {"id": 9, "type": "divider"},
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
        "divider3": {"id": 13, "type": "divider"},
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

    return jsonify(fields)


@to_do_app.route('/tasks/task_type_groups', methods=['GET'])
@jwt_required()
def get_task_type_groups():
    groups = TaskTypeGroup.query.filter_by(user_id=current_user.id).all()
    return jsonify({g.id: g.to_dict() for g in groups})


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
    return jsonify(group.to_dict()), 201


@to_do_app.route('/tasks/task_type_groups/<int:group_id>', methods=['PUT'])
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
    return jsonify(group.to_dict())


@to_do_app.route('/tasks/task_type_groups/<int:group_id>', methods=['DELETE'])
@jwt_required()
def delete_task_type_group(group_id):
    group = TaskTypeGroup.query.filter_by(id=group_id, user_id=current_user.id).first()
    if not group:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(group)
    db.session.commit()
    return jsonify({'result': 'deleted'})


@to_do_app.route('/tasks/task_types', methods=['GET'])
@jwt_required()
def get_task_types_route():
    types = TaskType.query.filter_by(user_id=current_user.id).all()
    return jsonify({t.id: t.to_dict() for t in types})


@to_do_app.route('/tasks/task_types', methods=['POST'])
@jwt_required()
def add_task_type_route():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Name required'}), 400
    task_type = TaskType(
        user_id=current_user.id,
        name=name,
        color=data.get('color', '#3788D8'),
        description=data.get('description'),
        order=data.get('order'),
        group_id=data.get('group_id'),
        is_active=data.get('is_active', True)
    )
    db.session.add(task_type)
    db.session.commit()
    return jsonify(task_type.to_dict()), 201


@to_do_app.route('/tasks/task_types/<int:type_id>', methods=['PUT'])
@jwt_required()
def edit_task_type_route(type_id):
    task_type = TaskType.query.filter_by(id=type_id, user_id=current_user.id).first()
    if not task_type:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    task_type.name = data.get('name', task_type.name)
    task_type.color = data.get('color', task_type.color)
    task_type.description = data.get('description', task_type.description)
    task_type.order = data.get('order', task_type.order)
    task_type.group_id = data.get('group_id', task_type.group_id)
    task_type.is_active = data.get('is_active', task_type.is_active)
    db.session.commit()
    return jsonify(task_type.to_dict())


@to_do_app.route('/tasks/task_types/<int:type_id>', methods=['DELETE'])
@jwt_required()
def delete_task_type_route(type_id):
    task_type = TaskType.query.filter_by(id=type_id, user_id=current_user.id).first()
    if not task_type:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(task_type)
    db.session.commit()
    return jsonify({'result': 'deleted'})
