import pytest
import json

def test_get_fields_config_success(auth_client, test_user):
    """Тест успешного получения конфигурации полей задач"""
    # Получаем конфигурацию полей задач
    response = auth_client.get('/api/tasks/fields_config')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем наличие основных полей
    expected_fields = [
        "range", "completed_at", "divider1", "is_background", "color",
        "divider2", "reward", "cost", "divider3", "priority_id",
        "interval_id", "is_infinite", "divider4", "type_id",
        "attachments", "note"
    ]
    
    for field in expected_fields:
        assert field in data
    
    # Проверяем структуру поля приоритета
    assert "priority_id" in data
    priority_field = data["priority_id"]
    assert "id" in priority_field
    assert "type" in priority_field
    assert "name" in priority_field
    assert "options" in priority_field
    assert len(priority_field["options"]) > 0
    
    # Проверяем структуру поля интервала
    assert "interval_id" in data
    interval_field = data["interval_id"]
    assert "id" in interval_field
    assert "type" in interval_field
    assert "name" in interval_field
    assert "options" in interval_field
    assert len(interval_field["options"]) > 0
    
    # Проверяем структуру поля типа задачи
    assert "type_id" in data
    type_field = data["type_id"]
    assert "id" in type_field
    assert "type" in type_field
    assert "name" in type_field
    assert "options" in type_field
    # options может быть пустым, если нет типов задач

def test_get_fields_config_with_task_types(auth_client, test_user):
    """Тест получения конфигурации полей задач с типами задач"""
    # Создаем группу типов задач
    group_data = {
        'name': 'Тестовая группа типов задач'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Создаем тип задачи
    type_data = {
        'name': 'Тестовый тип задачи',
        'group_id': group_id
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    
    # Получаем конфигурацию полей задач
    response = auth_client.get('/api/tasks/fields_config')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что поле типа задачи содержит созданный тип
    assert "type_id" in data
    type_field = data["type_id"]
    assert "options" in type_field
    assert len(type_field["options"]) > 0
    
    # Проверяем, что созданный тип задачи присутствует в опциях
    type_names = [option["label"] for option in type_field["options"]]
    assert 'Тестовый тип задачи' in type_names

def test_get_fields_config_unauthorized(client):
    """Тест получения конфигурации полей задач без аутентификации"""
    # Пытаемся получить конфигурацию полей задач без токена
    response = client.get('/api/tasks/fields_config')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_get_fields_config_cached(auth_client, test_user):
    """Тест кэширования конфигурации полей задач"""
    # Получаем конфигурацию полей задач первый раз
    response1 = auth_client.get('/api/tasks/fields_config')
    assert response1.status_code == 200
    
    # Получаем конфигурацию полей задач второй раз
    response2 = auth_client.get('/api/tasks/fields_config')
    assert response2.status_code == 200
    
    # Сравниваем ETag заголовки
    etag1 = response1.headers.get('ETag')
    etag2 = response2.headers.get('ETag')
    
    # Если кэширование работает, ETag должны совпадать
    if etag1 and etag2:
        assert etag1 == etag2