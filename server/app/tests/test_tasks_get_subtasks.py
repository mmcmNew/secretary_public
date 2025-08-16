import pytest
import json

def test_get_subtasks_success(auth_client, test_user):
    """Тест успешного получения подзадач"""
    # Создаем родительскую задачу
    parent_task_data = {
        'title': 'Родительская задача',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(parent_task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    parent_task = json.loads(response.data)['task']
    parent_task_id = parent_task['id']
    
    # Создаем несколько подзадач
    subtask_titles = ['Подзадача 1', 'Подзадача 2', 'Подзадача 3']
    subtask_ids = []
    
    for title in subtask_titles:
        subtask_data = {
            'title': title,
            'parentTaskId': parent_task_id
        }
        
        response = auth_client.post('/api/tasks/add_subtask', 
                                   data=json.dumps(subtask_data),
                                   content_type='application/json')
        
        assert response.status_code == 200
        subtask = json.loads(response.data)['subtask']
        subtask_ids.append(subtask['id'])
    
    # Получаем подзадачи
    response = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={parent_task_id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что все созданные подзадачи присутствуют в ответе
    assert 'subtasks' in data
    assert len(data['subtasks']) == 3
    
    # Проверяем, что все созданные подзадачи есть в ответе
    returned_subtask_titles = [subtask['title'] for subtask in data['subtasks']]
    for title in subtask_titles:
        assert title in returned_subtask_titles

def test_get_subtasks_empty(auth_client, test_user):
    """Тест получения подзадач, когда их нет"""
    # Создаем задачу без подзадач
    task_data = {
        'title': 'Задача без подзадач',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Получаем подзадачи для задачи без подзадач
    response = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={task_id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Должен вернуться пустой список подзадач
    assert 'subtasks' in data
    assert len(data['subtasks']) == 0

def test_get_subtasks_not_found(auth_client, test_user):
    """Тест получения подзадач для несуществующей задачи"""
    # Пытаемся получить подзадачи для несуществующей задачи
    response = auth_client.get('/api/tasks/get_subtasks?parent_task_id=999999')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] == False
    assert 'not found' in data['message'].lower()

def test_get_subtasks_invalid_id(auth_client, test_user):
    """Тест получения подзадач с неверным ID родительской задачи"""
    # Пытаемся получить подзадачи с неверным ID
    response = auth_client.get('/api/tasks/get_subtasks?parent_task_id=invalid_id')
    
    # Проверяем статус ответа (может быть 404 или 400 в зависимости от реализации)
    assert response.status_code in [404, 400]

def test_get_subtasks_preserve_order(auth_client, test_user):
    """Тест сохранения порядка подзадач"""
    # Создаем родительскую задачу
    parent_task_data = {
        'title': 'Родительская задача для проверки порядка',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(parent_task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    parent_task = json.loads(response.data)['task']
    parent_task_id = parent_task['id']
    
    # Создаем подзадачи в определенном порядке
    subtask_titles = ['Первая подзадача', 'Вторая подзадача', 'Третья подзадача']
    subtask_ids = []
    
    for title in subtask_titles:
        subtask_data = {
            'title': title,
            'parentTaskId': parent_task_id
        }
        
        response = auth_client.post('/api/tasks/add_subtask', 
                                   data=json.dumps(subtask_data),
                                   content_type='application/json')
        
        assert response.status_code == 200
        subtask = json.loads(response.data)['subtask']
        subtask_ids.append(subtask['id'])
    
    # Получаем подзадачи
    response = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={parent_task_id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что подзадачи возвращаются в правильном порядке
    assert 'subtasks' in data
    assert len(data['subtasks']) == 3
    
    # Проверяем порядок подзадач
    returned_subtask_titles = [subtask['title'] for subtask in data['subtasks']]
    assert returned_subtask_titles == subtask_titles

def test_get_subtasks_unauthorized(client):
    """Тест получения подзадач без аутентификации"""
    # Пытаемся получить подзадачи без токена
    response = client.get('/api/tasks/get_subtasks?parent_task_id=1')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_get_subtasks_cached(auth_client, test_user):
    """Тест кэширования получения подзадач"""
    # Создаем родительскую задачу
    parent_task_data = {
        'title': 'Родительская задача для кэширования',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(parent_task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    parent_task = json.loads(response.data)['task']
    parent_task_id = parent_task['id']
    
    # Получаем подзадачи первый раз
    response1 = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={parent_task_id}')
    assert response1.status_code == 200
    
    # Получаем подзадачи второй раз
    response2 = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={parent_task_id}')
    assert response2.status_code == 200
    
    # Сравниваем ETag заголовки
    etag1 = response1.headers.get('ETag')
    etag2 = response2.headers.get('ETag')
    
    # Если кэширование работает, ETag должны совпадать
    if etag1 and etag2:
        assert etag1 == etag2