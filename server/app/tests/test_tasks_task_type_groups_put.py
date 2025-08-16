import pytest
import json

def test_update_task_type_group_success(auth_client, test_user):
    """Тест успешного обновления группы типов задач"""
    # Создаем группу для последующего обновления
    group_data = {
        'name': 'Исходная группа',
        'color': '#0000FF',
        'order': 1,
        'is_active': True,
        'description': 'Исходное описание'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Подготавливаем данные для обновления группы
    update_data = {
        'name': 'Обновленная группа',
        'color': '#FF00FF',
        'order': 2,
        'is_active': False,
        'description': 'Обновленное описание'
    }
    
    # Отправляем PUT запрос для обновления группы
    response = auth_client.put(f'/api/tasks/task_type_groups/{group_id}', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что все поля обновлены правильно
    assert data['name'] == 'Обновленная группа'
    assert data['color'] == '#FF00FF'
    assert data['order'] == 2
    assert data['is_active'] == False
    assert data['description'] == 'Обновленное описание'
    assert data['id'] == group_id

def test_update_task_type_group_partial_data(auth_client, test_user):
    """Тест частичного обновления группы типов задач"""
    # Создаем группу для последующего обновления
    group_data = {
        'name': 'Группа для частичного обновления',
        'color': '#00FFFF',
        'order': 3
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Подготавливаем частичные данные для обновления группы
    update_data = {
        'name': 'Новое имя группы'
    }
    
    # Отправляем PUT запрос для частичного обновления группы
    response = auth_client.put(f'/api/tasks/task_type_groups/{group_id}', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что обновлено только указанное поле
    assert data['name'] == 'Новое имя группы'
    # Остальные поля должны остаться без изменений
    assert data['color'] == '#00FFFF'
    assert data['order'] == 3

def test_update_task_type_group_not_found(auth_client, test_user):
    """Тест обновления несуществующей группы типов задач"""
    # Подготавливаем данные для обновления
    update_data = {
        'name': 'Новое имя для несуществующей группы'
    }
    
    # Пытаемся обновить несуществующую группу
    response = auth_client.put('/api/tasks/task_type_groups/999999', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not found' in data['error'].lower()

def test_update_task_type_group_invalid_id(auth_client, test_user):
    """Тест обновления группы типов задач с неверным ID"""
    # Подготавливаем данные для обновления
    update_data = {
        'name': 'Группа с неверным ID'
    }
    
    # Пытаемся обновить группу с неверным ID
    response = auth_client.put('/api/tasks/task_type_groups/invalid_id', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа (должен быть 404 Not Found для неверного ID)
    assert response.status_code == 404

def test_update_task_type_group_unauthorized(client):
    """Тест обновления группы типов задач без аутентификации"""
    # Подготавливаем данные для обновления
    update_data = {
        'name': 'Группа без авторизации'
    }
    
    # Пытаемся обновить группу без токена
    response = client.put('/api/tasks/task_type_groups/1', 
                         data=json.dumps(update_data),
                         content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_update_task_type_group_empty_data(auth_client, test_user):
    """Тест обновления группы типов задач с пустыми данными"""
    # Создаем группу для последующего обновления
    group_data = {
        'name': 'Группа для обновления с пустыми данными'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Пытаемся обновить группу с пустыми данными
    update_data = {}
    
    response = auth_client.put(f'/api/tasks/task_type_groups/{group_id}', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным, если сервер просто не изменяет поля)
    assert response.status_code == 200