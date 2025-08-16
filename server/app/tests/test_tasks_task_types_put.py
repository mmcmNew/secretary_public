import pytest
import json

def test_update_task_type_success(auth_client, test_user):
    """Тест успешного обновления типа задачи"""
    # Создаем группу для типа задачи
    group_data = {
        'name': 'Группа для обновления типа задачи'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Создаем тип задачи для последующего обновления
    type_data = {
        'name': 'Исходный тип задачи',
        'color': '#0000FF',
        'description': 'Исходное описание',
        'order': 1,
        'group_id': group_id,
        'is_active': True
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    type_id = task_type['id']
    
    # Подготавливаем данные для обновления типа задачи
    update_data = {
        'name': 'Обновленный тип задачи',
        'color': '#FF00FF',
        'description': 'Обновленное описание',
        'order': 2,
        'group_id': group_id,
        'is_active': False
    }
    
    # Отправляем PUT запрос для обновления типа задачи
    response = auth_client.put(f'/api/tasks/task_types/{type_id}', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что все поля обновлены правильно
    assert data['name'] == 'Обновленный тип задачи'
    assert data['color'] == '#FF00FF'
    assert data['description'] == 'Обновленное описание'
    assert data['order'] == 2
    assert data['group_id'] == group_id
    assert data['is_active'] == False
    assert data['id'] == type_id

def test_update_task_type_partial_data(auth_client, test_user):
    """Тест частичного обновления типа задачи"""
    # Создаем тип задачи для последующего обновления
    type_data = {
        'name': 'Тип задачи для частичного обновления',
        'color': '#00FFFF',
        'order': 3
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    type_id = task_type['id']
    
    # Подготавливаем частичные данные для обновления типа задачи
    update_data = {
        'name': 'Новое имя типа задачи'
    }
    
    # Отправляем PUT запрос для частичного обновления типа задачи
    response = auth_client.put(f'/api/tasks/task_types/{type_id}', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что обновлено только указанное поле
    assert data['name'] == 'Новое имя типа задачи'
    # Остальные поля должны остаться без изменений
    assert data['color'] == '#00FFFF'
    assert data['order'] == 3

def test_update_task_type_not_found(auth_client, test_user):
    """Тест обновления несуществующего типа задачи"""
    # Подготавливаем данные для обновления
    update_data = {
        'name': 'Новое имя для несуществующего типа задачи'
    }
    
    # Пытаемся обновить несуществующий тип задачи
    response = auth_client.put('/api/tasks/task_types/999999', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not found' in data['error'].lower()

import uuid

def test_update_task_type_invalid_id(auth_client, test_user):
    """Тест обновления типа задачи с неверным ID"""
    # Подготавливаем данные для обновления
    update_data = {
        'name': 'Тип задачи с неверным ID'
    }
    
    # Пытаемся обновить тип задачи с неверным ID
    response = auth_client.put('/api/tasks/task_types/invalid_id', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа (должен быть 404 Not Found для неверного ID)
    assert response.status_code == 404

def test_update_task_type_with_nonexistent_group(auth_client, test_user):
    """Тест обновления типа задачи с несуществующей группой"""
    # Создаем тип задачи для последующего обновления
    type_data = {
        'name': 'Тип задачи для обновления группы'
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    type_id = task_type['id']
    
    # Подготавливаем данные с несуществующей группой (используем несуществующий UUID)
    non_existent_group_id = str(uuid.uuid4())
    update_data = {
        'name': 'Тип задачи с несуществующей группой',
        'group_id': non_existent_group_id
    }
    
    # Пытаемся обновить тип задачи с несуществующей группой
    response = auth_client.put(f'/api/tasks/task_types/{type_id}', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Ожидаем 400 Bad Request, так как группа не найдена
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Group not found' in data['error']

def test_update_task_type_unauthorized(client):
    """Тест обновления типа задачи без аутентификации"""
    # Подготавливаем данные для обновления
    update_data = {
        'name': 'Тип задачи без авторизации'
    }
    
    # Пытаемся обновить тип задачи без токена
    response = client.put('/api/tasks/task_types/1', 
                         data=json.dumps(update_data),
                         content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_update_task_type_empty_data(auth_client, test_user):
    """Тест обновления типа задачи с пустыми данными"""
    # Создаем тип задачи для последующего обновления
    type_data = {
        'name': 'Тип задачи для обновления с пустыми данными'
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    type_id = task_type['id']
    
    # Пытаемся обновить тип задачи с пустыми данными
    update_data = {}
    
    response = auth_client.put(f'/api/tasks/task_types/{type_id}', 
                              data=json.dumps(update_data),
                              content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным, если сервер просто не изменяет поля)
    assert response.status_code == 200