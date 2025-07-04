from flask import Blueprint, request, jsonify, g
from .access_control import get_user_permissions
from .subscription_models import AccessLevel, SubscriptionPlan, UserSubscription
from .main.models import User, db
from datetime import datetime, timedelta
import json

subscription_bp = Blueprint('subscription', __name__, url_prefix='/api')

@subscription_bp.route('/subscription-plans', methods=['GET'])
def get_subscription_plans():
    plans = db.session.query(SubscriptionPlan, AccessLevel).join(
        AccessLevel, SubscriptionPlan.access_level_id == AccessLevel.id
    ).all()
    
    result = []
    for plan, access_level in plans:
        features = access_level.features if isinstance(access_level.features, list) else (json.loads(access_level.features) if access_level.features else [])
        result.append({
            'id': plan.id,
            'name': plan.name,
            'price': float(plan.price) if plan.price else 0,
            'max_containers': access_level.max_containers,
            'features': features,
            'duration_days': plan.duration_days
        })
    
    return jsonify(result)

@subscription_bp.route('/user/permissions', methods=['GET'])
def get_user_permissions_route():
    user_level = getattr(g, 'user_access_level', 1)
    permissions = get_user_permissions(user_level)
    return jsonify(permissions)

@subscription_bp.route('/user/subscription', methods=['GET'])
def get_user_subscription():
    user_id = getattr(g, 'user_id', None)
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401
    
    # Получаем активную подписку пользователя
    subscription = db.session.query(UserSubscription, SubscriptionPlan).join(
        SubscriptionPlan, UserSubscription.plan_id == SubscriptionPlan.id
    ).filter(
        UserSubscription.user_id == user_id,
        UserSubscription.is_active == True
    ).first()
    
    if subscription:
        user_subscription, plan = subscription
        return jsonify({
            'plan_name': plan.name,
            'plan_id': plan.id,
            'start_date': user_subscription.start_date.isoformat() if user_subscription.start_date else None,
            'end_date': user_subscription.end_date.isoformat() if user_subscription.end_date else None,
            'is_active': user_subscription.is_active
        })
    else:
        # Если нет активной подписки, возвращаем базовый план
        return jsonify({
            'plan_name': 'Базовый',
            'plan_id': None,
            'start_date': None,
            'end_date': None,
            'is_active': False
        })

@subscription_bp.route('/subscribe/<int:plan_id>', methods=['POST'])
def subscribe_to_plan(plan_id):
    user_id = getattr(g, 'user_id', None)
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401
    
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    
    # Деактивируем старые подписки
    UserSubscription.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
    
    # Создаем новую подписку
    start_date = datetime.now()
    end_date = start_date + timedelta(days=plan.duration_days) if plan.duration_days > 0 else None
    
    subscription = UserSubscription(
        user_id=user_id,
        plan_id=plan_id,
        start_date=start_date,
        end_date=end_date,
        is_active=True
    )
    
    # Обновляем уровень доступа пользователя
    user = User.query.get(user_id)
    user.access_level_id = plan.access_level_id
    
    db.session.add(subscription)
    db.session.commit()
    
    return jsonify({'message': 'Subscription activated', 'plan_id': plan_id})