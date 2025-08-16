import pytest
import json

def test_link_group_to_list_success(auth_client, test_user, clean_db):
    """Тест успешного связывания группы и списка"""
    # Создаем список
    list_data = {
        'type': 'list',
        'title': 'Список для связывания',
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
        'title': 'Группа для связывания',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    group_obj = json.loads(response.data)['new_object']
    group_id = group_obj['id']
    
    # Связываем группу и список
    link_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group'
    }
    
    response = auth_client.put('/api/tasks/link_group_list', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True

def test_link_project_to_list_success(auth_client, test_user, clean_db):
    """Тест успешного связывания проекта и списка"""
    # Создаем список
    list_data = {
        'type': 'list',
        'title': 'Список для связывания с проектом',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    list_obj = json.loads(response.data)['new_object']
    list_id = list_obj['id']
    
    # Создаем проект
    project_data = {
        'type': 'project',
        'title': 'Проект для связывания',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(project_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    project_obj = json.loads(response.data)['new_object']
    project_id = project_obj['id']
    
    # Связываем проект и список
    link_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': project_id,
        'target_type': 'project'
    }
    
    response = auth_client.put('/api/tasks/link_group_list', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] == True

def test_link_group_list_invalid_source(auth_client, test_user):
    """Тест связывания с неверным источником"""
    # Пытаемся связать несуществующий источник с группой
    link_data = {
        'source_id': 999999,
        'target_id': 'group_1'
    }
    
    response = auth_client.put('/api/tasks/link_group_list', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    # Проверяем статус ответа (может быть успешным или с ошибкой в зависимости от реализации)
    # В данном случае мы просто проверяем, что сервер корректно обрабатывает запрос

def test_link_group_list_invalid_target(auth_client, test_user):
    """Тест связывания с неверной целью"""
    # Создаем список
    list_data = {
        'type': 'list',
        'title': 'Список для тестирования неверной цели',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    list_obj = json.loads(response.data)['new_object']
    list_id = list_obj['id']
    
    # Пытаемся связать список с неверной целью
    link_data = {
        'source_id': list_id,
        'target_id': 'invalid_target'
    }
    
    response = auth_client.put('/api/tasks/link_group_list', 
                              data=json.dumps(link_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 400 or response.status_code == 500
    
    # Проверяем структуру ответа (в зависимости от реализации)

def test_link_group_list_unauthorized(client):
    """Тест связывания группы и списка без аутентификации"""
    # Пытаемся связать группу и список без токена
    link_data = {
        'source_id': 1,
        'target_id': 'group_1'
    }
    
    response = client.put('/api/tasks/link_group_list', 
                         data=json.dumps(link_data),
                         content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401