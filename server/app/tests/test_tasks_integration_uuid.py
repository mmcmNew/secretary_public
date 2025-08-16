import pytest
import json
from datetime import datetime, timedelta
from conftest import is_valid_uuid


def test_full_workflow_with_uuid(auth_client, test_user, clean_db):
    """Интеграционный тест полного рабочего процесса с UUID"""
    
    # 1. Создаем группу типов задач
    group_data = {
        'name': 'Проектные задачи',
        'color': '#FF5722',
        'description': 'Группа для проектных задач'
    }
    
    group_response = auth_client.post('/api/tasks/task_type_groups',
                                     data=json.dumps(group_data),
                                     content_type='application/json')
    
    assert group_response.status_code == 201
    group = json.loads(group_response.data)
    assert is_valid_uuid(group['id'])
    
    # 2. Создаем тип задачи в группе
    type_data = {
        'name': 'Разработка',
        'color': '#2196F3',
        'group_id': group['id'],
        'description': 'Задачи по разработке'
    }
    
    type_response = auth_client.post('/api/tasks/task_types',
                                    data=json.dumps(type_data),
                                    content_type='application/json')
    
    assert type_response.status_code == 201
    task_type = json.loads(type_response.data)
    assert is_valid_uuid(task_type['id'])
    
    # 3. Создаем проект
    project_data = {
        'type': 'project',
        'title': 'Веб-приложение',
        'order': 0
    }
    
    project_response = auth_client.post('/api/tasks/add_list',
                                       data=json.dumps(project_data),
                                       content_type='application/json')
    
    assert project_response.status_code == 200
    project = json.loads(project_response.data)['new_object']
    assert is_valid_uuid(project['id'])
    
    # 4. Создаем группу в проекте
    group_data = {
        'type': 'group',
        'title': 'Backend',
        'order': 0
    }
    
    group_response = auth_client.post('/api/tasks/add_list',
                                     data=json.dumps(group_data),
                                     content_type='application/json')
    
    assert group_response.status_code == 200
    backend_group = json.loads(group_response.data)['new_object']
    assert is_valid_uuid(backend_group['id'])
    
    # 5. Создаем список в группе
    list_data = {
        'type': 'list',
        'title': 'API разработка',
        'order': 0
    }
    
    list_response = auth_client.post('/api/tasks/add_list',
                                    data=json.dumps(list_data),
                                    content_type='application/json')
    
    assert list_response.status_code == 200
    api_list = json.loads(list_response.data)['new_object']
    assert is_valid_uuid(api_list['id'])
    
    # 6. Связываем группу со списком
    link_data = {
        'source_id': api_list['id'],
        'source_type': 'list',
        'target_id': backend_group['id'],
        'target_type': 'group'
    }
    
    link_response = auth_client.put('/api/tasks/link_group_list',
                                   data=json.dumps(link_data),
                                   content_type='application/json')
    
    assert link_response.status_code == 200
    
    # 7. Создаем задачу в списке
    due_date = (datetime.utcnow() + timedelta(days=7)).isoformat() + 'Z'
    task_data = {
        'title': 'Создать REST API',
        'listId': api_list['id'],
        'end': due_date,
        'type_id': task_type['id'],
        'note': 'Создать API для управления задачами',
        'is_important': True
    }
    
    task_response = auth_client.post('/api/tasks/add_task',
                                    data=json.dumps(task_data),
                                    content_type='application/json')
    
    assert task_response.status_code == 200
    task = json.loads(task_response.data)['task']
    assert is_valid_uuid(task['id'])
    assert task['type_id'] == task_type['id']
    assert task['is_important'] is True
    
    # 8. Создаем подзадачу
    subtask_data = {
        'title': 'Создать модели данных',
        'parentTaskId': task['id']
    }
    
    subtask_response = auth_client.post('/api/tasks/add_subtask',
                                       data=json.dumps(subtask_data),
                                       content_type='application/json')
    
    assert subtask_response.status_code == 200
    subtask = json.loads(subtask_response.data)['subtask']
    assert is_valid_uuid(subtask['id'])
    
    # 9. Получаем задачи из списка
    tasks_response = auth_client.get(f'/api/tasks/get_tasks?list_id={api_list["id"]}')
    
    assert tasks_response.status_code == 200
    tasks_data = json.loads(tasks_response.data)
    assert 'tasks' in tasks_data
    assert len(tasks_data['tasks']) == 1
    assert tasks_data['tasks'][0]['id'] == task['id']
    assert is_valid_uuid(tasks_data['tasks'][0]['id'])
    
    # 10. Получаем подзадачи
    subtasks_response = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={task["id"]}')
    
    assert subtasks_response.status_code == 200
    subtasks_data = json.loads(subtasks_response.data)
    assert 'subtasks' in subtasks_data
    assert len(subtasks_data['subtasks']) == 1
    assert subtasks_data['subtasks'][0]['id'] == subtask['id']
    assert is_valid_uuid(subtasks_data['subtasks'][0]['id'])
    
    # 11. Редактируем задачу
    edit_data = {
        'taskId': task['id'],
        'title': 'Создать REST API v2',
        'note': 'Обновленное описание API'
    }
    
    edit_response = auth_client.put('/api/tasks/edit_task',
                                   data=json.dumps(edit_data),
                                   content_type='application/json')
    
    assert edit_response.status_code == 200
    edited_task = json.loads(edit_response.data)['task']
    assert edited_task['id'] == task['id']
    assert edited_task['title'] == 'Создать REST API v2'
    assert is_valid_uuid(edited_task['id'])
    
    # 12. Завершаем подзадачу
    complete_subtask_data = {
        'taskId': subtask['id'],
        'is_completed': True
    }
    
    complete_response = auth_client.put('/api/tasks/change_status',
                                       data=json.dumps(complete_subtask_data),
                                       content_type='application/json')
    
    assert complete_response.status_code == 200
    complete_data = json.loads(complete_response.data)
    assert complete_data['success'] is True
    assert subtask['id'] in complete_data['changed_ids']
    
    # 13. Получаем списки и проверяем структуру
    lists_response = auth_client.get('/api/tasks/get_lists')
    
    assert lists_response.status_code == 200
    lists_data = json.loads(lists_response.data)
    
    # Проверяем, что все ID являются UUID
    for item in lists_data.get('lists', []):
        assert is_valid_uuid(item['id'])
        assert is_valid_uuid(item['realId'])
    
    for item in lists_data.get('projects', []):
        assert is_valid_uuid(item['id'])
        assert is_valid_uuid(item['realId'])
    
    # 14. Получаем задачи по ID
    tasks_by_ids_response = auth_client.get(f'/api/tasks/get_tasks_by_ids?ids={task["id"]},{subtask["id"]}')
    
    assert tasks_by_ids_response.status_code == 200
    tasks_by_ids_data = json.loads(tasks_by_ids_response.data)
    assert len(tasks_by_ids_data['tasks']) == 2
    
    for task_item in tasks_by_ids_data['tasks']:
        assert is_valid_uuid(task_item['id'])
    
    # 15. Получаем конфигурацию полей
    fields_response = auth_client.get('/api/tasks/fields_config')
    
    assert fields_response.status_code == 200
    fields_data = json.loads(fields_response.data)
    
    # Проверяем, что наш тип задачи присутствует
    type_options = fields_data['type_id']['options']
    assert len(type_options) == 1
    assert type_options[0]['value'] == task_type['id']
    assert is_valid_uuid(type_options[0]['value'])
    
    # 16. Удаляем подзадачу
    delete_subtask_data = {
        'taskId': subtask['id']
    }
    
    delete_response = auth_client.delete('/api/tasks/del_task',
                                        data=json.dumps(delete_subtask_data),
                                        content_type='application/json')
    
    assert delete_response.status_code == 200
    delete_data = json.loads(delete_response.data)
    assert delete_data['success'] is True


