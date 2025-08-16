#!/usr/bin/env python3
"""
Скрипт для запуска одного теста
"""
import os
import sys
import subprocess

def run_single_test():
    """Запускает один тест для проверки"""
    
    # Устанавливаем переменные окружения для тестов
    os.environ['TEST_DATABASE_URL'] = 'postgresql+psycopg2://secretary:secretary@localhost:5432/secretary_test_db'
    os.environ['FLASK_ENV'] = 'testing'
    
    # Запускаем один тест
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            'app/tests/test_tasks_change_status.py::test_change_task_status_to_completed',
            '-v', '--tb=short', '-s'
        ], cwd=os.path.dirname(__file__))
        
        return result.returncode == 0
    except Exception as e:
        print(f"Ошибка при запуске теста: {e}")
        return False

if __name__ == "__main__":
    success = run_single_test()
    sys.exit(0 if success else 1)