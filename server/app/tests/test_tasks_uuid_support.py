import pytest
import json
from conftest import is_valid_uuid


def test_add_task_to_custom_list(auth_client, test_user, test_list):
    """Тест добавления задачи в пользовательский список с UUID"""
    # Подготавливаем данные для запроса
    task_data = {
        'title': 'Задача в пользовательском списке',
        'listId': test_list.id
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == 'Задача в пользовательском списке'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])
    # Проверяем, что задача связана со списком
    assert data['task']['lists_ids'] == [test_list.id]


def test_get_tasks_from_custom_list(auth_client, test_user, test_list, test_task):
    """Тест получения задач из пользовательского списка с UUID"""
    # Связываем задачу со списком
    from app import db
    test_list = db.session.merge(test_list)
    test_task = db.session.merge(test_task)
    test_list.tasks.append(test_task)
    test_list.childes_order = [test_task.id]
    db.session.add(test_list)
    db.session.commit()
    
    # Отправляем GET запрос
    response = auth_client.get(f'/api/tasks/get_tasks?list_id={test_list.id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'tasks' in data
    assert len(data['tasks']) == 1
    assert data['tasks'][0]['id'] == test_task.id
    assert data['tasks'][0]['title'] == test_task.title
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['tasks'][0]['id'])


def test_get_tasks_by_uuid_ids(auth_client, test_user, test_task):
    """Тест получения задач по UUID идентификаторам"""
    # Отправляем GET запрос с UUID
    response = auth_client.get(f'/api/tasks/get_tasks_by_ids?ids={test_task.id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'tasks' in data
    assert len(data['tasks']) == 1
    assert data['tasks'][0]['id'] == test_task.id
    assert data['tasks'][0]['title'] == test_task.title
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['tasks'][0]['id'])


def test_edit_task_with_uuid(auth_client, test_user, test_task):
    """Тест редактирования задачи с UUID"""
    # Подготавливаем данные для запроса
    edit_data = {
        'taskId': test_task.id,
        'title': 'Обновленная задача',
        'note': 'Новая заметка'
    }
    
    # Отправляем PUT запрос
    response = auth_client.put('/api/tasks/edit_task', 
                              data=json.dumps(edit_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['id'] == test_task.id
    assert data['task']['title'] == 'Обновленная задача'
    assert data['task']['note'] == 'Новая заметка'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])


def test_change_task_status_with_uuid(auth_client, test_user, test_task):
    """Тест изменения статуса задачи с UUID"""
    # Подготавливаем данные для запроса
    status_data = {
        'taskId': test_task.id,
        'is_completed': True
    }
    
    # Отправляем PUT запрос
    response = auth_client.put('/api/tasks/change_status', 
                              data=json.dumps(status_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'changed_ids' in data
    assert test_task.id in data['changed_ids']
    # Проверяем, что все ID являются валидными UUID
    for task_id in data['changed_ids']:
        assert is_valid_uuid(task_id)


def test_delete_task_with_uuid(auth_client, test_user, test_task):
    """Тест удаления задачи с UUID"""
    task_id = test_task.id
    
    # Подготавливаем данные для запроса
    delete_data = {
        'taskId': task_id
    }
    
    # Отправляем DELETE запрос
    response = auth_client.delete('/api/tasks/del_task', 
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'message' in data


def test_add_subtask_with_uuid(auth_client, test_user, test_task):
    """Тест добавления подзадачи с UUID"""
    # Подготавливаем данные для запроса
    subtask_data = {
        'title': 'Подзадача',
        'parentTaskId': test_task.id
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_subtask', 
                               data=json.dumps(subtask_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'subtask' in data
    assert 'parent_task' in data
    assert data['subtask']['title'] == 'Подзадача'
    assert data['parent_task']['id'] == test_task.id
    # Проверяем, что ID являются валидными UUID
    assert is_valid_uuid(data['subtask']['id'])
    assert is_valid_uuid(data['parent_task']['id'])


def test_get_subtasks_with_uuid(auth_client, test_user, test_task):
    """Тест получения подзадач с UUID"""
    # Сначала добавляем подзадачу
    subtask_data = {
        'title': 'Подзадача для получения',
        'parentTaskId': test_task.id
    }
    
    auth_client.post('/api/tasks/add_subtask', 
                    data=json.dumps(subtask_data),
                    content_type='application/json')
    
    # Отправляем GET запрос для получения подзадач
    response = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={test_task.id}')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'subtasks' in data
    assert len(data['subtasks']) == 1
    assert data['subtasks'][0]['title'] == 'Подзадача для получения'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['subtasks'][0]['id'])


def test_edit_list_with_uuid(auth_client, test_user, test_list):
    """Тест редактирования списка с UUID"""
    # Подготавливаем данные для запроса
    edit_data = {
        'listId': test_list.id,
        'type': 'list',
        'title': 'Обновленный список'
    }
    
    # Отправляем PUT запрос
    response = auth_client.put('/api/tasks/edit_list', 
                              data=json.dumps(edit_data),
                              content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'updated_list' in data
    assert data['updated_list']['id'] == test_list.id
    assert data['updated_list']['title'] == 'Обновленный список'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['updated_list']['id'])


def test_get_lists_returns_uuid_ids(auth_client, test_user, test_list, test_group):
    """Тест получения списков возвращает UUID идентификаторы"""
    # Отправляем GET запрос
    response = auth_client.get('/api/tasks/get_lists')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'lists' in data
    
    # Проверяем, что все ID являются валидными UUID
    for item in data['lists']:
        assert is_valid_uuid(item['id'])
        assert is_valid_uuid(item['realId'])
        
        # Если есть дочерние элементы, проверяем их ID тоже
        if 'childes_order' in item and item['childes_order']:
            for child_id in item['childes_order']:
                if child_id:  # Проверяем только непустые ID
                    assert is_valid_uuid(child_id)


def test_invalid_uuid_handling(auth_client, test_user):
    """Тест обработки невалидных UUID"""
    # Пытаемся получить задачи с невалидным UUID
    response = auth_client.get('/api/tasks/get_tasks?list_id=invalid-uuid')
    
    # Проверяем, что сервер корректно обрабатывает невалидный UUID
    # Может вернуть 400 или 404 в зависимости от реализации
    assert response.status_code in [400, 404]
    
    data = json.loads(response.data)
    assert 'error' in data