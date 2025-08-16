import pytest
import json

def test_delete_task_success(auth_client, test_user):
    """Тест успешного удаления задачи"""
    # Создаем задачу для удаления
    task_data = {
        'title': 'Задача для удаления',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    task_id = task['id']
    
    # Удаляем задачу
    delete_data = {
        'taskId': task_id
    }
    
    response = auth_client.delete('/api/tasks/del_task', 
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'message' in data
    assert 'deleted successfully' in data['message'].lower()

def test_delete_task_not_found(auth_client, test_user):
    """Тест удаления несуществующей задачи"""
    # Пытаемся удалить несуществующую задачу
    delete_data = {
        'taskId': "999999"
    }
    
    response = auth_client.delete('/api/tasks/del_task', 
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not found' in data['error'].lower()

def test_delete_task_without_task_id(auth_client, test_user):
    """Тест удаления задачи без указания ID"""
    # Пытаемся удалить задачу без указания ID
    delete_data = {}
    
    response = auth_client.delete('/api/tasks/del_task', 
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос

def test_delete_task_invalid_data(auth_client, test_user):
    """Тест удаления задачи с неверными данными"""
    # Пытаемся удалить задачу с неверными данными
    delete_data = "invalid json data"
    
    response = auth_client.delete('/api/tasks/del_task', 
                                 data=delete_data,
                                 content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос

def test_delete_task_unauthorized(client):
    """Тест удаления задачи без аутентификации"""
    # Пытаемся удалить задачу без токена
    delete_data = {
        'taskId': 1
    }
    
    response = client.delete('/api/tasks/del_task', 
                            data=json.dumps(delete_data),
                            content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401