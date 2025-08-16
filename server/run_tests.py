#!/usr/bin/env python3
"""
Скрипт для запуска тестов с правильной настройкой окружения
"""
import os
import sys
import subprocess
from create_test_db import create_test_database

def run_tests():
    """Запускает тесты с предварительной настройкой"""
    
    # Создаем тестовую базу данных
    print("Создание тестовой базы данных...")
    if not create_test_database():
        print("Не удалось создать тестовую базу данных")
        return False
    
    # Устанавливаем переменные окружения для тестов
    os.environ['TEST_DATABASE_URL'] = 'postgresql+psycopg2://secretary:secretary@localhost:5432/secretary_test_db'
    os.environ['FLASK_ENV'] = 'testing'
    
    # Запускаем тесты
    print("Запуск тестов...")
    try:
        # Запускаем только проблемные тесты для начала
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            'app/tests/test_instance_endpoint.py',
            '-v', '--tb=short'
        ], cwd=os.path.dirname(__file__))
        
        return result.returncode == 0
    except Exception as e:
        print(f"Ошибка при запуске тестов: {e}")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)