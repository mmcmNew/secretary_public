import pytest
import json
from datetime import datetime, timedelta
from conftest import is_valid_uuid

def test_add_task_success(auth_client, test_user):
    """Тест успешного добавления задачи"""
    # Подготавливаем данные для запроса
    task_data = {
        'title': 'Тестовая задача',
        'listId': 'tasks'
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == 'Тестовая задача'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])

def test_add_task_without_title(auth_client, test_user):
    """Тест добавления задачи без заголовка"""
    # Подготавливаем данные для запроса без заголовка
    task_data = {
        'listId': 'tasks'
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    # Проверяем статус ответа (ожидаем ошибку)
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'title' in data['message'].lower()

def test_add_task_with_due_date(auth_client, test_user):
    """Тест добавления задачи с датой выполнения"""
    # Подготавливаем данные для запроса с датой выполнения
    due_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
    task_data = {
        'title': 'Задача с датой выполнения',
        'end': due_date,
        'listId': 'tasks'
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
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

def test_add_task_to_my_day(auth_client, test_user):
    """Тест добавления задачи в 'Мой день'"""
    # Подготавливаем данные для запроса
    task_data = {
        'title': 'Задача на сегодня',
        'listId': 'my_day'
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == 'Задача на сегодня'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])

def test_add_task_to_important(auth_client, test_user):
    """Тест добавления важной задачи"""
    # Подготавливаем данные для запроса
    task_data = {
        'title': 'Важная задача',
        'listId': 'important'
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == 'Важная задача'
    assert data['task']['is_important'] is True
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])

def test_add_task_to_background(auth_client, test_user):
    """Тест добавления фоновой задачи"""
    # Подготавливаем данные для запроса
    task_data = {
        'title': 'Фоновая задача',
        'listId': 'background'
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == 'Фоновая задача'
    assert data['task']['is_background'] is True
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])

def test_add_task_unauthorized(client):
    """Тест добавления задачи без аутентификации"""
    # Подготавливаем данные для запроса
    task_data = {
        'title': 'Тестовая задача',
        'listId': 'tasks'
    }
    
    # Отправляем POST запрос без токена
    response = client.post('/api/tasks/add_task', 
                          data=json.dumps(task_data),
                          content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401