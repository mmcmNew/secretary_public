#!/usr/bin/env python3
"""
Скрипт для создания дефолтных журналов для существующих пользователей
"""

import sys
import os

# Добавляем путь к корневой директории проекта
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

def init_default_journals():
    """Создает дефолтные журналы для всех пользователей, у которых их нет"""
    app = create_app()
    
    with app.app_context():
        from app.main.models import User
        from app.journals.models import JournalSchema
        
        users = User.query.all()
        created_count = 0
        
        for user in users:
            # Проверяем, есть ли уже дефолтный журнал
            existing = JournalSchema.query.filter_by(user_id=user.user_id, name='diary').first()
            
            if not existing:
                default_schema = JournalSchema(
                    user_id=user.user_id,
                    name='diary',
                    display_name='Дневник',
                    fields=[
                        {'name': 'content', 'type': 'textarea', 'label': 'Содержание', 'required': True},
                        {'name': 'mood', 'type': 'select', 'label': 'Настроение', 'options': ['😊', '😐', '😔', '😡', '😴']},
                        {'name': 'tags', 'type': 'tags', 'label': 'Теги'}
                    ],
                    is_default=True
                )
                db.session.add(default_schema)
                created_count += 1
                print(f"Создан дефолтный журнал для пользователя: {user.user_name}")
        
        if created_count > 0:
            db.session.commit()
            print(f"Создано {created_count} дефолтных журналов")
        else:
            print("Все пользователи уже имеют дефолтные журналы")

if __name__ == '__main__':
    init_default_journals()