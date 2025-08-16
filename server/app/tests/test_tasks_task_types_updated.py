import pytest
import json
from conftest import is_valid_uuid


def test_get_task_types_empty(auth_client, test_user):
    """Тест получения пустого списка типов задач"""
    response = auth_client.get('/api/tasks/task_types')
    
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert isinstance(data, dict)
    assert len(data) == 0


def test_add_task_type_success(auth_client, test_user):
    """Тест успешного добавления типа задачи"""
    type_data = {
        'name': 'Работа',
        'color': '#FF5722',
        'description': 'Рабочие задачи'
    }
    
    response = auth_client.post('/api/tasks/task_types',
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    
    data = json.loads(response.data)
    assert data['name'] == 'Работа'
    assert data['color'] == '#FF5722'
    assert data['description'] == 'Рабочие задачи'
    assert data['user_id'] == test_user.id
    assert data['is_active'] is True
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['id'])


def test_add_task_type_with_group(auth_client, test_user):
    """Тест добавления типа задачи с группой"""
    # Сначала создаем группу
    group_data = {
        'name': 'Личные дела',
        'color': '#4CAF50'
    }
    
    group_response = auth_client.post('/api/tasks/task_type_groups',
                                     data=json.dumps(group_data),
                                     content_type='application/json')
    
    assert group_response.status_code == 201
    group = json.loads(group_response.data)
    
    # Теперь создаем тип задачи в этой группе
    type_data = {
        'name': 'Покупки',
        'color': '#2196F3',
        'group_id': group['id']
    }
    
    response = auth_client.post('/api/tasks/task_types',
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    
    data = json.loads(response.data)
    assert data['name'] == 'Покупки'
    assert data['group_id'] == group['id']
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['id'])
    assert is_valid_uuid(data['group_id'])


