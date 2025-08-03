#!/usr/bin/env python3
"""
Скрипт для запуска всех тестов и сохранения результатов в JSON файл.
"""

import os
import sys
import json
import subprocess
import argparse
from datetime import datetime

def run_tests():
    """Запуск всех тестов и возврат результатов."""
    # Получаем путь к директории тестов
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(tests_dir)
    
    # Переходим в корневую директорию проекта
    os.chdir(project_root)
    
    # Подготавливаем команду для запуска тестов
    cmd = [
        sys.executable, "-m", "pytest", 
        "app/tests", 
        "-v", 
        "--tb=short",
        "--json-report",
        "--json-report-file=app/tests/test_results.json"
    ]
    
    try:
        # Запускаем тесты
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        # Читаем результаты из файла отчета
        report_file = os.path.join(tests_dir, "test_results.json")
        if os.path.exists(report_file):
            with open(report_file, 'r', encoding='utf-8') as f:
                test_results = json.load(f)
        else:
            test_results = {
                "success": False,
                "error": "Файл отчета не найден"
            }
        
        return {
            "success": result.returncode == 0,
            "return_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "test_results": test_results,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Тесты превысили время ожидания",
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Ошибка при запуске тестов: {str(e)}",
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }

def save_results_to_file(results, output_file):
    """Сохранение результатов в файл."""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Ошибка при сохранении результатов в файл: {str(e)}")
        return False

def main():
    """Основная функция скрипта."""
    parser = argparse.ArgumentParser(description='Запуск тестов и сохранение результатов')
    parser.add_argument('--output', '-o', 
                       default='test_results_output.json',
                       help='Путь к файлу для сохранения результатов')
    
    args = parser.parse_args()
    
    print("Запуск тестов...")
    results = run_tests()
    
    if results["success"]:
        print("Тесты успешно выполнены")
    else:
        print("Тесты завершены с ошибками")
        if "error" in results:
            print(f"Ошибка: {results['error']}")
    
    print(f"Сохранение результатов в {args.output}...")
    if save_results_to_file(results, args.output):
        print("Результаты успешно сохранены")
    else:
        print("Ошибка при сохранении результатов")
    
    # Выводим краткую сводку
    if "test_results" in results:
        test_results = results["test_results"]
        if "summary" in test_results:
            summary = test_results["summary"]
            print(f"\nСводка тестов:")
            print(f"  Всего тестов: {summary.get('num_tests', 0)}")
            print(f"  Пройдено: {summary.get('passed', 0)}")
            print(f"  Провалено: {summary.get('failed', 0)}")
            print(f"  Пропущено: {summary.get('skipped', 0)}")
    
    return 0 if results["success"] else 1

if __name__ == "__main__":
    sys.exit(main())