# Скрипт для запуска тестов и сохранения результатов

## Общая информация

Этот документ описывает скрипт для запуска всех тестов серверных маршрутов задач и сохранения результатов в файл для последующего использования в клиентских тестах.

## Скрипт запуска тестов

Создадим скрипт `run_tests.py` в директории `server/app/tests/`, который будет:

1. Запускать все тесты для серверных маршрутов задач
2. Собирать результаты тестов
3. Сохранять результаты в формате JSON
4. Предоставлять сводную информацию о результатах

## Структура скрипта

```python
#!/usr/bin/env python3
# run_tests.py

import subprocess
import json
import sys
import os
from datetime import datetime

def run_tests():
    """Запуск тестов и сохранение результатов"""
    # Определяем пути
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(tests_dir))
    
    # Команда для запуска тестов
    cmd = [
        sys.executable, "-m", "pytest",
        tests_dir,
        "--json-report",
        "--json-report-file=test_results.json",
        "-v"
    ]
    
    try:
        # Запуск тестов
        result = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True)
        
        # Вывод результатов в консоль
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        # Проверка статуса выполнения
        if result.returncode == 0:
            print("Все тесты пройдены успешно!")
        else:
            print(f"Некоторые тесты не пройдены. Код возврата: {result.returncode}")
            
        # Возвращаем путь к файлу результатов
        results_file = os.path.join(tests_dir, "test_results.json")
        return results_file if os.path.exists(results_file) else None
        
    except Exception as e:
        print(f"Ошибка при запуске тестов: {e}")
        return None

def process_results(results_file):
    """Обработка результатов тестов и создание файла для клиентских тестов"""
    if not results_file or not os.path.exists(results_file):
        print("Файл результатов не найден")
        return None
    
    try:
        # Чтение результатов тестов
        with open(results_file, 'r', encoding='utf-8') as f:
            test_results = json.load(f)
        
        # Создание структуры для клиентских тестов
        client_results = {
            "test_results": {},
            "summary": {},
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        # Обработка результатов
        if "tests" in test_results:
            passed = 0
            failed = 0
            skipped = 0
            
            for test in test_results["tests"]:
                # Извлечение имени маршрута из имени теста
                # Предполагаем, что имя теста имеет формат "test_route_name"
                test_name = test.get("nodeid", "").split("::")[-1]
                if test_name.startswith("test_"):
                    route_name = test_name[5:]  # Убираем префикс "test_"
                else:
                    route_name = test_name
                
                # Определение статуса теста
                status = test.get("outcome", "unknown")
                if status == "passed":
                    passed += 1
                elif status == "failed":
                    failed += 1
                elif status == "skipped":
                    skipped += 1
                
                # Добавление информации о тесте
                client_results["test_results"][route_name] = {
                    "status": status,
                    "details": test.get("message", ""),
                    "execution_time": test.get("duration", 0)
                }
            
            # Заполнение сводной информации
            client_results["summary"] = {
                "total": len(test_results["tests"]),
                "passed": passed,
                "failed": failed,
                "skipped": skipped
            }
        
        # Сохранение результатов для клиентских тестов
        client_results_file = os.path.join(os.path.dirname(results_file), "client_test_results.json")
        with open(client_results_file, 'w', encoding='utf-8') as f:
            json.dump(client_results, f, ensure_ascii=False, indent=2)
        
        print(f"Результаты для клиентских тестов сохранены в: {client_results_file}")
        return client_results_file
        
    except Exception as e:
        print(f"Ошибка при обработке результатов: {e}")
        return None

def main():
    """Основная функция"""
    print("Запуск тестов серверных маршрутов задач...")
    
    # Запуск тестов
    results_file = run_tests()
    
    if results_file:
        print(f"Результаты тестов сохранены в: {results_file}")
        
        # Обработка результатов для клиентских тестов
        client_results_file = process_results(results_file)
        
        if client_results_file:
            print("Тесты успешно выполнены и результаты сохранены!")
            return 0
        else:
            print("Ошибка при обработке результатов для клиентских тестов")
            return 1
    else:
        print("Ошибка при выполнении тестов")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

## Использование скрипта

Для запуска тестов выполните следующую команду из корневой директории проекта:

```bash
python server/app/tests/run_tests.py
```

## Результаты работы скрипта

Скрипт создаст два файла с результатами:

1. `test_results.json` - полные результаты тестов в формате pytest-json-report
2. `client_test_results.json` - результаты тестов в формате, пригодном для использования в клиентских тестах

## Интеграция с CI/CD

Скрипт может быть легко интегрирован в CI/CD pipeline для автоматического тестирования и генерации результатов при каждом изменении кода.

## Автоматический запуск при развертывании

Для автоматического запуска тестов при развертывании приложения можно добавить вызов скрипта в процесс развертывания:

```bash
# Пример для Dockerfile
RUN python server/app/tests/run_tests.py

# Проверка результатов тестов
RUN if [ ! -f server/app/tests/client_test_results.json ]; then exit 1; fi
```

Это обеспечит, что приложение будет развернуто только в случае успешного прохождения всех тестов.