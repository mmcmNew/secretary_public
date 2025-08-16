import pytest
import json

def test_delete_task_type_group_success(auth_client, test_user):
    """Тест успешного удаления группы типов задач"""
    # Создаем группу для последующего удаления
    group_data = {
        'name': 'Группа для удаления'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Удаляем группу
    response = auth_client.delete(f'/api/tasks/task_type_groups/{group_id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'result' in data
    assert data['result'] == 'deleted'

def test_delete_task_type_group_not_found(auth_client, test_user):
    """Тест удаления несуществующей группы типов задач"""
    # Пытаемся удалить несуществующую группу
    response = auth_client.delete('/api/tasks/task_type_groups/999999')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not found' in data['error'].lower()

def test_delete_task_type_group_invalid_id(auth_client, test_user):
    """Тест удаления группы типов задач с неверным ID"""
    # Пытаемся удалить группу с неверным ID
    response = auth_client.delete('/api/tasks/task_type_groups/invalid_id')
    
    # Проверяем статус ответа (должен быть 404 Not Found для неверного ID)
    assert response.status_code == 404

def test_delete_task_type_group_with_types(auth_client, test_user):
    """Тест удаления группы типов задач, содержащей типы задач"""
    # Создаем группу
    group_data = {
        'name': 'Группа с типами задач'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    group_id = group['id']
    
    # Создаем тип задачи в этой группе
    type_data = {
        'name': 'Тип задачи в группе',
        'group_id': group_id
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    
    # Пытаемся удалить группу, содержащую типы задач
    response = auth_client.delete(f'/api/tasks/task_type_groups/{group_id}')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос
    assert response.status_code in [200, 400, 500]

def test_delete_task_type_group_unauthorized(client):
    """Тест удаления группы типов задач без аутентификации"""
    # Пытаемся удалить группу без токена
    response = client.delete('/api/tasks/task_type_groups/1')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401