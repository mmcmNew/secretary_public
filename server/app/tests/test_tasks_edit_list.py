import pytest
import json

def test_edit_list_success(auth_client, test_user):
    """Тест успешного редактирования списка"""
    # Сначала создаем список
    list_data = {
        'type': 'list',
        'title': 'Исходный список',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    list_obj = json.loads(response.data)['new_object']
    list_id = list_obj['id']
    
    # Теперь редактируем список
    updated_data = {
        'listId': list_id,
        'type': 'list',
        'title': 'Обновленный список',
        'order': 1
    }
    
    response = auth_client.put('/api/tasks/edit_list', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'updated_list' in data
    assert data['updated_list']['title'] == 'Обновленный список'
    assert data['updated_list']['order'] == 1

def test_edit_group_success(auth_client, test_user):
    """Тест успешного редактирования группы"""
    # Сначала создаем группу
    group_data = {
        'type': 'group',
        'title': 'Исходная группа',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    group_obj = json.loads(response.data)['new_object']
    group_id = group_obj['id']
    
    # Теперь редактируем группу
    updated_data = {
        'listId': group_id,
        'type': 'group',
        'title': 'Обновленная группа',
        'order': 2
    }
    
    response = auth_client.put('/api/tasks/edit_list', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'updated_list' in data
    assert data['updated_list']['title'] == 'Обновленная группа'
    assert data['updated_list']['order'] == 2

def test_edit_project_success(auth_client, test_user):
    """Тест успешного редактирования проекта"""
    # Сначала создаем проект
    project_data = {
        'type': 'project',
        'title': 'Исходный проект',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(project_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    project_obj = json.loads(response.data)['new_object']
    project_id = project_obj['id']
    
    # Теперь редактируем проект
    updated_data = {
        'listId': project_id,
        'type': 'project',
        'title': 'Обновленный проект',
        'order': 3
    }
    
    response = auth_client.put('/api/tasks/edit_list', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'updated_list' in data
    assert data['updated_list']['title'] == 'Обновленный проект'
    assert data['updated_list']['order'] == 3

def test_edit_list_not_found(auth_client, test_user):
    """Тест редактирования несуществующего списка"""
    # Пытаемся отредактировать несуществующий список
    updated_data = {
        'listId': '999999',
        'type': 'list',
        'title': 'Несуществующий список'
    }
    
    response = auth_client.put('/api/tasks/edit_list', 
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == False
    assert 'not found' in data['message'].lower()

def test_edit_list_invalid_data(auth_client, test_user):
    """Тест редактирования списка с неверными данными"""
    # Пытаемся отредактировать список с неверными данными
    updated_data = "invalid json data"
    
    response = auth_client.put('/api/tasks/edit_list', 
                              data=updated_data,
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == False

def test_edit_list_unauthorized(client):
    """Тест редактирования списка без аутентификации"""
    # Пытаемся отредактировать список без токена
    updated_data = {
        'listId': '1',
        'type': 'list',
        'title': 'Список без авторизации'
    }
    
    response = client.put('/api/tasks/edit_list', 
                         data=json.dumps(updated_data),
                         content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401
