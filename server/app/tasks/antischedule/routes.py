from . import antischedule_bp
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required
from .handlers import (
    get_anti_schedule,
    add_anti_task,
    edit_anti_task,
    del_anti_task,
)
from app import db, cache
from flask_jwt_extended import current_user
from app.tasks.models import DataVersion
from app.socketio_utils import notify_data_update, notify_task_change


def make_cache_key(prefix):
    def _key():
        version = DataVersion.get_version('tasksVersion')
        return f"{prefix}:{current_user.id}:{version}:{request.full_path}"
    return _key


@antischedule_bp.route('/tasks/get_anti_schedule', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix=make_cache_key('anti'))
def get_anti_schedule_route():
    current_app.logger.info('get_anti_schedule')
    user_id = current_user.id
    result, status_code = get_anti_schedule(user_id)
    if status_code == 200:
        version = DataVersion.get_version('tasksVersion')
        response = jsonify(result)
        response.set_etag(version)
        if request.if_none_match and version in request.if_none_match:
            return '', 304
        return response
    return jsonify(result), status_code


@antischedule_bp.route('/tasks/add_anti_task', methods=['POST'])
@jwt_required()
def add_anti_task_route():
    data = request.get_json()
    user_id = current_user.id
    result, status_code = add_anti_task(data, user_id)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code


@antischedule_bp.route('/tasks/edit_anti_task', methods=['PUT'])
@jwt_required()
def edit_anti_task_route():
    data = request.get_json()
    result, status_code = edit_anti_task(data)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code


@antischedule_bp.route('/tasks/del_anti_task', methods=['DELETE'])
@jwt_required()
def del_anti_task_route():
    data = request.get_json()
    result, status_code = del_anti_task(data)
    response = jsonify(result)
    if status_code == 200:
        new_version = DataVersion.update_version('tasksVersion')
        notify_data_update(tasksVersion=new_version)
        response.set_etag(new_version)
    return response, status_code

