import pytest
import json
import uuid

def test_move_list_to_group_success(auth_client, clean_db):
    """Тест успешного перемещения списка в группу"""
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

    # Сначала связываем список с какой-либо группой (например, через link_items), а потом перемещаем
    # Но в этом тесте мы просто хотим переместить новый список в группу, поэтому source_parent_id будет None
    # Но по новой логике это должно быть запрещено, поэтому тест нужно изменить
    # Сделаем так, чтобы сначала список был в общем списке, а потом перемещаем в группу
    # Для этого сначала добавим его в общий список
    add_to_general_data = {'item_id': list_id, 'in_general_list': True}
    auth_client.put('/api/tasks/add_to_general_list', data=json.dumps(add_to_general_data), content_type='application/json')
    
    # Проверим, что список в общем списке
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    list_item = next((item for item in data['lists'] if item['id'] == list_id and item['type'] == 'list'), None)
    assert list_item is not None
    assert list_item['in_general_list'] is True
    
    # Перемещаем список из общего списка в группу
    move_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group',
        'source_parent_id': 'generalList',
        'source_parent_type': None
    }
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_data), content_type='application/json')
    assert response.status_code == 200
    assert json.loads(response.data)['success'] is True

    # Проверяем, что список находится в группе
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    group = next((item for item in data['lists'] if item['id'] == group_id and item['type'] == 'group'), None)
    assert group is not None
    assert list_id in group['childes_order']
    list_item = next((item for item in data['lists'] if item['id'] == list_id and item['type'] == 'list'), None)
    assert list_item is not None
    assert list_item['in_general_list'] is False


def test_move_list_from_group_to_project(auth_client, clean_db):
    """Тест перемещения списка из группы в проект"""
    # Создаем список, группу и проект
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    project_data = {'type': 'project', 'title': 'Project 1', 'order': 0}

    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    list_id = json.loads(response.data)['new_object']['id']
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    group_id = json.loads(response.data)['new_object']['id']
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(project_data), content_type='application/json')
    project_id = json.loads(response.data)['new_object']['id']

    # Сначала добавим список в общий список
    add_to_general_data = {'item_id': list_id, 'in_general_list': True}
    auth_client.put('/api/tasks/add_to_general_list', data=json.dumps(add_to_general_data), content_type='application/json')
    
    # Перемещаем список из общего списка в группу
    move_to_group_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group',
        'source_parent_id': 'generalList',
        'source_parent_type': None
    }
    auth_client.put('/api/tasks/move_items', data=json.dumps(move_to_group_data), content_type='application/json')

    # Перемещаем список из группы в проект
    move_to_project_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': project_id,
        'target_type': 'project',
        'source_parent_id': group_id,
        'source_parent_type': 'group'
    }
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_to_project_data), content_type='application/json')
    assert response.status_code == 200

    # Проверяем, что у списка изменился project_id и он находится в проекте
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    project = next((p for p in data['projects'] if p['id'] == project_id), None)
    assert project is not None
    assert list_id in project['childes_order']
    
    # Проверяем, что список больше не в группе
    group = next((item for item in data['lists'] if item['id'] == group_id and item['type'] == 'group'), None)
    assert group is not None
    assert list_id not in group['childes_order']
    
    list_item = next((item for item in data['lists'] if item['id'] == list_id and item['type'] == 'list'), None)
    assert list_item is not None
    assert list_item['in_general_list'] is False


def test_move_list_to_general_list(auth_client, clean_db):
    """Тест перемещения списка в общий список"""
    # Создаем список и группу
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']

    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    assert response.status_code == 200
    group_id = json.loads(response.data)['new_object']['id']

    # Сначала добавим список в общий список
    add_to_general_data = {'item_id': list_id, 'in_general_list': True}
    auth_client.put('/api/tasks/add_to_general_list', data=json.dumps(add_to_general_data), content_type='application/json')
    
    # Перемещаем список из общего списка в группу
    move_to_group_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group',
        'source_parent_id': 'generalList',
        'source_parent_type': None
    }
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_to_group_data), content_type='application/json')
    assert response.status_code == 200

    # Проверяем, что список не в общем списке
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    list_item = next((item for item in data['lists'] if item['id'] == list_id and item['type'] == 'list'), None)
    assert list_item is not None
    assert list_item['in_general_list'] is False

    # Перемещаем список из группы в общий список
    move_to_general_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': 'generalList',
        'target_type': None,
        'source_parent_id': group_id,
        'source_parent_type': 'group'
    }
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_to_general_data), content_type='application/json')
    assert response.status_code == 200

    # Проверяем, что список в общем списке
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    list_item = next((item for item in data['lists'] if item['id'] == list_id and item['type'] == 'list'), None)
    assert list_item is not None
    assert list_item['in_general_list'] is True


def test_move_items_invalid_source(auth_client, clean_db):
    """Тест перемещения несуществующего источника"""
    # Создаем группу
    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    assert response.status_code == 200
    group_id = json.loads(response.data)['new_object']['id']

    # Пытаемся переместить несуществующий источник в группу
    # Сначала создадим список и добавим его в общий список, чтобы у нас был корректный source_parent
    list_data = {'type': 'list', 'title': 'List to move', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']
    
    add_to_general_data = {'item_id': list_id, 'in_general_list': True}
    auth_client.put('/api/tasks/add_to_general_list', data=json.dumps(add_to_general_data), content_type='application/json')
    
    move_data = {
        'source_id': str(uuid.uuid4()),  # Несуществующий ID
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group',
        'source_parent_id': 'generalList',
        'source_parent_type': None
    }
    
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_data), content_type='application/json')
    
    # Проверяем, что мы получаем ошибку 404, так как source_id не существует
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['error'] == 'Source entity not found'


