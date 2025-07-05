from flask import Blueprint, request, jsonify, g
from .access_control import check_access, get_user_permissions, DEFAULT_ACCESS_LEVELS
import json
from .main.models import User, db
from .subscription_models import AccessLevel, SubscriptionPlan, UserSubscription

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@check_access('admin')
def get_users():
    users = User.query.all()
    return jsonify([
        {
            'id': user.id,
            'username': user.user_name,
            'email': user.email,
            'access_level_id': getattr(user, 'access_level_id', 1),
            'modules': user.modules or []
        } for user in users
    ])

@admin_bp.route('/users/<int:user_id>/access-level', methods=['POST'])
@check_access('admin')
def update_user_access_level(user_id):
    data = request.get_json()
    new_level = data.get('access_level')
    
    level_obj = AccessLevel.query.get(new_level)
    if not level_obj:
        return jsonify({'error': 'Invalid access level'}), 400
    
    user = User.query.get_or_404(user_id)
    user.access_level_id = new_level
    db.session.commit()
    
    return jsonify({'message': 'Access level updated successfully'})

@admin_bp.route('/users/<int:user_id>/modules', methods=['POST'])
@check_access('admin')
def update_user_modules(user_id):
    data = request.get_json()
    modules = data.get('modules')
    if not isinstance(modules, list):
        return jsonify({'error': 'Invalid modules'}), 400
    user = User.query.get_or_404(user_id)
    user.modules = modules
    db.session.commit()
    return jsonify({'message': 'Modules updated successfully'})

@admin_bp.route('/access-levels', methods=['GET'])
@check_access('admin')
def get_access_levels():
    levels = AccessLevel.query.all()
    result = {}
    for level in levels:
        features = level.features
        if isinstance(features, str):
            features = json.loads(features) if features else []
        result[level.id] = {
            'name': level.name,
            'max_containers': level.max_containers,
            'features': features
        }
    if not result:
        result = DEFAULT_ACCESS_LEVELS
    return jsonify(result)