def test_add_task_type_missing_name(auth_client, test_user):
    """Тест добавления типа задачи без имени"""
    type_data = {
        'color': '#FF5722'
    }
    
    response = auth_client.post('/api/tasks/task_types',
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 400
    
    data = json.loads(response.data)
    assert 'error' in data
    assert 'name required' in data['error'].lower()


def test_edit_task_type_success(auth_client, test_user):
    """Тест успешного редактирования типа задачи"""
    # Сначала создаем тип задачи
    type_data = {
        'name': 'Исходный тип',
        'color': '#FF5722'
    }
    
    response = auth_client.post('/api/tasks/task_types',
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    
    # Теперь редактируем тип задачи
    updated_data = {
        'name': 'Обновленный тип',
        'color': '#4CAF50',
        'description': 'Новое описание'
    }
    
    response = auth_client.put(f'/api/tasks/task_types/{task_type["id"]}',
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['id'] == task_type['id']
    assert data['name'] == 'Обновленный тип'
    assert data['color'] == '#4CAF50'
    assert data['description'] == 'Новое описание'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['id'])


def test_edit_task_type_not_found(auth_client, test_user):
    """Тест редактирования несуществующего типа задачи"""
    updated_data = {
        'name': 'Несуществующий тип'
    }
    
    fake_uuid = '12345678-1234-1234-1234-123456789012'
    response = auth_client.put(f'/api/tasks/task_types/{fake_uuid}',
                              data=json.dumps(updated_data),
                              content_type='application/json')
    
    assert response.status_code == 404
    
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not found' in data['error'].lower()


def test_delete_task_type_success(auth_client, test_user):
    """Тест успешного удаления типа задачи"""
    # Сначала создаем тип задачи
    type_data = {
        'name': 'Тип для удаления',
        'color': '#FF5722'
    }
    
    response = auth_client.post('/api/tasks/task_types',
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    
    # Теперь удаляем тип задачи
    response = auth_client.delete(f'/api/tasks/task_types/{task_type["id"]}')
    
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['result'] == 'deleted'


def test_delete_task_type_not_found(auth_client, test_user):
    """Тест удаления несуществующего типа задачи"""
    fake_uuid = '12345678-1234-1234-1234-123456789012'
    response = auth_client.delete(f'/api/tasks/task_types/{fake_uuid}')
    
    assert response.status_code == 404
    
    data = json.loads(response.data)
    assert 'error' in data
    assert 'not found' in data['error'].lower()


def test_get_task_types_after_creation(auth_client, test_user):
    """Тест получения типов задач после создания"""
    # Создаем несколько типов задач
    types_data = [
        {'name': 'Работа', 'color': '#FF5722'},
        {'name': 'Личное', 'color': '#4CAF50'},
        {'name': 'Учеба', 'color': '#2196F3'}
    ]
    
    created_ids = []
    for type_data in types_data:
        response = auth_client.post('/api/tasks/task_types',
                                   data=json.dumps(type_data),
                                   content_type='application/json')
        assert response.status_code == 201
        created_ids.append(json.loads(response.data)['id'])
    
    # Получаем все типы задач
    response = auth_client.get('/api/tasks/task_types')
    
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert isinstance(data, dict)
    assert len(data) == 3
    
    # Проверяем, что все созданные типы присутствуют
    for created_id in created_ids:
        assert created_id in data
        assert is_valid_uuid(created_id)
        assert data[created_id]['user_id'] == test_user.id


def test_task_type_groups_crud(auth_client, test_user):
    """Тест CRUD операций для групп типов задач"""
    # Создание группы
    group_data = {
        'name': 'Тестовая группа',
        'color': '#9C27B0',
        'description': 'Описание группы'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups',
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    
    group = json.loads(response.data)
    assert group['name'] == 'Тестовая группа'
    assert group['color'] == '#9C27B0'
    assert group['user_id'] == test_user.id
    assert is_valid_uuid(group['id'])
    
    group_id = group['id']
    
    # Редактирование группы
    updated_group_data = {
        'name': 'Обновленная группа',
        'color': '#E91E63'
    }
    
    response = auth_client.put(f'/api/tasks/task_type_groups/{group_id}',
                              data=json.dumps(updated_group_data),
                              content_type='application/json')
    
    assert response.status_code == 200
    
    updated_group = json.loads(response.data)
    assert updated_group['id'] == group_id
    assert updated_group['name'] == 'Обновленная группа'
    assert updated_group['color'] == '#E91E63'
    
    # Получение групп
    response = auth_client.get('/api/tasks/task_type_groups')
    
    assert response.status_code == 200
    
    groups = json.loads(response.data)
    assert isinstance(groups, dict)
    assert group_id in groups
    assert groups[group_id]['name'] == 'Обновленная группа'
    
    # Удаление группы
    response = auth_client.delete(f'/api/tasks/task_type_groups/{group_id}')
    
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['result'] == 'deleted'


def test_fields_config_with_task_types(auth_client, test_user):
    """Тест получения конфигурации полей с типами задач"""
    # Создаем группу и тип задачи
    group_data = {
        'name': 'Рабочие задачи',
        'color': '#FF5722'
    }
    
    group_response = auth_client.post('/api/tasks/task_type_groups',
                                     data=json.dumps(group_data),
                                     content_type='application/json')
    
    assert group_response.status_code == 201
    group = json.loads(group_response.data)
    
    type_data = {
        'name': 'Встреча',
        'color': '#2196F3',
        'group_id': group['id'],
        'description': 'Рабочие встречи'
    }
    
    type_response = auth_client.post('/api/tasks/task_types',
                                    data=json.dumps(type_data),
                                    content_type='application/json')
    
    assert type_response.status_code == 201
    task_type = json.loads(type_response.data)
    
    # Получаем конфигурацию полей
    response = auth_client.get('/api/tasks/fields_config')
    
    assert response.status_code == 200
    
    config = json.loads(response.data)
    assert 'type_id' in config
    assert 'options' in config['type_id']
    
    # Проверяем, что наш тип задачи присутствует в опциях
    type_options = config['type_id']['options']
    assert len(type_options) == 1
    
    option = type_options[0]
    assert option['value'] == task_type['id']
    assert option['label'] == 'Встреча'
    assert option['color'] == '#2196F3'
    assert option['group_id'] == group['id']
    assert option['groupLabel'] == 'Рабочие задачи'
    assert is_valid_uuid(option['value'])
    assert is_valid_uuid(option['group_id'])


def test_task_type_unauthorized_access(client):
    """Тест доступа к типам задач без авторизации"""
    # GET
    response = client.get('/api/tasks/task_types')
    assert response.status_code == 401
    
    # POST
    response = client.post('/api/tasks/task_types',
                          data=json.dumps({'name': 'Test'}),
                          content_type='application/json')
    assert response.status_code == 401
    
    # PUT
    response = client.put('/api/tasks/task_types/some-id',
                         data=json.dumps({'name': 'Test'}),
                         content_type='application/json')
    assert response.status_code == 401
    
    # DELETE
    response = client.delete('/api/tasks/task_types/some-id')
    assert response.status_code == 401