import pytest
import json
from conftest import is_valid_uuid


def test_basic_uuid_operations(auth_client, test_user):
    """Минимальный тест основных операций с UUID"""
    
    # 1. Создание списка
    list_data = {
        'type': 'list',
        'title': 'Тестовый список',
        'order': 0
    }
    
    response = auth_client.post('/api/tasks/add_list',
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert is_valid_uuid(data['new_object']['id'])
    
    list_id = data['new_object']['id']
    
    # 2. Создание задачи в списке
    task_data = {
        'title': 'Тестовая задача',
        'listId': list_id
    }
    
    response = auth_client.post('/api/tasks/add_task',
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert is_valid_uuid(data['task']['id'])
    
    task_id = data['task']['id']
    
    # 3. Получение задач из списка
    response = auth_client.get(f'/api/tasks/get_tasks?list_id={list_id}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'tasks' in data
    assert len(data['tasks']) == 1
    assert data['tasks'][0]['id'] == task_id
    assert is_valid_uuid(data['tasks'][0]['id'])
    
    # 4. Редактирование задачи
    edit_data = {
        'taskId': task_id,
        'title': 'Обновленная задача'
    }
    
    response = auth_client.put('/api/tasks/edit_task',
                              data=json.dumps(edit_data),
                              content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['task']['title'] == 'Обновленная задача'
    assert is_valid_uuid(data['task']['id'])
    
    # 5. Изменение статуса задачи
    status_data = {
        'taskId': task_id,
        'is_completed': True
    }
    
    response = auth_client.put('/api/tasks/change_status',
                              data=json.dumps(status_data),
                              content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert task_id in data['changed_ids']
    
    for changed_id in data['changed_ids']:
        assert is_valid_uuid(changed_id)


def test_task_types_uuid(auth_client, test_user):
    """Тест типов задач с UUID"""
    
    # 1. Создание группы типов
    group_data = {
        'name': 'Рабочие задачи',
        'color': '#FF5722'
    }
    
    response = auth_client.post('/api/tasks/task_type_groups',
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    group = json.loads(response.data)
    assert is_valid_uuid(group['id'])
    
    # 2. Создание типа задачи
    type_data = {
        'name': 'Встреча',
        'color': '#2196F3',
        'group_id': group['id']
    }
    
    response = auth_client.post('/api/tasks/task_types',
                               data=json.dumps(type_data),
                               content_type='application/json')
    
    assert response.status_code == 201
    task_type = json.loads(response.data)
    assert is_valid_uuid(task_type['id'])
    assert task_type['group_id'] == group['id']
    
    # 3. Получение конфигурации полей
    response = auth_client.get('/api/tasks/fields_config')
    
    assert response.status_code == 200
    config = json.loads(response.data)
    assert 'type_id' in config
    
    type_options = config['type_id']['options']
    assert len(type_options) == 1
    assert type_options[0]['value'] == task_type['id']
    assert is_valid_uuid(type_options[0]['value'])


def test_subtasks_uuid(auth_client, test_user):
    """Тест подзадач с UUID"""
    
    # 1. Создание родительской задачи
    task_data = {
        'title': 'Родительская задача',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task',
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    parent_task = json.loads(response.data)['task']
    assert is_valid_uuid(parent_task['id'])
    
    # 2. Создание подзадачи
    subtask_data = {
        'title': 'Подзадача',
        'parentTaskId': parent_task['id']
    }
    
    response = auth_client.post('/api/tasks/add_subtask',
                               data=json.dumps(subtask_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert is_valid_uuid(data['subtask']['id'])
    assert is_valid_uuid(data['parent_task']['id'])
    
    # 3. Получение подзадач
    response = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={parent_task["id"]}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'subtasks' in data
    assert len(data['subtasks']) == 1
    assert is_valid_uuid(data['subtasks'][0]['id'])


def test_error_handling_uuid(auth_client, test_user):
    """Тест обработки ошибок с UUID"""
    
    # 1. Несуществующий UUID
    fake_uuid = '12345678-1234-1234-1234-123456789012'
    
    response = auth_client.put('/api/tasks/edit_task',
                              data=json.dumps({
                                  'taskId': fake_uuid,
                                  'title': 'Тест'
                              }),
                              content_type='application/json')
    
    assert response.status_code == 404
    
    # 2. Невалидный UUID
    response = auth_client.get('/api/tasks/get_tasks?list_id=invalid-uuid')
    assert response.status_code == 400  # Ожидаем 400 Bad Request для невалидного UUID
    
    # 3. Получение задач по несуществующему UUID
    response = auth_client.get(f'/api/tasks/get_tasks_by_ids?ids={fake_uuid}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['tasks']) == 0  # Пустой список для несуществующих ID