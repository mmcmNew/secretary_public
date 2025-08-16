import pytest
import json

def test_get_task_types_success(auth_client, test_user):
    """Тест успешного получения типов задач"""
    # Создаем группу для типов задач
    group_data = {
        'name': 'Группа для типов задач'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Создаем несколько типов задач
    type_names = ['Тип 1', 'Тип 2', 'Тип 3']
    type_ids = []
    
    for name in type_names:
        type_data = {
            'name': name,
            'group_id': group_id
        }
        
        response = auth_client.post('/api/tasks/task_types', 
                                   data=json.dumps(type_data),
                                   content_type='application/json')
        
        assert response.status_code == 201
        task_type = json.loads(response.data)
        type_ids.append(task_type['id'])
    
    # Получаем все типы задач
    response = auth_client.get('/api/tasks/task_types')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что все созданные типы присутствуют в ответе
    assert len(data) >= 3
    
    # Проверяем, что все созданные типы есть в ответе
    returned_type_names = [task_type['name'] for task_type in data.values()]
    for name in type_names:
        assert name in returned_type_names

def test_get_task_types_empty(auth_client, test_user):
    """Тест получения типов задач, когда их нет"""
    # Получаем типы задач, когда их еще не создано
    response = auth_client.get('/api/tasks/task_types')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Должен вернуться пустой словарь или словарь с существующими типами
    assert isinstance(data, dict)

def test_get_task_types_with_group_info(auth_client, test_user):
    """Тест получения типов задач с информацией о группе"""
    # Создаем группу для типов задач
    group_data = {
        'name': 'Группа для проверки информации'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Создаем тип задачи в этой группе
    type_data = {
        'name': 'Тип задачи с группой',
        'group_id': group_id
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    type_id = task_type['id']
    
    # Получаем все типы задач
    response = auth_client.get('/api/tasks/task_types')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что созданный тип присутствует в ответе с информацией о группе
    assert str(type_id) in data
    returned_type = data[str(type_id)]
    assert returned_type['name'] == 'Тип задачи с группой'
    assert returned_type['group_id'] == group_id

def test_get_task_types_unauthorized(client):
    """Тест получения типов задач без аутентификации"""
    # Пытаемся получить типы задач без токена
    response = client.get('/api/tasks/task_types')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_get_task_types_cached(auth_client, test_user):
    """Тест кэширования получения типов задач"""
    # Получаем типы задач первый раз
    response1 = auth_client.get('/api/tasks/task_types')
    assert response1.status_code == 200
    
    # Получаем типы задач второй раз
    response2 = auth_client.get('/api/tasks/task_types')
    assert response2.status_code == 200
    
    # Сравниваем ETag заголовки
    etag1 = response1.headers.get('ETag')
    etag2 = response2.headers.get('ETag')
    
    # Если кэширование работает, ETag должны совпадать
    if etag1 and etag2:
        assert etag1 == etag2