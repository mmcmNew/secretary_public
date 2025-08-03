from . import calendar_bp
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, current_user
from app.decorators import etag, update_version_on_success
from .handlers import (
    get_calendar_events,
    # get_task_override_by_id,
    # create_task_override,
    # update_task_override,
    # delete_task_override,
    patch_instance_handler,
)
from app.tasks.models import DataVersion
from app import cache


def make_cache_key(prefix):
    def _key():
        version = DataVersion.get_version('tasksVersion')
        return f"{prefix}:{current_user.id}:{version}:{request.full_path}"
    return _key


@calendar_bp.route('/tasks/get_calendar_events', methods=['GET'])
@jwt_required()
@etag('tasksVersion')
@cache.cached(timeout=60, key_prefix=make_cache_key('tasks'))
def get_calendar_events_route():
    try:
        start = request.args.get('start')
        end = request.args.get('end')
        user_id = current_user.id

        data, status_code = get_calendar_events(start, end, user_id=user_id)
        return jsonify(data), status_code

    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


# @calendar_bp.route('/tasks/override/<int:override_id>', methods=['GET'])
# @jwt_required()
# @cache.cached(timeout=60, key_prefix=make_cache_key('tasks'))
# @etag('tasksVersion')
# def get_task_override_route(override_id):
#     user_id = current_user.id
#     return get_task_override_by_id(override_id, user_id=user_id)


# @calendar_bp.route('/tasks/override', methods=['POST'])
# @jwt_required()
# @update_version_on_success('tasksVersion', success_codes=[201])
# def create_task_override_route():
#     data = request.get_json()
#     user_id = current_user.id
#     current_app.logger.info(create_task_override_route)
#     return create_task_override(data, user_id=user_id)


# @calendar_bp.route('/tasks/override/<int:override_id>', methods=['PATCH'])
# @jwt_required()
# @update_version_on_success('tasksVersion')
# def update_task_override_route(override_id):
#     data = request.get_json()
#     user_id = current_user.id
#     return update_task_override(override_id, data, user_id=user_id)


# @calendar_bp.route('/tasks/override/<int:override_id>', methods=['DELETE'])
# @jwt_required()
# @update_version_on_success('tasksVersion')
# def delete_task_override_route(override_id):
#     user_id = current_user.id
#     return delete_task_override(override_id, user_id=user_id)


@calendar_bp.route('/tasks/instance', methods=['PATCH'])
@jwt_required()
@update_version_on_success('tasksVersion')
def patch_instance_route():
    data = request.get_json()
    user_id = current_user.id
    return patch_instance_handler(data, user_id)
