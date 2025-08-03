#!/usr/bin/env python3
"""
Скрипт для запуска одного теста без использования conftest.py
"""

import sys
import os
import pytest

# Добавляем путь к приложению в sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def run_test_file(test_file):
    """Запуск конкретного файла тестов"""
    # Формируем путь к файлу тестов
    test_path = os.path.join(os.path.dirname(__file__), test_file)
    
    if not os.path.exists(test_path):
        print(f"Файл {test_path} не найден")
        return False
    
    # Запускаем тесты с помощью pytest
    args = [
        test_path,
        '-v',
        '--tb=short'
    ]
    
    exit_code = pytest.main(args)
    return exit_code == 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python run_single_test.py <test_file>")
        sys.exit(1)
    
    test_file = sys.argv[1]
    success = run_test_file(test_file)
    
    if success:
        print(f"Тесты из файла {test_file} успешно выполнены")
        sys.exit(0)
    else:
        print(f"Тесты из файла {test_file} завершены с ошибками")
        sys.exit(1)