def test_uuid_consistency_across_operations(auth_client, test_user):
    """Тест консистентности UUID во всех операциях"""
    
    # Создаем список
    list_data = {
        'type': 'list',
        'title': 'Тестовый список',
        'order': 0
    }
    
    list_response = auth_client.post('/api/tasks/add_list',
                                    data=json.dumps(list_data),
                                    content_type='application/json')
    
    assert list_response.status_code == 200
    created_list = json.loads(list_response.data)['new_object']
    list_id = created_list['id']
    assert is_valid_uuid(list_id)
    
    # Создаем задачу в списке
    task_data = {
        'title': 'Тестовая задача',
        'listId': list_id
    }
    
    task_response = auth_client.post('/api/tasks/add_task',
                                    data=json.dumps(task_data),
                                    content_type='application/json')
    
    assert task_response.status_code == 200
    created_task = json.loads(task_response.data)['task']
    task_id = created_task['id']
    assert is_valid_uuid(task_id)
    
    # Проверяем, что ID остается тем же во всех операциях
    
    # 1. Получение задач из списка
    tasks_response = auth_client.get(f'/api/tasks/get_tasks?list_id={list_id}')
    tasks_data = json.loads(tasks_response.data)
    assert tasks_data['tasks'][0]['id'] == task_id
    
    # 2. Получение задач по ID
    by_id_response = auth_client.get(f'/api/tasks/get_tasks_by_ids?ids={task_id}')
    by_id_data = json.loads(by_id_response.data)
    assert by_id_data['tasks'][0]['id'] == task_id
    
    # 3. Редактирование задачи
    edit_data = {
        'taskId': task_id,
        'title': 'Обновленная задача'
    }
    
    edit_response = auth_client.put('/api/tasks/edit_task',
                                   data=json.dumps(edit_data),
                                   content_type='application/json')
    
    edited_task = json.loads(edit_response.data)['task']
    assert edited_task['id'] == task_id
    
    # 4. Изменение статуса
    status_data = {
        'taskId': task_id,
        'is_completed': True
    }
    
    status_response = auth_client.put('/api/tasks/change_status',
                                     data=json.dumps(status_data),
                                     content_type='application/json')
    
    status_result = json.loads(status_response.data)
    assert task_id in status_result['changed_ids']
    
    # 5. Получение списков (проверяем, что ID списка остался тем же)
    lists_response = auth_client.get('/api/tasks/get_lists')
    lists_data = json.loads(lists_response.data)
    
    found_list = None
    for item in lists_data['lists']:
        if item['id'] == list_id:
            found_list = item
            break
    
    assert found_list is not None
    assert found_list['id'] == list_id
    assert found_list['realId'] == list_id


