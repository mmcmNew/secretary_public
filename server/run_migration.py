#!/usr/bin/env python3
"""
Скрипт для запуска миграций базы данных
"""

import sys
import os

# Добавляем путь к корневой директории проекта
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

def run_migration():
    """Создает таблицы в базе данных"""
    app = create_app()
    
    with app.app_context():
        # Создаем все таблицы
        db.create_all()
        print("Миграция выполнена успешно")

if __name__ == '__main__':
    run_migration()