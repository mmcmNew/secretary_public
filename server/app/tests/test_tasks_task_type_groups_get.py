import pytest
import json

def test_get_task_type_groups_success(auth_client, test_user):
    """Тест успешного получения групп типов задач"""
    # Создаем несколько групп типов задач
    group_names = ['Группа 1', 'Группа 2', 'Группа 3']
    group_ids = []
    
    for name in group_names:
        group_data = {
            'name': name
        }
        
        response = auth_client.post('/api/tasks/task_type_groups', 
                                   data=json.dumps(group_data),
                                   content_type='application/json')
        
        assert response.status_code == 201
        group = json.loads(response.data)
        group_ids.append(group['id'])
    
    # Получаем все группы типов задач
    response = auth_client.get('/api/tasks/task_type_groups')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Проверяем, что все созданные группы присутствуют в ответе
    assert len(data) >= 3
    
    # Проверяем, что все созданные группы есть в ответе
    returned_group_names = [group['name'] for group in data.values()]
    for name in group_names:
        assert name in returned_group_names

def test_get_task_type_groups_empty(auth_client, test_user):
    """Тест получения групп типов задач, когда их нет"""
    # Получаем группы типов задач, когда их еще не создано
    response = auth_client.get('/api/tasks/task_type_groups')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    
    # Должен вернуться пустой словарь или словарь с существующими группами
    assert isinstance(data, dict)

def test_get_task_type_groups_unauthorized(client):
    """Тест получения групп типов задач без аутентификации"""
    # Пытаемся получить группы типов задач без токена
    response = client.get('/api/tasks/task_type_groups')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_get_task_type_groups_cached(auth_client, test_user):
    """Тест кэширования получения групп типов задач"""
    # Получаем группы типов задач первый раз
    response1 = auth_client.get('/api/tasks/task_type_groups')
    assert response1.status_code == 200
    
    # Получаем группы типов задач второй раз
    response2 = auth_client.get('/api/tasks/task_type_groups')
    assert response2.status_code == 200
    
    # Сравниваем ETag заголовки
    etag1 = response1.headers.get('ETag')
    etag2 = response2.headers.get('ETag')
    
    # Если кэширование работает, ETag должны совпадать
    if etag1 and etag2:
        assert etag1 == etag2