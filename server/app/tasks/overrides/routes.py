from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from app import db
from ..models import TaskOverride

overrides_bp = Blueprint('overrides', __name__, url_prefix='/task_overrides')

@overrides_bp.route('/', methods=['POST'])
@jwt_required()
def create_override():
    data = request.get_json() or {}
    user_id = current_user.id
    task_id = data.get('task_id')
    date = data.get('date')
    override_data = data.get('data', {})
    if not (task_id and date):
        return jsonify({'error': 'task_id and date required'}), 400
    override = TaskOverride.query.filter_by(task_id=task_id, date=date, user_id=user_id).first()
    if override:
        return jsonify({'error': 'Override already exists'}), 400
    override = TaskOverride(task_id=task_id, user_id=user_id, date=date, type='modified', data=override_data)
    db.session.add(override)
    db.session.commit()
    return jsonify({'success': True, 'override': override.id}), 201

@overrides_bp.route('/<int:override_id>', methods=['PATCH', 'PUT'])
@jwt_required()
def update_override(override_id):
    data = request.get_json() or {}
    user_id = current_user.id
    override = TaskOverride.query.filter_by(id=override_id, user_id=user_id).first()
    if not override:
        return jsonify({'error': 'Override not found'}), 404
    override.data = data.get('data', override.data)
    db.session.add(override)
    db.session.commit()
    return jsonify({'success': True, 'override': override.id})

@overrides_bp.route('/<int:override_id>', methods=['DELETE'])
@jwt_required()
def delete_override(override_id):
    user_id = current_user.id
    override = TaskOverride.query.filter_by(id=override_id, user_id=user_id).first()
    if not override:
        return jsonify({'error': 'Override not found'}), 404
    db.session.delete(override)
    db.session.commit()
    return jsonify({'success': True})

@overrides_bp.route('/<int:override_id>', methods=['GET'])
@jwt_required()
def get_override(override_id):
    user_id = current_user.id
    override = TaskOverride.query.filter_by(id=override_id, user_id=user_id).first()
    if not override:
        return jsonify({'error': 'Override not found'}), 404
    return jsonify({'override': override.data, 'id': override.id, 'task_id': override.task_id, 'date': override.date})