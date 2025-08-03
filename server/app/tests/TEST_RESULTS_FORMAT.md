# Формат файла результатов тестов для использования в клиентских тестах

## Общая структура файла

Файл результатов тестов представляет собой JSON-документ со следующей структурой:

```json
{
  "metadata": {
    "timestamp": "2023-01-01T00:00:00Z",
    "version": "1.0.0",
    "test_suite": "tasks_api_tests"
  },
  "summary": {
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "success_rate": 0.0
  },
  "test_cases": [
    {
      "name": "test_case_name",
      "description": "Описание теста",
      "route": "/api/route",
      "method": "GET|POST|PUT|DELETE|PATCH",
      "status": "passed|failed|skipped",
      "execution_time": 0.0,
      "request": {
        "headers": {},
        "body": {}
      },
      "response": {
        "status_code": 200,
        "headers": {},
        "body": {}
      },
      "assertions": [
        {
          "description": "Описание проверки",
          "passed": true,
          "actual": "фактическое значение",
          "expected": "ожидаемое значение"
        }
      ]
    }
  ]
}
```

## Подробное описание полей

### metadata
- `timestamp` (string): Временная метка выполнения тестов в формате ISO 8601
- `version` (string): Версия формата файла результатов
- `test_suite` (string): Название набора тестов

### summary
- `total_tests` (integer): Общее количество тестов
- `passed` (integer): Количество успешно пройденных тестов
- `failed` (integer): Количество проваленных тестов
- `skipped`