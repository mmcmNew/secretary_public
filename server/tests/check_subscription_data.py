#!/usr/bin/env python3
"""
Скрипт для проверки инициализации данных подписки
"""

from app import create_app, db
from app.subscription_models import AccessLevel, SubscriptionPlan
import json

def check_subscription_data():
    """Проверяет, что данные подписки инициализированы корректно"""
    
    app = create_app('test')
    
    with app.app_context():
        print("=== Проверка данных уровней доступа ===")
        access_levels = AccessLevel.query.all()
        
        if not access_levels:
            print("❌ Данные уровней доступа не найдены!")
            return False
            
        for level in access_levels:
            features = json.loads(level.features) if level.features else []
            print(f"ID: {level.id}, Name: {level.name}, Description: {level.description}")
            print(f"   Max containers: {level.max_containers}, Features: {features}")
            print()
        
        print("=== Проверка данных тарифных планов ===")
        plans = SubscriptionPlan.query.all()
        
        if not plans:
            print("❌ Данные тарифных планов не найдены!")
            return False
            
        for plan in plans:
            print(f"ID: {plan.id}, Name: {plan.name}, Price: {plan.price}")
            print(f"   Access Level ID: {plan.access_level_id}, Duration: {plan.duration_days} days")
            print()
        
        print("✅ Все данные подписки инициализированы корректно!")
        return True

if __name__ == '__main__':
    check_subscription_data()