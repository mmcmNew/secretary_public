import pytest
import json
from conftest import is_valid_uuid

def test_add_list_success(auth_client, test_user):
    """Тест успешного добавления списка"""
    # Подготавливаем данные для запроса
    list_data = {
        'type': 'list',
        'title': 'Новый список задач',
        'order': 0
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['object_type'] == 'list'
    assert 'new_object' in data
    assert data['new_object']['title'] == 'Новый список задач'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['new_object']['id'])

def test_add_group_success(auth_client, test_user):
    """Тест успешного добавления группы"""
    # Подготавливаем данные для запроса
    group_data = {
        'type': 'group',
        'title': 'Новая группа',
        'order': 1
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(group_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['object_type'] == 'group'
    assert 'new_object' in data
    assert data['new_object']['title'] == 'Новая группа'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['new_object']['id'])

def test_add_project_success(auth_client, test_user):
    """Тест успешного добавления проекта"""
    # Подготавливаем данные для запроса
    project_data = {
        'type': 'project',
        'title': 'Новый проект',
        'order': 2
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(project_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['object_type'] == 'project'
    assert 'new_object' in data
    assert data['new_object']['title'] == 'Новый проект'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['new_object']['id'])

def test_add_list_without_title(auth_client, test_user):
    """Тест добавления списка без заголовка"""
    # Подготавливаем данные для запроса без заголовка
    list_data = {
        'type': 'list',
        'order': 0
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа (должно быть присвоено значение по умолчанию)
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['new_object']['title'] == 'Новый список'
    # Проверяем, что ID является валидным UUID
    assert is_valid_uuid(data['new_object']['id'])

def test_add_list_invalid_type(auth_client, test_user):
    """Тест добавления объекта с неверным типом"""
    # Подготавливаем данные для запроса с неверным типом
    list_data = {
        'type': 'invalid_type',
        'title': 'Неверный тип объекта',
        'order': 0
    }
    
    # Отправляем POST запрос
    response = auth_client.post('/api/tasks/add_list', 
                               data=json.dumps(list_data),
                               content_type='application/json')
    
    # Проверяем статус ответа
    assert response.status_code == 404
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'неизвестный тип' in data['message'].lower()

def test_add_list_unauthorized(client):
    """Тест добавления списка без аутентификации"""
    # Подготавливаем данные для запроса
    list_data = {
        'type': 'list',
        'title': 'Список без авторизации',
        'order': 0
    }
    
    # Отправляем POST запрос без токена
    response = client.post('/api/tasks/add_list', 
                          data=json.dumps(list_data),
                          content_type='application/json')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401