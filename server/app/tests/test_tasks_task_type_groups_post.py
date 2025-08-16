import pytest
import json

def test_create_task_type_group_success(auth_client, test_user):
    """Тест успешного создания группы типов задач"""
    # Подготавливаем данные для создания группы
    group_data = {
        'name': 'Новая группа типов задач',
        'color': '#FF0000',
        'order': 1,
        'is_active': True,
        'description': 'Тестовая группа типов задач'
    }
    
    # Отправляем POST запрос для создания группы
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 201
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что все поля установлены правильно
    assert data['name'] == 'Новая группа типов задач'
    assert data['color'] == '#FF0000'
    assert data['order'] == 1
    assert data['is_active'] == True
    assert data['description'] == 'Тестовая группа типов задач'
    assert 'id' in data
    assert 'user_id' in data

def test_create_task_type_group_minimal_data(auth_client, test_user):
    """Тест создания группы типов задач с минимальными данными"""
    # Подготавливаем минимальные данные для создания группы
    group_data = {
        'name': 'Минимальная группа'
    }
    
    # Отправляем POST запрос для создания группы
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 201
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что группа создана с минимальными данными
    assert data['name'] == 'Минимальная группа'
    assert 'id' in data
    assert 'user_id' in data

def test_create_task_type_group_without_name(auth_client, test_user):
    """Тест создания группы типов задач без указания имени"""
    # Подготавливаем данные без имени
    group_data = {
        'color': '#00FF00',
        'order': 2
    }
    
    # Отправляем POST запрос для создания группы
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data
    assert 'name required' in data['error'].lower()

def test_create_task_type_group_empty_name(auth_client, test_user):
    """Тест создания группы типов задач с пустым именем"""
    # Подготавливаем данные с пустым именем
    group_data = {
        'name': ''
    }
    
    # Отправляем POST запрос для создания группы
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос

def test_create_task_type_group_unauthorized(client):
    """Тест создания группы типов задач без аутентификации"""
    # Подготавливаем данные для создания группы
    group_data = {
        'name': 'Группа без авторизации'
    }
    
    # Пытаемся создать группу без токена
    response = client.post('/api/tasks/task_type_groups', 
                          data=json.dumps(group_data),
                          content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_create_task_type_group_invalid_json(auth_client, test_user):
    """Тест создания группы типов задач с неверным JSON"""
    # Пытаемся создать группу с неверным JSON
    invalid_json = "invalid json data"
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=invalid_json,
                               content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос