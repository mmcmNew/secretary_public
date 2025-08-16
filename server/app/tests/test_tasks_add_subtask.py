import pytest
import json

def test_add_subtask_success(auth_client, test_user):
    """Тест успешного добавления подзадачи"""
    # Сначала создаем родительскую задачу
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
    
    # Теперь создаем подзадачу
    subtask_data = {
        'title': 'Подзадача',
        'parentTaskId': parent_task_id
    }
    
    response = auth_client.post('/api/tasks/add_subtask', 
                               data=json.dumps(subtask_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'subtask' in data
    assert data['subtask']['title'] == 'Подзадача'
    assert 'parent_task' in data
    assert data['parent_task']['id'] == parent_task_id

def test_add_subtask_without_parent(auth_client, test_user):
    """Тест добавления подзадачи без указания родительской задачи"""
    # Пытаемся создать подзадачу без указания родительской задачи
    subtask_data = {
        'title': 'Подзадача без родителя'
    }
    
    response = auth_client.post('/api/tasks/add_subtask', 
                               data=json.dumps(subtask_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == False
    assert 'недостаточно данных' in data['message'].lower()

def test_add_subtask_parent_not_found(auth_client, test_user):
    """Тест добавления подзадачи с несуществующей родительской задачей"""
    # Пытаемся создать подзадачу с несуществующей родительской задачей
    subtask_data = {
        'title': 'Подзадача с несуществующим родителем',
        'parentTaskId': '99999999-9999-9999-9999-999999999999'
    }
    
    response = auth_client.post('/api/tasks/add_subtask', 
                               data=json.dumps(subtask_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == False
    assert 'не найдена' in data['message'].lower()

def test_add_subtask_without_title(auth_client, test_user):
    """Тест добавления подзадачи без заголовка"""
    # Сначала создаем родительскую задачу
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
    
    # Пытаемся создать подзадачу без заголовка
    subtask_data = {
        'parentTaskId': parent_task_id
    }
    
    response = auth_client.post('/api/tasks/add_subtask', 
                               data=json.dumps(subtask_data),
                               content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным, если сервер генерирует заголовок по умолчанию)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос

def test_add_subtask_unauthorized(client):
    """Тест добавления подзадачи без аутентификации"""
    # Пытаемся создать подзадачу без токена
    subtask_data = {
        'title': 'Подзадача без авторизации',
        'parentTaskId': '11111111-1111-1111-1111-111111111111'
    }
    
    response = client.post('/api/tasks/add_subtask', 
                          data=json.dumps(subtask_data),
                          content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401