def test_error_handling_with_invalid_uuids(auth_client, test_user):
    """Тест обработки ошибок с невалидными UUID"""
    
    invalid_uuid = 'invalid-uuid-format'
    valid_but_nonexistent_uuid = '12345678-1234-1234-1234-123456789012'
    
    # 1. Получение задач с невалидным UUID списка
    response = auth_client.get(f'/api/tasks/get_tasks?list_id={invalid_uuid}')
    assert response.status_code == 400
    
    # 2. Редактирование задачи с невалидным UUID
    edit_data = {
        'taskId': invalid_uuid,
        'title': 'Тест'
    }
    
    response = auth_client.put('/api/tasks/edit_task',
                              data=json.dumps(edit_data),
                              content_type='application/json')
    assert response.status_code == 400
    
    # 3. Изменение статуса с несуществующим UUID
    status_data = {
        'taskId': valid_but_nonexistent_uuid,
        'is_completed': True
    }
    
    response = auth_client.put('/api/tasks/change_status',
                              data=json.dumps(status_data),
                              content_type='application/json')
    assert response.status_code == 404
    
    # 4. Удаление задачи с несуществующим UUID
    delete_data = {
        'taskId': valid_but_nonexistent_uuid
    }
    
    response = auth_client.delete('/api/tasks/del_task',
                                 data=json.dumps(delete_data),
                                 content_type='application/json')
    assert response.status_code == 404
    
    # 5. Получение подзадач с несуществующим UUID
    response = auth_client.get(f'/api/tasks/get_subtasks?parent_task_id={valid_but_nonexistent_uuid}')
    assert response.status_code == 404


def test_uuid_format_validation(auth_client, test_user):
    """Тест валидации формата UUID"""
    
    # Создаем задачу для тестирования
    task_data = {
        'title': 'Тестовая задача',
        'listId': 'tasks'
    }
    
    task_response = auth_client.post('/api/tasks/add_task',
                                    data=json.dumps(task_data),
                                    content_type='application/json')
    
    assert task_response.status_code == 200
    task = json.loads(task_response.data)['task']
    
    # Проверяем, что созданный UUID соответствует стандартному формату
    task_id = task['id']
    assert is_valid_uuid(task_id)
    
    # Проверяем длину UUID (должен быть 36 символов с дефисами)
    assert len(task_id) == 36
    
    # Проверяем формат UUID (8-4-4-4-12)
    parts = task_id.split('-')
    assert len(parts) == 5
    assert len(parts[0]) == 8
    assert len(parts[1]) == 4
    assert len(parts[2]) == 4
    assert len(parts[3]) == 4
    assert len(parts[4]) == 12
    
    # Проверяем, что все символы являются шестнадцатеричными
    hex_chars = '0123456789abcdefABCDEF-'
    for char in task_id:
        assert char in hex_chars
