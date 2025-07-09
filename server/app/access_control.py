from functools import wraps
from flask import jsonify, g
import json

# Базовые уровни доступа по умолчанию, используются если данные из БД
# недоступны
DEFAULT_ACCESS_LEVELS = {
    1: {  # Free
        'name': 'Free',
        'max_containers': 2,
        'features': ['tasks', 'calendar']
    },
    2: {  # Basic
        'name': 'Basic', 
        'max_containers': 5,
        'features': ['tasks', 'calendar', 'memory', 'JournalEditor', 'chat']
    },
    3: {  # Premium
        'name': 'Premium',
        'max_containers': 10,
        'features': ['tasks', 'calendar', 'memory', 'JournalEditor', 'metronome', 'Scenario', 'AntiSchedule', 'chat']
    },
    4: {  # Admin
        'name': 'Admin',
        'max_containers': -1,  # unlimited
        'features': ['*', 'admin']  # all features + admin access
    }
}

def check_access(feature_name):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_level = getattr(g, 'user_access_level', 1)
            user_id = getattr(g, 'user_id', None)
            permissions = get_user_permissions(user_level, user_id)
            user_features = permissions.get('features', [])
            
            if '*' not in user_features and feature_name not in user_features:
                return jsonify({'error': 'Access denied'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_user_permissions(user_access_level, user_id=None):
    """Возвращает разрешения пользователя в виде словаря
    {'name': str, 'max_containers': int, 'features': list}
    Данные берутся из таблицы access_levels. Если таблица недоступна,
    используются значения по умолчанию из DEFAULT_ACCESS_LEVELS.
    Если указан user_id и у пользователя есть modules, возвращается список
    modules пользователя, иначе берётся список из тарифа."""

    try:
        from .subscription_models import AccessLevel
        from .main.models import User

        level = AccessLevel.query.get(user_access_level)
        if level:
            features = level.features
            if isinstance(features, str):
                features = json.loads(features) if features else []
            permissions = {
                'name': level.name,
                'max_containers': level.max_containers,
                'features': features or []
            }
        else:
            permissions = DEFAULT_ACCESS_LEVELS.get(user_access_level, DEFAULT_ACCESS_LEVELS[1])

        if user_id:
            user = User.query.get(user_id)
            if user:
                if user.modules:
                    permissions['features'] = user.modules
                # если модулей нет, оставляем список из тарифа

        return permissions

    except Exception:
        permissions = DEFAULT_ACCESS_LEVELS.get(user_access_level, DEFAULT_ACCESS_LEVELS[1])
        return permissions
