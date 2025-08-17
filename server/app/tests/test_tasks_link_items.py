import pytest
import json
import uuid

def test_link_list_to_group_success(auth_client, clean_db):
    """Тест успешного связывания списка с группой"""
    # Создаем список
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']

    # Создаем группу
    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    assert response.status_code == 200
    group_id = json.loads(response.data)['new_object']['id']

    # Связываем список с группой
    link_data = {'source_id': list_id, 'source_type': 'list', 'target_id': group_id, 'target_type': 'group'}
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    assert response.status_code == 200
    assert json.loads(response.data)['success'] is True

    # Проверяем, что список связан с группой
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    group = next((item for item in data['lists'] if item['id'] == group_id and item['type'] == 'group'), None)
    assert group is not None
    assert list_id in group['childes_order']


def test_link_list_to_project_success(auth_client, clean_db):
    """Тест успешного связывания списка с проектом"""
    # Создаем список
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']

    # Создаем проект
    project_data = {'type': 'project', 'title': 'Project 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(project_data), content_type='application/json')
    assert response.status_code == 200
    project_id = json.loads(response.data)['new_object']['id']

    # Связываем список с проектом
    link_data = {'source_id': list_id, 'source_type': 'list', 'target_id': project_id, 'target_type': 'project'}
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    assert response.status_code == 200
    assert json.loads(response.data)['success'] is True

    # Проверяем, что список связан с проектом
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    project = next((item for item in data['projects'] if item['id'] == project_id and item['type'] == 'project'), None)
    assert project is not None
    assert list_id in project['childes_order']


def test_link_group_to_project_success(auth_client, clean_db):
    """Тест успешного связывания группы с проектом"""
    # Создаем группу
    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    assert response.status_code == 200
    group_id = json.loads(response.data)['new_object']['id']

    # Создаем проект
    project_data = {'type': 'project', 'title': 'Project 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(project_data), content_type='application/json')
    assert response.status_code == 200
    project_id = json.loads(response.data)['new_object']['id']

    # Связываем группу с проектом
    link_data = {'source_id': group_id, 'source_type': 'group', 'target_id': project_id, 'target_type': 'project'}
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    assert response.status_code == 200
    assert json.loads(response.data)['success'] is True

    # Проверяем, что группа связана с проектом
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    project = next((item for item in data['projects'] if item['id'] == project_id and item['type'] == 'project'), None)
    assert project is not None
    assert group_id in project['childes_order']


def test_link_items_invalid_source(auth_client, clean_db):
    """Тест связывания с несуществующим источником"""
    # Создаем группу
    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    assert response.status_code == 200
    group_id = json.loads(response.data)['new_object']['id']

    # Пытаемся связать несуществующий источник с группой
    link_data = {
        'source_id': str(uuid.uuid4()),
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group'
    }
    
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['error'] == 'Source or target entity not found'


def test_link_items_invalid_target(auth_client, clean_db):
    """Тест связывания с неверной целью"""
    # Создаем список
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']

    # Пытаемся связать список с неверной целью
    link_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': str(uuid.uuid4()),
        'target_type': 'group'
    }
    
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['error'] == 'Source or target entity not found'


def test_link_items_unauthorized(client):
    """Тест связывания без аутентификации"""
    # Пытаемся связать список и группу без токена
    link_data = {
        'source_id': str(uuid.uuid4()),
        'source_type': 'list',
        'target_id': str(uuid.uuid4()),
        'target_type': 'group'
    }
    
    response = client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401


def test_link_items_invalid_types(auth_client, clean_db):
    """Тест связывания некорректных типов (группа с группой)"""
    # Создаем две группы
    group1_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    group2_data = {'type': 'group', 'title': 'Group 2', 'order': 0}
    
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group1_data), content_type='application/json')
    assert response.status_code == 200
    group1_id = json.loads(response.data)['new_object']['id']
    
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group2_data), content_type='application/json')
    assert response.status_code == 200
    group2_id = json.loads(response.data)['new_object']['id']
    
    # Пытаемся связать группу с группой через link_items
    link_data = {
        'source_id': group1_id,
        'source_type': 'group',
        'target_id': group2_id,
        'target_type': 'group'
    }
    
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    
    # Ожидаем ошибку, так как связывание группы с группой не поддерживается
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['error'] == 'Invalid link combination'


def test_link_items_incomplete_data(auth_client, clean_db):
    """Тест отправки неполных данных в запросе через link_items"""
    # Создаем список и группу
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']
    
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    assert response.status_code == 200
    group_id = json.loads(response.data)['new_object']['id']
    
    # Пытаемся связать без указания source_type
    link_data = {
        'source_id': list_id,
        'target_id': group_id,
        'target_type': 'group'
    }
    
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    
    # Ожидаем ошибку 400 из-за неполных данных
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['error'] == 'source_type, source_id, target_type and target_id are required'


def test_link_items_access_control(auth_client, auth_client2, clean_db):
    """Тест проверки прав доступа (пользователь А не может изменять объекты пользователя Б)"""
    # Создаем список от имени первого пользователя
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']
    
    # Создаем группу от имени второго пользователя
    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    response = auth_client2.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    assert response.status_code == 200
    group_id = json.loads(response.data)['new_object']['id']
    
    # Пытаемся связать список первого пользователя с группой второго пользователя
    link_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group'
    }
    
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    
    # Ожидаем ошибку 404, так как один из объектов не найден для текущего пользователя
    assert response.status_code == 404
    data = json.loads(response.data)
    # Может быть ошибка как для source, так и для target
    assert data['error'] in ['Source or target entity not found']