def test_move_items_invalid_target(auth_client, clean_db):
    """Тест перемещения в неверную цель"""
    # Создаем список
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']

    # Пытаемся переместить список в неверную цель
    move_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': str(uuid.uuid4()),
        'target_type': 'group',
        'source_parent_id': 'generalList',
        'source_parent_type': None
    }
    
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_data), content_type='application/json')
    
    # Проверяем, что мы получаем ошибку 404, так как target_id не существует
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['error'] == 'Target entity not found'


def test_move_items_unauthorized(client):
    """Тест перемещения без аутентификации"""
    # Пытаемся переместить список и группу без токена
    move_data = {
        'source_id': str(uuid.uuid4()),
        'source_type': 'list',
        'target_id': str(uuid.uuid4()),
        'target_type': 'group',
        'source_parent_id': 'generalList',
        'source_parent_type': None
    }
    
    response = client.put('/api/tasks/move_items', data=json.dumps(move_data), content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401


def test_move_items_incomplete_data(auth_client, clean_db):
    """Тест отправки неполных данных в запросе через move_items"""
    # Создаем список и группу
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    group_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    assert response.status_code == 200
    list_id = json.loads(response.data)['new_object']['id']
    
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group_data), content_type='application/json')
    assert response.status_code == 200
    group_id = json.loads(response.data)['new_object']['id']
    
    # Пытаемся переместить без указания source_type
    # Сначала добавим список в общий список
    add_to_general_data = {'item_id': list_id, 'in_general_list': True}
    auth_client.put('/api/tasks/add_to_general_list', data=json.dumps(add_to_general_data), content_type='application/json')
    
    move_data = {
        'source_id': list_id,
        'target_id': group_id,
        'target_type': 'group',
        'source_parent_id': 'generalList',
        'source_parent_type': None
    }
    
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_data), content_type='application/json')
    
    # Ожидаем ошибку 400 из-за неполных данных
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['error'] == 'source_type and source_id are required'


def test_move_items_access_control(auth_client, auth_client2, clean_db):
    """Тест проверки прав доступа при перемещении (пользователь А не может изменять объекты пользователя Б)"""
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
    
    # Пытаемся переместить список первого пользователя в группу второго пользователя
    # Сначала добавим список в общий список
    add_to_general_data = {'item_id': list_id, 'in_general_list': True}
    auth_client.put('/api/tasks/add_to_general_list', data=json.dumps(add_to_general_data), content_type='application/json')
    
    move_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': group_id,
        'target_type': 'group',
        'source_parent_id': 'generalList',
        'source_parent_type': None
    }
    
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_data), content_type='application/json')
    
    # Ожидаем ошибку 404, так как один из объектов не найден для текущего пользователя
    assert response.status_code == 404
    data = json.loads(response.data)
    # Может быть ошибка как для source, так и для target
    assert data['error'] in ['Source entity not found', 'Target entity not found']


def test_move_list_from_one_group_to_another_with_source_parent(auth_client, clean_db):
    """Тест перемещения списка из одной группы в другую с указанием source_parent"""
    # Создаем список и две группы
    list_data = {'type': 'list', 'title': 'List 1', 'order': 0}
    group1_data = {'type': 'group', 'title': 'Group 1', 'order': 0}
    group2_data = {'type': 'group', 'title': 'Group 2', 'order': 0}
    
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(list_data), content_type='application/json')
    list_id = json.loads(response.data)['new_object']['id']
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group1_data), content_type='application/json')
    group1_id = json.loads(response.data)['new_object']['id']
    response = auth_client.post('/api/tasks/add_list', data=json.dumps(group2_data), content_type='application/json')
    group2_id = json.loads(response.data)['new_object']['id']
    
    # Связываем список с первой группой через link_items
    link_data = {
        'source_type': 'list',
        'source_id': list_id,
        'target_type': 'group',
        'target_id': group1_id,
    }
    response = auth_client.put('/api/tasks/link_items', data=json.dumps(link_data), content_type='application/json')
    assert response.status_code == 200
    
    # Проверяем, что список находится в первой группе
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    group1 = next((item for item in data['lists'] if item['id'] == group1_id and item['type'] == 'group'), None)
    assert group1 is not None
    assert list_id in group1['childes_order']
    
    # Перемещаем список из первой группы во вторую, указывая source_parent
    move_data = {
        'source_id': list_id,
        'source_type': 'list',
        'target_id': group2_id,
        'target_type': 'group',
        'source_parent_id': group1_id,
        'source_parent_type': 'group',
    }
    response = auth_client.put('/api/tasks/move_items', data=json.dumps(move_data), content_type='application/json')
    assert response.status_code == 200
    assert json.loads(response.data)['success'] is True
    
    # Проверяем, что список находится во второй группе и больше не в первой
    response = auth_client.get('/api/tasks/get_lists')
    assert response.status_code == 200
    data = json.loads(response.data)
    group1 = next((item for item in data['lists'] if item['id'] == group1_id and item['type'] == 'group'), None)
    group2 = next((item for item in data['lists'] if item['id'] == group2_id and item['type'] == 'group'), None)
    assert group1 is not None
    assert group2 is not None
    assert list_id not in group1['childes_order']
    assert list_id in group2['childes_order']