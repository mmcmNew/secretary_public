from flask import Blueprint, request, jsonify, g
from .access_control import check_access, get_user_permissions, DEFAULT_ACCESS_LEVELS
import json
import re
from .main.models import User, db
from .subscription_models import AccessLevel, SubscriptionPlan, UserSubscription
from datetime import datetime, timedelta
from .command_utils import modules as available_modules

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@check_access('admin')
def get_users():
    users = User.query.all()
    result = []
    for user in users:
        sub = db.session.query(UserSubscription, SubscriptionPlan).join(
            SubscriptionPlan, UserSubscription.plan_id == SubscriptionPlan.id
        ).filter(
            UserSubscription.user_id == user.id,
            UserSubscription.is_active == True
        ).first()

        if sub:
            _, plan = sub
            plan_id = plan.id
            plan_name = plan.name
        else:
            plan_id = None
            plan_name = 'Free'

        result.append({
            'id': user.id,
            'username': user.user_name,
            'email': user.email,
            'is_admin': user.is_admin,
            'plan_id': plan_id,
            'plan_name': plan_name,
            'modules': user.modules or []
        })

    return jsonify(result)

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

@admin_bp.route('/users/<int:user_id>/plan', methods=['POST'])
@check_access('admin')
def update_user_plan(user_id):
    data = request.get_json()
    plan_id = data.get('plan_id')

    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Invalid plan'}), 400

    UserSubscription.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})

    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=plan.duration_days) if plan.duration_days > 0 else None

    sub = UserSubscription(user_id=user_id, plan_id=plan_id, start_date=start_date, end_date=end_date, is_active=True)

    user = User.query.get_or_404(user_id)
    user.access_level_id = plan.access_level_id

    db.session.add(sub)
    db.session.commit()

    return jsonify({'message': 'Plan updated successfully'})

@admin_bp.route('/users/<int:user_id>/modules', methods=['POST'])
@check_access('admin')
def update_user_modules(user_id):
    data = request.get_json()
    modules = data.get('modules')

    if not isinstance(modules, list):
        return jsonify({'error': 'Invalid modules'}), 400

    # Deduplicate while preserving order
    modules = list(dict.fromkeys(modules))

    name_pattern = re.compile(r'^[A-Za-z0-9_-]+$')
    allowed_names = set(available_modules.keys())

    for name in modules:
        if name not in allowed_names and not name_pattern.match(name):
            return jsonify({'error': f'Invalid module name: {name}'}), 400

    user = User.query.get_or_404(user_id)
    user.modules = modules
    db.session.commit()
    return jsonify({'message': 'Modules updated successfully'})

@admin_bp.route('/available-modules', methods=['GET'])
@check_access('admin')
def get_available_modules():
    return jsonify(list(available_modules.keys()))

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
