from functools import wraps
from flask import jsonify, g

# Базовые уровни доступа
ACCESS_LEVELS = {
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
            user_features = ACCESS_LEVELS.get(user_level, {}).get('features', [])
            
            if '*' not in user_features and feature_name not in user_features:
                return jsonify({'error': 'Access denied'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_user_permissions(user_access_level):
    return ACCESS_LEVELS.get(user_access_level, ACCESS_LEVELS[1])