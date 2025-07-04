from app import db
from .subscription_models import AccessLevel, SubscriptionPlan
import json

def init_subscription_data():
    """Инициализация базовых данных для системы тарифов"""
    
    # Проверяем, есть ли уже данные
    if AccessLevel.query.first():
        return
    
    # Создаем уровни доступа
    access_levels = [
        {
            'id': 1,
            'name': 'Free',
            'description': 'Бесплатный тариф',
            'max_containers': 2,
            'features': json.dumps(['tasks', 'calendar'])
        },
        {
            'id': 2,
            'name': 'Basic',
            'description': 'Базовый тариф',
            'max_containers': 5,
            'features': json.dumps(['tasks', 'calendar', 'memory', 'JournalEditor', 'chat'])
        },
        {
            'id': 3,
            'name': 'Premium',
            'description': 'Премиум тариф',
            'max_containers': 10,
            'features': json.dumps(['tasks', 'calendar', 'memory', 'JournalEditor', 'metronome', 'Scenario', 'AntiSchedule', 'chat'])
        },
        {
            'id': 4,
            'name': 'Admin',
            'description': 'Администратор',
            'max_containers': -1,
            'features': json.dumps(['*', 'admin'])
        }
    ]
    
    for level_data in access_levels:
        level = AccessLevel(**level_data)
        db.session.add(level)
    
    # Создаем тарифные планы
    plans = [
        {
            'id': 1,
            'name': 'Free',
            'price': 0,
            'access_level_id': 1,
            'duration_days': 0  # бессрочно
        },
        {
            'id': 2,
            'name': 'Basic',
            'price': 299,
            'access_level_id': 2,
            'duration_days': 30
        },
        {
            'id': 3,
            'name': 'Premium',
            'price': 599,
            'access_level_id': 3,
            'duration_days': 30
        }
    ]
    
    for plan_data in plans:
        plan = SubscriptionPlan(**plan_data)
        db.session.add(plan)
    
    db.session.commit()
    print("Subscription data initialized")