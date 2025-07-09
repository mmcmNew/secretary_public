from flask import g, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from .main.models import User
from .subscription_models import UserSubscription, SubscriptionPlan
from datetime import datetime

def load_user_permissions():
    """Загружает права пользователя в контекст запроса"""
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        
        if user_id:
            user = User.query.get(user_id)
            if user:
                g.user_id = user_id
                g.user_access_level = getattr(user, 'access_level_id', 1)
                g.user_is_admin = getattr(user, 'is_admin', False)
                
                # Проверяем активную подписку
                active_subscription = UserSubscription.query.filter_by(
                    user_id=user_id, 
                    is_active=True
                ).first()
                
                if active_subscription:
                    # Проверяем не истекла ли подписка
                    if active_subscription.end_date and active_subscription.end_date < datetime.now():
                        active_subscription.is_active = False
                        user.access_level_id = 1  # Возвращаем к Free
                        from app import db
                        db.session.commit()
                        g.user_access_level = 1
            else:
                g.user_access_level = 1
                g.user_is_admin = False
        else:
            g.user_access_level = 1
            g.user_is_admin = False
            
    except Exception as e:        
        g.user_access_level = 1
        g.user_is_admin = False
