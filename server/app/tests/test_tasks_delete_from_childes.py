import pytest
import json

def test_delete_from_childes_success(auth_client, test_user):
    """Тест успешного удаления элемента из списка детей"""
    # Создаем список
    list_data = {
        'type': 'list',
        'title': 'Список для тестирования удаления из детей',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    list_obj = json.loads(response.data)['new_object']
    list_id = list_obj['id']
    
    # Создаем группу
    group_data = {
        'type': 'group',
        'title': 'Группа для тестирования удаления из детей',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    group_obj = json.loads(response.data)['new_object']
    group_id = group_obj['id']
    
    # Сначала связываем список и группу
    link_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group'
    }
    
    response = auth_client.put('/api/tasks/link_items', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    assert response.status_code == 200
    
    # Теперь удаляем список из детей группы
    delete_data = {
        'source_id': list_id,
        'source_type': 'list',
        'parent_id': group_id,
        'parent_type': 'group'
    }
    
    response = auth_client.delete('/api/tasks/delete_from_childes', 
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True

def test_delete_from_childes_special_list(auth_client, test_user, task_for_today):
    """Тест удаления из детей специального списка"""
    # Пытаемся удалить из детей специального списка
    delete_data = {
        'source_id': task_for_today.id,
        'source_type': 'task',
        'parent_id': 'my_day',
        'parent_type': 'list'
    }
    
    response = auth_client.delete('/api/tasks/delete_from_childes', 
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True

def test_delete_from_childes_without_group_id(auth_client, test_user):
    """Тест удаления из детей без указания ID группы"""
    # Создаем список
    list_data = {
        'type': 'list',
        'title': 'Список для тестирования без группы',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    list_obj = json.loads(response.data)['new_object']
    list_id = list_obj['id']
    
    # Пытаемся удалить из детей без указания ID группы
    delete_data = {
        'source_id': list_id,
        'source_type': 'list'
    }
    
    response = auth_client.delete('/api/tasks/delete_from_childes', 
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    
    assert response.status_code == 200

def test_delete_from_childes_invalid_source(auth_client, test_user):
    """Тест удаления несуществующего элемента из детей"""
    # Пытаемся удалить несуществующий элемент из детей
    delete_data = {
        'source_id': '999999',
        'source_type': 'task',
        'parent_id': 'group_1',
        'parent_type': 'group'
    }
    
    response = auth_client.delete('/api/tasks/delete_from_childes', 
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    
    assert response.status_code == 404

def test_delete_from_childes_unauthorized(client):
    """Тест удаления из детей без аутентификации"""
    # Пытаемся удалить из детей без токена
    delete_data = {
        'source_id': '1',
        'source_type': 'task',
        'parent_id': 'group_1',
        'parent_type': 'group'
    }
    
    response = client.delete('/api/tasks/delete_from_childes', 
                            data=json.dumps(delete_data),
                            content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401
