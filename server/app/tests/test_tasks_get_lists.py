import pytest
import json
from datetime import datetime

def test_get_lists_success(auth_client, test_user):
    """Тест успешного получения списков задач"""
    # Отправляем GET запрос к маршруту
    response = auth_client.get('/api/tasks/get_lists')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'lists' in data
    assert 'projects' in data
    assert 'default_lists' in data

def test_get_lists_tree_success(auth_client, test_user):
    """Тест успешного получения дерева списков задач"""
    # Отправляем GET запрос к маршруту
    response = auth_client.get('/api/tasks/get_lists_tree')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data
    
    # Проверяем, что данные являются списком (дерево)
    assert isinstance(data, list)
    # Проверяем, что есть стандартные списки
    assert len(data) >= 1
    assert any(item.get('id') == 'default' for item in data)

def test_get_lists_tree_unauthorized(client):
    """Тест получения дерева списков без аутентификации"""
    # Отправляем GET запрос без токена
    response = client.get('/api/tasks/get_lists_tree')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_get_lists_tree_with_timezone(auth_client):
    """Тест получения дерева списков с указанием часового пояса"""
    # Отправляем GET запрос с параметром часового пояса
    response = auth_client.get('/api/tasks/get_lists_tree?time_zone=Europe/Moscow')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data
    assert isinstance(data, list)

def test_get_lists_tree_with_invalid_timezone(auth_client):
    """Тест получения дерева списков с неверным часовым поясом"""
    # Отправляем GET запрос с неверным часовым поясом
    response = auth_client.get('/api/tasks/get_lists_tree?time_zone=Invalid/Timezone')
    
    # Проверяем, что запрос все равно выполняется (с использованием UTC по умолчанию)
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert data
    assert isinstance(data, list)

def test_get_lists_unauthorized(client):
    """Тест получения списков без аутентификации"""
    # Отправляем GET запрос без токена
    response = client.get('/api/tasks/get_lists')
    
    # Проверяем, что доступ запрещен
    assert response.status_code == 401

def test_get_lists_with_timezone(auth_client):
    """Тест получения списков с указанием часового пояса"""
    # Отправляем GET запрос с параметром часового пояса
    response = auth_client.get('/api/tasks/get_lists?time_zone=Europe/Moscow')
    
    # Проверяем статус ответа
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'lists' in data
    assert 'projects' in data
    assert 'default_lists' in data

def test_get_lists_with_invalid_timezone(auth_client):
    """Тест получения списков с неверным часовым поясом"""
    # Отправляем GET запрос с неверным часовым поясом
    response = auth_client.get('/api/tasks/get_lists?time_zone=Invalid/Timezone')
    
    # Проверяем, что запрос все равно выполняется (с использованием UTC по умолчанию)
    assert response.status_code == 200
    
    # Проверяем структуру ответа
    data = json.loads(response.data)
    assert 'lists' in data
    assert 'projects' in data
    assert 'default_lists' in data