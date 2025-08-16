import pytest
import json
from datetime import datetime, timedelta
from conftest import is_valid_uuid

def test_change_task_status_to_completed(auth_client, test_user):
    """Тест изменения статуса задачи на 'Завершена'"""
    # Сначала создаем задачу
    task_data = {
        'title': 'Задача для завершения',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Меняем статус задачи на "Завершена" (используем is_completed)
    status_data = {
        'taskId': task_id,
        'is_completed': True
    }
    
    response = auth_client.put('/api/tasks/change_status', 
                              data=json.dumps(status_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'changed_ids' in data
    # Проверяем, что ID является валидным UUID
    for changed_id in data['changed_ids']:
        assert is_valid_uuid(changed_id)

def test_change_task_status_to_in_progress(auth_client, test_user):
    """Тест изменения статуса задачи на 'В процессе'"""
    # Сначала создаем задачу
    task_data = {
        'title': 'Задача для изменения статуса',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Меняем статус задачи на "В процессе" (не завершена)
    status_data = {
        'taskId': task_id,
        'is_completed': False
    }
    
    response = auth_client.put('/api/tasks/change_status', 
                              data=json.dumps(status_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'changed_ids' in data
    # Проверяем, что ID является валидным UUID
    for changed_id in data['changed_ids']:
        assert is_valid_uuid(changed_id)

def test_change_status_task_not_found(auth_client, test_user):
    """Тест изменения статуса несуществующей задачи"""
    # Пытаемся изменить статус несуществующей задачи
    status_data = {
        'taskId': 'non-existent-uuid',
        'is_completed': True
    }
    
    response = auth_client.put('/api/tasks/change_status', 
                              data=json.dumps(status_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'not found' in data['message'].lower()

def test_change_status_invalid_status_id(auth_client, test_user):
    """Тест изменения статуса с неверным ID статуса"""
    # Сначала создаем задачу
    task_data = {
        'title': 'Задача для тестирования статуса',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Пытаемся изменить статус с невалидными данными
    status_data = {
        'taskId': task_id,
        'is_completed': 'invalid_boolean'
    }
    
    response = auth_client.put('/api/tasks/change_status', 
                              data=json.dumps(status_data),
                              content_type='application/json')
    
    # Проверяем, что сервер возвращает ошибку 400 для невалидного булева значения
    assert response.status_code == 400
    
    # Проверяем сообщение об ошибке
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'boolean' in data['message'].lower()

def test_change_status_with_completion_date(auth_client, test_user):
    """Тест изменения статуса с указанием даты завершения"""
    # Сначала создаем задачу
    task_data = {
        'title': 'Задача с датой завершения',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Меняем статус задачи на "Завершена" с указанием даты завершения
    completion_date = datetime.utcnow().isoformat() + 'Z'
    status_data = {
        'taskId': task_id,
        'is_completed': True,
        'completed_at': completion_date
    }
    
    response = auth_client.put('/api/tasks/change_status', 
                              data=json.dumps(status_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'changed_ids' in data
    # Проверяем, что ID является валидным UUID
    for changed_id in data['changed_ids']:
        assert is_valid_uuid(changed_id)

def test_change_status_unauthorized(client):
    """Тест изменения статуса задачи без аутентификации"""
    # Пытаемся изменить статус задачи без токена
    status_data = {
        'taskId': 'some-uuid',
        'is_completed': True
    }
    
    response = client.put('/api/tasks/change_status', 
                         data=json.dumps(status_data),
                         content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401