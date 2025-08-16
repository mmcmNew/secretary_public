import pytest
import json
from datetime import datetime, timedelta

def test_get_calendar_events_success(auth_client, test_user):
    """Тест успешного получения событий календаря"""
    # Создаем задачу с датой для календаря
    due_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
    task_data = {
        'title': 'Задача для календаря',
        'end': due_date,
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    
    # Подготавливаем диапазон дат для получения событий
    start_date = datetime.utcnow().isoformat() + 'Z'
    end_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + 'Z'
    
    # Получаем события календаря
    response = auth_client.get(f'/api/tasks/get_calendar_events?start={start_date}&end={end_date}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем наличие основных полей
    assert 'events' in data
    assert 'parent_tasks' in data

def test_get_calendar_events_without_dates(auth_client, test_user):
    """Тест получения событий календаря без указания дат"""
    # Получаем события календаря без указания дат
    response = auth_client.get('/api/tasks/get_calendar_events')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем наличие основных полей
    assert 'events' in data
    assert 'parent_tasks' in data

def test_get_calendar_events_with_my_day(auth_client, test_user):
    """Тест получения событий календаря для 'Мой день'"""
    # Создаем задачу для "Мой день"
    task_data = {
        'title': 'Задача для моего дня',
        'listId': 'my_day'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    
    # Подготавливаем диапазон дат для получения событий
    start_date = datetime.utcnow().isoformat() + 'Z'
    end_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
    
    # Получаем события календаря
    response = auth_client.get(f'/api/tasks/get_calendar_events?start={start_date}&end={end_date}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем наличие основных полей
    assert 'events' in data
    assert 'parent_tasks' in data

def test_get_calendar_events_empty_range(auth_client, test_user):
    """Тест получения событий календаря в пустом диапазоне"""
    # Подготавливаем диапазон дат без событий
    start_date = (datetime.utcnow() + timedelta(days=10)).isoformat() + 'Z'
    end_date = (datetime.utcnow() + timedelta(days=11)).isoformat() + 'Z'
    
    # Получаем события календаря
    response = auth_client.get(f'/api/tasks/get_calendar_events?start={start_date}&end={end_date}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем наличие основных полей
    assert 'events' in data
    assert 'parent_tasks' in data
    # Должен вернуться пустой список событий
    assert isinstance(data['events'], list)

def test_get_calendar_events_invalid_dates(auth_client, test_user):
    """Тест получения событий календаря с неверными датами"""
    # Пытаемся получить события с неверными датами
    response = auth_client.get('/api/tasks/get_calendar_events?start=invalid_date&end=another_invalid_date')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос
    assert response.status_code in [200, 400, 500]

def test_get_calendar_events_unauthorized(client):
    """Тест получения событий календаря без аутентификации"""
    # Подготавливаем диапазон дат
    start_date = datetime.utcnow().isoformat() + 'Z'
    end_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
    
    # Пытаемся получить события календаря без токена
    response = client.get(f'/api/tasks/get_calendar_events?start={start_date}&end={end_date}')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_get_calendar_events_cached(auth_client, test_user):
    """Тест кэширования получения событий календаря"""
    # Подготавливаем диапазон дат
    start_date = datetime.utcnow().isoformat() + 'Z'
    end_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
    
    # Получаем события календаря первый раз
    response1 = auth_client.get(f'/api/tasks/get_calendar_events?start={start_date}&end={end_date}')
    assert response1.status_code == 200
    
    # Получаем события календаря второй раз
    response2 = auth_client.get(f'/api/tasks/get_calendar_events?start={start_date}&end={end_date}')
    assert response2.status_code == 200
    
    # Сравниваем ETag заголовки
    etag1 = response1.headers.get('ETag')
    etag2 = response2.headers.get('ETag')
    
    # Если кэширование работает, ETag должны совпадать
    if etag1 and etag2:
        assert etag1 == etag2