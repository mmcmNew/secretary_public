import pytest
import json
from datetime import datetime, timedelta
from conftest import is_valid_uuid
import uuid

def test_edit_task_success(auth_client, test_user):
    """Тест успешного редактирования задачи"""
    # Сначала создаем задачу
    task_data = {
        'title': 'Исходная задача',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Теперь редактируем задачу
    updated_data = {
        'taskId': task_id,
        'title': 'Обновленная задача',
        'note': 'Тестовое примечание'
    }
    
    response = auth_client.put('/api/tasks/edit_task', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == 'Обновленная задача'
    assert data['task']['note'] == 'Тестовое примечание'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])

def test_edit_task_not_found(auth_client, test_user):
    """Тест редактирования несуществующей задачи"""
    # Пытаемся отредактировать несуществующую задачу
    updated_data = {
        'taskId': str(uuid.uuid4()),
        'title': 'Несуществующая задача'
    }
    
    response = auth_client.put('/api/tasks/edit_task', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'not found' in data['message'].lower()

def test_edit_task_invalid_id(auth_client, test_user):
    """Тест редактирования задачи с неверным ID"""
    # Пытаемся отредактировать задачу с неверным ID
    updated_data = {
        'taskId': 'invalid_id',
        'title': 'Задача с неверным ID'
    }
    
    response = auth_client.put('/api/tasks/edit_task', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is False

def test_edit_task_with_due_date(auth_client, test_user):
    """Тест редактирования задачи с изменением даты выполнения"""
    # Сначала создаем задачу
    task_data = {
        'title': 'Задача без даты',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Теперь редактируем задачу, добавляя дату выполнения
    due_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + 'Z'
    updated_data = {
        'taskId': task_id,
        'title': 'Задача с датой выполнения',
        'end': due_date
    }
    
    response = auth_client.put('/api/tasks/edit_task', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == 'Задача с датой выполнения'
    assert data['task']['end'] == due_date
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])

def test_edit_task_clear_field(auth_client, test_user):
    """Тест очистки поля задачи"""
    # Сначала создаем задачу с примечанием
    task_data = {
        'title': 'Задача с примечанием',
        'note': 'Исходное примечание',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Теперь редактируем задачу, очищая примечание
    updated_data = {
        'taskId': task_id,
        'title': 'Задача без примечания',
        'note': ''  # Пустая строка должна преобразоваться в None
    }
    
    response = auth_client.put('/api/tasks/edit_task', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == 'Задача без примечания'
    # Проверяем, что пустая строка преобразовалась в None
    assert data['task']['note'] is None
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])

def test_edit_task_unauthorized(client):
    """Тест редактирования задачи без аутентификации"""
    # Пытаемся отредактировать задачу без токена
    updated_data = {
        'taskId': str(uuid.uuid4()),
        'title': 'Задача без авторизации'
    }
    
    response = client.put('/api/tasks/edit_task', 
                         data=json.dumps(updated_data),
                         content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401
