import pytest
import json
from datetime import datetime, timedelta
from conftest import is_valid_uuid


@pytest.mark.parametrize("list_id, task_title, extra_checks", [
    ("tasks", "Тестовая задача", {}),
    ("my_day", "Задача на сегодня", {}),
    ("important", "Важная задача", {"is_important": True}),
    ("background", "Фоновая задача", {"is_background": True}),
])
def test_add_task_to_predefined_lists(auth_client, test_user, list_id, task_title, extra_checks):
    """Тест успешного добавления задачи в предопределенные списки"""
    task_data = {
        'title': task_title,
        'listId': list_id
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'task' in data
    assert data['task']['title'] == task_title
    assert is_valid_uuid(data['task']['id'])

    # Дополнительные проверки для important, background и my_day
    if extra_checks:
        for key, value in extra_checks.items():
            assert data['task'][key] is value

    task_id = data['task']['id']
    task_list = data.get('task_list', {})
    assert task_list, "task_list should be in the response"
    print(f"task_id: {task_id}, task_list: {task_list}")
    assert task_id in task_list.get('childes_order', []), "task_id should be in childes_order"


def test_add_task_to_custom_list(auth_client, test_user):
    """Тест успешного добавления задачи в кастомный список"""
    # 1. Создаем новый список
    list_data = {
        "name": "Новый список для теста",
        "icon": "test_icon",
        "type": "list"
    }
    response = auth_client.post('/api/tasks/add_list',
                                data=json.dumps(list_data),
                                content_type='application/json')
    assert response.status_code == 200
    list_response_data = json.loads(response.data)
    assert list_response_data['success'] is True
    new_list_id = list_response_data['new_object']['id']

    # 2. Добавляем задачу в созданный список
    task_title = "Задача в кастомном списке"
    task_data = {
        'title': task_title,
        'listId': new_list_id
    }
    
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    # 3. Проверяем результат
    assert response.status_code == 200
    task_response_data = json.loads(response.data)
    assert task_response_data['success'] is True
    assert 'task' in task_response_data
    assert task_response_data['task']['title'] == task_title
    assert is_valid_uuid(task_response_data['task']['id'])
    # Убедимся, что задача добавлена именно в этот список
    assert new_list_id in task_response_data['task']['lists_ids']

    task_id = task_response_data['task']['id']
    task_list = task_response_data.get('task_list', {})
    assert task_list, "task_list should be in the response"
    assert task_id in task_list.get('childes_order', []), "task_id should be in childes_order"


def test_add_task_without_title(auth_client, test_user):
    """Тест добавления задачи без заголовка"""
    # Подготавливаем данные для запроса без заголовка
    task_data = {
        'listId': 'tasks'
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_task', 
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    # Проверяем статус ответа (ожидаем ошибку)
    assert response.status_code == 400
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'title' in data['message'].lower()


def test_add_task_with_due_date(auth_client, test_user):
    """Тест добавления задачи с датой выполнения"""
    # Подготавливаем данные для запроса с датой выполнения
    due_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
    task_data = {
        'title': 'Задача с датой выполнения',
        'end': due_date,
        'listId': 'tasks'
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
    assert data['task']['title'] == 'Задача с датой выполнения'
    assert data['task']['end'] == due_date
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['task']['id'])


def test_add_task_unauthorized(client):
    """Тест добавления задачи без аутентификации"""
    # Подготавливаем данные для запроса
    task_data = {
        'title': 'Тестовая задача',
        'listId': 'tasks'
    }
    
    # Отправляем POST запрос без токена
    response = client.post('/api/tasks/add_task', 
                          data=json.dumps(task_data),
                          content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401