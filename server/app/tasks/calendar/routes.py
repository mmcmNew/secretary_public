from . import calendar_bp
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, current_user
from .handlers import (
    get_calendar_events,
    get_task_override_by_id,
    create_task_override,
    update_task_override,
    delete_task_override,
)
from app.tasks.models import DataVersion


def make_cache_key(prefix):
    def _key():
        version = DataVersion.get_version('tasksVersion')
        return f"{prefix}:{current_user.id}:{version}:{request.full_path}"
    return _key


@calendar_bp.route('/tasks/get_calendar_events', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix=make_cache_key('tasks'))
def get_calendar_events_route():
    start = request.args.get('start')
    end = request.args.get('end')
    user_id = current_user.id
    result, status_code = get_calendar_events(start, end, user_id=user_id)
    if status_code == 200:
        version = DataVersion.get_version('tasksVersion')
        response = jsonify(result)
        response.set_etag(version)
        if request.if_none_match and version in request.if_none_match:
            return '', 304
        return response
    return jsonify(result), status_code


@calendar_bp.route('/tasks/override/<int:override_id>', methods=['GET'])
@jwt_required()
def get_task_override_route(override_id):
    user_id = current_user.id
    result, status_code = get_task_override_by_id(override_id, user_id=user_id)
    return jsonify(result), status_code


@calendar_bp.route('/tasks/override', methods=['POST'])
@jwt_required()
def create_task_override_route():
    data = request.get_json()
    user_id = current_user.id
    current_app.logger.info(create_task_override_route)
    result, status_code = create_task_override(data, user_id=user_id)
    return jsonify(result), status_code


@calendar_bp.route('/tasks/override/<int:override_id>', methods=['PATCH'])
@jwt_required()
def update_task_override_route(override_id):
    data = request.get_json()
    user_id = current_user.id
    result, status_code = update_task_override(override_id, data, user_id=user_id)
    return jsonify(result), status_code


@calendar_bp.route('/tasks/override/<int:override_id>', methods=['DELETE'])
@jwt_required()
def delete_task_override_route(override_id):
    user_id = current_user.id
    result, status_code = delete_task_override(override_id, user_id=user_id)
    return jsonify(result), status_code

