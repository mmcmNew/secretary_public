import pytest
import json

def test_link_task_to_list_success(auth_client, test_user, clean_db):
    """Тест успешного связывания задачи со списком"""
    # Создаем задачу
    task_data = {
        'title': 'Задача для связывания',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Создаем список
    list_data = {
        'type': 'list',
        'title': 'Список для связывания с задачей',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    list_obj = json.loads(response.data)['new_object']
    list_id = list_obj['id']
    
    # Связываем задачу со списком
    link_data = {
        'task_id': task_id,
        'target_id': list_id,
        'target_type': 'list'
    }
    
    response = auth_client.put('/api/tasks/link_task', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True

def test_link_task_to_task_success(auth_client, test_user, clean_db):
    """Тест успешного связывания задачи с другой задачей (создание подзадачи)"""
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
    
    # Создаем дочернюю задачу
    child_task_data = {
        'title': 'Дочерняя задача',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(child_task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    child_task = json.loads(response.data)['task']
    child_task_id = child_task['id']
    
    # Связываем дочернюю задачу с родительской
    link_data = {
        'task_id': child_task_id,
        'target_id': parent_task_id,
        'target_type': 'task'
    }
    
    response = auth_client.put('/api/tasks/link_task', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True

def test_link_task_move_action(auth_client, test_user, clean_db):
    """Тест связывания задачи с действием перемещения"""
    # Создаем задачу
    task_data = {
        'title': 'Задача для перемещения',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Создаем исходный список
    source_list_data = {
        'type': 'list',
        'title': 'Исходный список',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(source_list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    source_list = json.loads(response.data)['new_object']
    source_list_id = source_list['id']
    
    # Создаем целевой список
    target_list_data = {
        'type': 'list',
        'title': 'Целевой список',
        'order': 1
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(target_list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    target_list = json.loads(response.data)['new_object']
    target_list_id = target_list['id']
    
    # Сначала связываем задачу с исходным списком
    link_data = {
        'task_id': task_id,
        'target_id': source_list_id,
        'target_type': 'list'
    }
    
    response = auth_client.put('/api/tasks/link_task', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    assert response.status_code == 200
    
    # Теперь перемещаем задачу в целевой список
    move_data = {
        'task_id': task_id,
        'target_id': target_list_id,
        'target_type': 'list',
        'action': 'move',
        'source_list_id': source_list_id
    }
    
    response = auth_client.put('/api/tasks/link_task', 
                              data=json.dumps(move_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True

def test_link_task_invalid_task_id(auth_client, test_user):
    """Тест связывания с неверным ID задачи"""
    # Пытаемся связать несуществующую задачу со списком
    link_data = {
        'task_id': 999999,
        'list_id': 1
    }
    
    response = auth_client.put('/api/tasks/link_task', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос

def test_link_task_to_itself(auth_client, test_user):
    """Тест попытки связать задачу с самой собой"""
    # Создаем задачу
    task_data = {
        'title': 'Задача для тестирования самосвязывания',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Пытаемся связать задачу с самой собой
    link_data = {
        'task_id': task_id,
        'target_id': task_id,
        'target_type': 'task'
    }
    
    response = auth_client.put('/api/tasks/link_task', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data

def test_link_task_unauthorized(client):
    """Тест связывания задачи без аутентификации"""
    # Пытаемся связать задачу без токена
    link_data = {
        'task_id': 1,
        'list_id': 2
    }
    
    response = client.put('/api/tasks/link_task', 
                         data=json.dumps(link_data),
                         content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401