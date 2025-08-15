# Обновленные тесты для работы с UUID

## Обзор изменений

Все серверные тесты были обновлены для работы с новой системой строковых UUID вместо числовых ID. Основные изменения:

### 1. Обновленная структура ID
- Все ID теперь являются строковыми UUID формата `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Добавлена функция `is_valid_uuid()` для валидации UUID
- Обновлены все тесты для проверки валидности UUID

### 2. Исправленные сравнения
- Заменены `== True/False` на `is True/False` для булевых значений
- Обновлены проверки статусов задач с использованием `is_completed` вместо `status_id`

### 3. Новые тесты

#### `test_tasks_uuid_support.py`
Комплексные тесты для проверки работы с UUID:
- Добавление задач в пользовательские списки
- Получение задач по UUID
- Редактирование и удаление с UUID
- Работа с подзадачами
- Связывание групп и списков

#### `test_tasks_task_types_updated.py`
Обновленные тесты для типов задач:
- CRUD операции с типами задач
- Работа с группами типов задач
- Проверка UUID в конфигурации полей
- Тесты авторизации

#### `test_tasks_integration_uuid.py`
Интеграционные тесты:
- Полный рабочий процесс с UUID
- Консистентность UUID во всех операциях
- Обработка ошибок с невалидными UUID
- Валидация формата UUID

## Запуск тестов

### Запуск всех обновленных тестов
```bash
cd server
python -m pytest app/tests/ -v
```

### Запуск конкретных тестов
```bash
# Тесты поддержки UUID
python -m pytest app/tests/test_tasks_uuid_support.py -v

# Интеграционные тесты
python -m pytest app/tests/test_tasks_integration_uuid.py -v

# Тесты типов задач
python -m pytest app/tests/test_tasks_task_types_updated.py -v
```

### Запуск с подробным выводом
```bash
python -m pytest app/tests/ -v -s --tb=short
```

## Основные изменения в тестах

### 1. conftest.py
- Добавлены импорты для работы с UUID
- Добавлены фикстуры для создания тестовых объектов (`test_list`, `test_group`, `test_project`, `test_task`)
- Добавлена функция `is_valid_uuid()` для валидации UUID

### 2. Обновленные существующие тесты
- `test_tasks_add_list.py` - проверка UUID в создаваемых объектах
- `test_tasks_add_task.py` - проверка UUID в задачах и исправление логики важных задач
- `test_tasks_change_status.py` - обновление API изменения статуса
- `test_tasks_edit_task.py` - проверка UUID при редактировании

### 3. Проверки UUID
Все тесты теперь включают проверки:
```python
from conftest import is_valid_uuid

# Проверка валидности UUID
assert is_valid_uuid(data['task']['id'])

# Проверка формата UUID
assert len(task_id) == 36
assert task_id.count('-') == 4
```

## Покрытие тестами

Обновленные тесты покрывают:

### Основные операции
- ✅ Создание списков, групп, проектов с UUID
- ✅ Создание задач и подзадач с UUID
- ✅ Редактирование объектов по UUID
- ✅ Удаление объектов по UUID
- ✅ Получение объектов по UUID

### API эндпоинты
- ✅ `/tasks/add_list` - создание объектов
- ✅ `/tasks/add_task` - создание задач
- ✅ `/tasks/edit_task` - редактирование задач
- ✅ `/tasks/change_status` - изменение статуса
- ✅ `/tasks/get_tasks` - получение задач
- ✅ `/tasks/get_tasks_by_ids` - получение по ID
- ✅ `/tasks/del_task` - удаление задач
- ✅ `/tasks/add_subtask` - создание подзадач
- ✅ `/tasks/get_subtasks` - получение подзадач
- ✅ `/tasks/link_group_list` - связывание объектов
- ✅ `/tasks/task_types` - типы задач
- ✅ `/tasks/task_type_groups` - группы типов
- ✅ `/tasks/fields_config` - конфигурация полей

### Обработка ошибок
- ✅ Невалидные UUID
- ✅ Несуществующие UUID
- ✅ Неавторизованный доступ
- ✅ Некорректные данные

## Требования

- Python 3.8+
- pytest
- Flask приложение в тестовом режиме
- Все зависимости из `requirements.txt`

## Примечания

1. Все тесты используют изолированную тестовую базу данных
2. Каждый тест очищает данные после выполнения
3. UUID генерируются автоматически при создании объектов
4. Тесты проверяют как валидность UUID, так и корректность бизнес-логики

## Отладка

Для отладки тестов используйте:
```bash
# Запуск с остановкой на первой ошибке
python -m pytest app/tests/ -x

# Запуск с подробным выводом
python -m pytest app/tests/ -vvv

# Запуск конкретного теста
python -m pytest app/tests/test_tasks_uuid_support.py::test_add_task_to_custom_list -v
```