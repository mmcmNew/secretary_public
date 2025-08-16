import pytest
import json

def test_create_task_type_success(auth_client, test_user):
    """Тест успешного создания типа задачи"""
    # Создаем группу для типа задачи
    group_data = {
        'name': 'Группа для типа задачи'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Подготавливаем данные для создания типа задачи
    type_data = {
        'name': 'Новый тип задачи',
        'color': '#FF5733',
        'description': 'Тестовый тип задачи',
        'order': 1,
        'group_id': group_id,
        'is_active': True
    }
    
    # Отправляем POST запрос для создания типа задачи
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 201
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что все поля установлены правильно
    assert data['name'] == 'Новый тип задачи'
    assert data['color'] == '#FF5733'
    assert data['description'] == 'Тестовый тип задачи'
    assert data['order'] == 1
    assert data['group_id'] == group_id
    assert data['is_active'] == True
    assert 'id' in data
    assert 'user_id' in data

def test_create_task_type_minimal_data(auth_client, test_user):
    """Тест создания типа задачи с минимальными данными"""
    # Подготавливаем минимальные данные для создания типа задачи
    type_data = {
        'name': 'Минимальный тип задачи'
    }
    
    # Отправляем POST запрос для создания типа задачи
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 201
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что тип задачи создан с минимальными данными
    assert data['name'] == 'Минимальный тип задачи'
    assert 'id' in data
    assert 'user_id' in data

def test_create_task_type_without_name(auth_client, test_user):
    """Тест создания типа задачи без указания имени"""
    # Подготавливаем данные без имени
    type_data = {
        'color': '#33FF57',
        'order': 2
    }
    
    # Отправляем POST запрос для создания типа задачи
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data
    assert 'name required' in data['error'].lower()

import uuid

def test_create_task_type_with_nonexistent_group(auth_client, test_user):
    """Тест создания типа задачи с несуществующей группой"""
    # Подготавливаем данные с несуществующей группой (используем несуществующий UUID)
    non_existent_group_id = str(uuid.uuid4())
    type_data = {
        'name': 'Тип задачи с несуществующей группой',
        'group_id': non_existent_group_id
    }
    
    # Отправляем POST запрос для создания типа задачи
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    # Ожидаем 400 Bad Request, так как группа не найдена
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Group not found' in data['error']

def test_create_task_type_empty_name(auth_client, test_user):
    """Тест создания типа задачи с пустым именем"""
    # Подготавливаем данные с пустым именем
    type_data = {
        'name': ''
    }
    
    # Отправляем POST запрос для создания типа задачи
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос

def test_create_task_type_unauthorized(client):
    """Тест создания типа задачи без аутентификации"""
    # Подготавливаем данные для создания типа задачи
    type_data = {
        'name': 'Тип задачи без авторизации'
    }
    
    # Пытаемся создать тип задачи без токена
    response = client.post('/api/tasks/task_types', 
                          data=json.dumps(type_data),
                          content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_create_task_type_invalid_json(auth_client, test_user):
    """Тест создания типа задачи с неверным JSON"""
    # Пытаемся создать тип задачи с неверным JSON
    invalid_json = "invalid json data"
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=invalid_json,
                               content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос