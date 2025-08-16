import pytest
import json
from datetime import datetime, timedelta

def test_get_tasks_by_list_id(auth_client, test_user):
    """Тест получения задач по ID списка"""
    # Сначала создаем список
    list_data = {
        'type': 'list',
        'title': 'Список для тестирования',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    list_obj = json.loads(response.data)['new_object']
    list_id = list_obj['id']
    
    # Создаем несколько задач в этом списке
    for i in range(3):
        task_data = {
            'title': f'Задача {i+1}',
            'listId': list_id
        }
        
        response = auth_client.post('/api/tasks/add_task', 
                                   data=json.dumps(task_data),
                                   content_type='application/json')
        
        assert response.status_code == 200
    
    # Получаем задачи по ID списка
    response = auth_client.get(f'/api/tasks/get_tasks?list_id={list_id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'tasks' in data
    assert len(data['tasks']) == 3
    
    # Проверяем, что все задачи имеют правильный заголовок
    task_titles = [task['title'] for task in data['tasks']]
    for i in range(3):
        assert f'Задача {i+1}' in task_titles

def test_get_all_tasks(auth_client, test_user):
    """Тест получения всех задач"""
    # Создаем несколько задач в разных списках
    for i in range(2):
        task_data = {
            'title': f'Общая задача {i+1}',
            'listId': 'tasks'
        }
        
        response = auth_client.post('/api/tasks/add_task', 
                                   data=json.dumps(task_data),
                                   content_type='application/json')
        
        assert response.status_code == 200
    
    # Получаем все задачи
    response = auth_client.get('/api/tasks/get_tasks?list_id=all')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'tasks' in data
    # Должно быть как минимум 2 задачи (которые мы создали)
    assert len(data['tasks']) >= 2

def test_get_tasks_without_list_id(auth_client, test_user):
    """Тест получения задач без указания ID списка"""
    # Получаем задачи без указания списка (должны вернуться задачи по умолчанию)
    response = auth_client.get('/api/tasks/get_tasks')
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data

def test_get_tasks_with_date_range(auth_client, test_user):
    """Тест получения задач в заданном диапазоне дат"""
    # Создаем задачу с датой выполнения
    due_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
    task_data = {
        'title': 'Задача с датой',
        'end': due_date,
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    
    # Получаем задачи в диапазоне дат
    start_date = datetime.utcnow().isoformat() + 'Z'
    end_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + 'Z'
    
    response = auth_client.get(f'/api/tasks/get_tasks?list_id=events&start={start_date}&end={end_date}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'tasks' in data

def test_get_tasks_unauthorized(client):
    """Тест получения задач без аутентификации"""
    # Пытаемся получить задачи без токена
    response = client.get('/api/tasks/get_tasks?list_id=1')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_get_tasks_invalid_list_id(auth_client, test_user):
    """Тест получения задач с неверным ID списка"""
    # Пытаемся получить задачи с неверным ID списка
    response = auth_client.get('/api/tasks/get_tasks?list_id=invalid')
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data