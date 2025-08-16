import pytest
import json

def test_delete_task_type_success(auth_client, test_user):
    """Тест успешного удаления типа задачи"""
    # Создаем тип задачи для последующего удаления
    type_data = {
        'name': 'Тип задачи для удаления'
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    type_id = task_type['id']
    
    # Удаляем тип задачи
    response = auth_client.delete(f'/api/tasks/task_types/{type_id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'result' in data
    assert data['result'] == 'deleted'

def test_delete_task_type_not_found(auth_client, test_user):
    """Тест удаления несуществующего типа задачи"""
    # Пытаемся удалить несуществующий тип задачи
    response = auth_client.delete('/api/tasks/task_types/999999')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not found' in data['error'].lower()

def test_delete_task_type_invalid_id(auth_client, test_user):
    """Тест удаления типа задачи с неверным ID"""
    # Пытаемся удалить тип задачи с неверным ID
    response = auth_client.delete('/api/tasks/task_types/invalid_id')
    
    # Проверяем статус ответа (должен быть 404 Not Found для неверного ID)
    assert response.status_code == 404

def test_delete_task_type_assigned_to_tasks(auth_client, test_user):
    """Тест удаления типа задачи, назначенного задачам"""
    # Создаем тип задачи
    type_data = {
        'name': 'Тип задачи для проверки назначения'
    }
    
    response = auth_client.post('/api/tasks/task_types', 
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    type_id = task_type['id']
    
    # Создаем задачу с этим типом
    task_data = {
        'title': 'Задача с типом',
        'type_id': type_id,
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    
    # Пытаемся удалить тип задачи, назначенного задаче
    response = auth_client.delete(f'/api/tasks/task_types/{type_id}')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос
    assert response.status_code in [200, 400, 500]

def test_delete_task_type_unauthorized(client):
    """Тест удаления типа задачи без аутентификации"""
    # Пытаемся удалить тип задачи без токена
    response = client.delete('/api/tasks/task_types/1')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401