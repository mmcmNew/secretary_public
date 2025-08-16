import pytest
import json
import uuid

def test_get_tasks_by_ids_success(auth_client, test_user):
    """Тест успешного получения задач по ID"""
    # Создаем несколько задач
    task_ids = []
    for i in range(3):
        task_data = {
            'title': f'Задача для получения по ID {i+1}',
            'listId': 'tasks'
        }
        
        response = auth_client.post('/api/tasks/add_task', 
                                   data=json.dumps(task_data),
                                   content_type='application/json')
        
        assert response.status_code == 200
        task = json.loads(response.data)['task']
        task_ids.append(task['id'])
    
    # Получаем задачи по их ID
    ids_param = ','.join(map(str, task_ids))
    response = auth_client.get(f'/api/tasks/get_tasks_by_ids?ids={ids_param}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'tasks' in data
    assert len(data['tasks']) == 3
    
    # Проверяем, что все задачи имеют правильные ID
    returned_task_ids = [task['id'] for task in data['tasks']]
    for task_id in task_ids:
        assert task_id in returned_task_ids

def test_get_tasks_by_ids_empty_list(auth_client, test_user):
    """Тест получения задач по пустому списку ID"""
    # Получаем задачи по пустому списку ID
    response = auth_client.get('/api/tasks/get_tasks_by_ids?ids=')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'tasks' in data
    assert len(data['tasks']) == 0

def test_get_tasks_by_ids_invalid_ids(auth_client, test_user):
    """Тест получения задач по неверным ID"""
    # Пытаемся получить задачи по неверным ID
    response = auth_client.get('/api/tasks/get_tasks_by_ids?ids=invalid,not_a_number')
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data

def test_get_tasks_by_ids_nonexistent_tasks(auth_client, test_user):
    """Тест получения несуществующих задач по ID"""
    # Пытаемся получить несуществующие задачи по их ID
    non_existent_id_1 = str(uuid.uuid4())
    non_existent_id_2 = str(uuid.uuid4())
    response = auth_client.get(f'/api/tasks/get_tasks_by_ids?ids={non_existent_id_1},{non_existent_id_2}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа (должен вернуться пустой список)
    data = json.loads(response.data)
    assert 'tasks' in data
    assert len(data['tasks']) == 0

def test_get_tasks_by_ids_mixed_existing_and_nonexistent(auth_client, test_user):
    """Тест получения задач по смешанному списку существующих и несуществующих ID"""
    # Создаем одну задачу
    task_data = {
        'title': 'Существующая задача',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    existing_task_id = task['id']
    non_existent_id = str(uuid.uuid4())
    
    # Пытаемся получить задачи по смешанному списку ID
    response = auth_client.get(f'/api/tasks/get_tasks_by_ids?ids={existing_task_id},{non_existent_id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа (должна вернуться только существующая задача)
    data = json.loads(response.data)
    assert 'tasks' in data
    assert len(data['tasks']) == 1
    assert data['tasks'][0]['id'] == existing_task_id

def test_get_tasks_by_ids_unauthorized(client):
    """Тест получения задач по ID без аутентификации"""
    # Пытаемся получить задачи без токена
    id_1 = str(uuid.uuid4())
    id_2 = str(uuid.uuid4())
    response = client.get(f'/api/tasks/get_tasks_by_ids?ids={id_1},{id_2}')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401
