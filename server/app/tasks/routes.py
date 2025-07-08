# to_do_app/routes.py
from . import to_do_app
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required
from .handlers import (get_lists_and_groups_data, add_object, add_task, edit_list,
                       add_subtask, edit_task, change_task_status, get_tasks, del_task,
                       link_group_list, delete_from_childes, link_task, get_anti_schedule,
                       add_anti_task, edit_anti_task, del_anti_task)
from .versioning import check_version
from .models import DataVersion
from app import db
from flask_jwt_extended import current_user
from app.socketio_utils import notify_data_update, notify_task_change


@to_do_app.route('/tasks/get_lists', methods=['GET'])
# @check_version()
@jwt_required()
def get_lists_and_groups():
    client_timezone = int(request.args.get('time_zone', 0))
    data = get_lists_and_groups_data(client_timezone)
    if isinstance(data, dict) and 'error' in data:
        return jsonify(data), 500
    data['tasksVersion'] = DataVersion.get_version('tasksVersion')
    return data


@to_do_app.route('/tasks/add_list', methods=['POST'])
@jwt_required()
def add_object_route():
    data = request.get_json()
    result, status_code = add_object(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/add_task', methods=['POST'])
@jwt_required()
def add_task_route():
    data = request.get_json()
    result, status_code = add_task(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
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
    result, status_code = add_subtask(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/edit_task', methods=['PUT'])
@jwt_required()
def edit_task_route():
    data = request.get_json()
    result, status_code = edit_task(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/change_status', methods=['PUT'])
@jwt_required()
def change_task_status_route():
    data = request.get_json()
    result, status_code = change_task_status(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/get_tasks', methods=['GET'])
@jwt_required()
def get_tasks_route():
    list_id = request.args.get('list_id')
    client_timezone = int(request.args.get('time_zone', 0))
    # current_app.logger.info(f'get_tasks, list_id: {list_id}')
    result, status_code = get_tasks(list_id, client_timezone)
    if status_code == 200:
        result['tasksVersion'] = DataVersion.get_version('tasksVersion')
    return jsonify(result), status_code


@to_do_app.route('/tasks/get_anti_schedule', methods=['GET'])
@jwt_required()
@check_version('tasksVersion')
def get_anti_schedule_route():
    current_app.logger.info('get_anti_schedule')
    result, status_code = get_anti_schedule()
    if status_code == 200:
        result['tasksVersion'] = DataVersion.get_version('tasksVersion')
    return jsonify(result), status_code


@to_do_app.route('/tasks/add_anti_task', methods=['POST'])
@jwt_required()
def add_anti_task_route():
    data = request.get_json()
    result, status_code = add_anti_task(data)
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
    result, status_code = del_task(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/link_group_list', methods=['PUT'])
@jwt_required()
def link_group_list_route():
    data = request.get_json()
    result, status_code = link_group_list(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/delete_from_childes', methods=['DELETE'])
@jwt_required()
def delete_from_childes_route():
    data = request.get_json()
    result, status_code = delete_from_childes(data)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
    return jsonify(result), status_code


@to_do_app.route('/tasks/link_task', methods=['PUT'])
@jwt_required()
def link_task_route():
    data = request.get_json()
    result, status_code = link_task(data)
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

    # Пользователь хранит task_types словарем: {id: {name, color, description}}
    # Но клиент ожидает список опций. Преобразуем словарь в список,
    # сохраняя обратный доступ по id на стороне сервера.
    task_types = current_user.task_types or {}
    types_list = [
        {
            "value": int(type_id),
            "label": info.get("name"),
            "color": info.get("color"),
            "description": info.get("description"),
        }
        for type_id, info in task_types.items()
    ]

    fields["type_id"]["options"] = types_list

    return jsonify(fields)


@to_do_app.route('/tasks/task_types', methods=['GET'])
@jwt_required()
def get_task_types_route():
    return jsonify(current_user.task_types or {})


@to_do_app.route('/tasks/task_types', methods=['POST'])
@jwt_required()
def add_task_type_route():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Name required'}), 400
    color = data.get('color') or '#3788D8'
    description = data.get('description') or ''
    task_types = current_user.task_types or {}
    new_id = max([int(i) for i in task_types.keys()] or [0]) + 1
    task_types[str(new_id)] = {'name': name, 'color': color, 'description': description}
    current_user.task_types = task_types
    db.session.add(current_user)
    db.session.commit()
    return jsonify({'id': new_id, 'name': name, 'color': color, 'description': description}), 201


@to_do_app.route('/tasks/task_types/<int:type_id>', methods=['PUT'])
@jwt_required()
def edit_task_type_route(type_id):
    data = request.get_json() or {}
    task_types = current_user.task_types or {}
    if str(type_id) not in task_types:
        return jsonify({'error': 'Not found'}), 404
    info = task_types[str(type_id)]
    info.update({
        'name': data.get('name', info.get('name')),
        'color': data.get('color', info.get('color')),
        'description': data.get('description', info.get('description')),
    })
    current_user.task_types = task_types
    db.session.add(current_user)
    db.session.commit()
    return jsonify({'id': type_id, **info})


@to_do_app.route('/tasks/task_types/<int:type_id>', methods=['DELETE'])
@jwt_required()
def delete_task_type_route(type_id):
    task_types = current_user.task_types or {}
    if str(type_id) not in task_types:
        return jsonify({'error': 'Not found'}), 404
    task_types.pop(str(type_id))
    current_user.task_types = task_types
    db.session.add(current_user)
    db.session.commit()
    return jsonify({'result': 'deleted'})
