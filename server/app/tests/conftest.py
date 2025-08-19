import pytest
import os
import sys
import uuid
from flask import Flask
from flask_jwt_extended import create_access_token
import datetime
import json

# Добавляем путь к приложению в sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app, db
# Откладываем импорт моделей до создания контекста приложения
User = None
Priority = None
Status = None
Interval = None
List = None
Group = None
Project = None
Task = None

# --- Start of documentation generation code ---
api_calls = {}

def pytest_addoption(parser):
    parser.addoption(
        "--docs", action="store_true", default=False, help="Generate API documentation"
    )

def pytest_sessionfinish(session):
    """
    Хук, который запускается после завершения всех тестов.
    Генерирует JSON файл с документацией по API.
    """
    if not session.config.getoption("docs") or not api_calls:
        return

    with open("test_api_documentation.json", "w", encoding="utf-8") as f:
        json.dump(api_calls, f, indent=2, ensure_ascii=False)
# --- End of documentation generation code ---

@pytest.fixture(scope='session')
def app():
    """Создание тестового приложения Flask"""
    # Создаем тестовое приложение с тестовой конфигурацией
    app = create_app('test')
    
    with app.app_context():
        db.drop_all()
        # Импортируем модели внутри контекста приложения
        global User, Priority, Status, Interval, List, Group, Project, Task
        from app.main.models import User
        from app.tasks.models import Priority, Status, Interval, List, Group, Project, Task
        
        # Создаем все таблицы
        db.create_all()
        
        # Добавляем начальные данные
        add_initial_test_data(db.session)
        
        yield app
        
        # Очистка после тестов
        # db.drop_all()

@pytest.fixture(scope='function')
def db_session(app):
    with app.app_context():
        yield db.session

@pytest.fixture(scope='session')
def client(app):
    """Создание тестового клиента"""
    return app.test_client()

@pytest.fixture(scope='function')
def auth_client(app, test_user, pytestconfig):
    """Создание тестового клиента с аутентификацией"""
    # Создаем токен для тестового пользователя
    with app.app_context():
        access_token = create_access_token(identity=str(test_user.id))
    
    client = app.test_client()
    
    # Сохраняем токен для использования в тестах
    client.__access_token__ = access_token
    
    # Создаем метод для отправки запросов с токеном
    original_open = client.open
    def open_with_token(*args, **kwargs):
        # Добавляем заголовок авторизации ко всем запросам
        headers = kwargs.get('headers', {})
        if 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {access_token}'
            kwargs['headers'] = headers
        return original_open(*args, **kwargs)
    
    client.open = open_with_token

    if pytestconfig.getoption("docs"):
        documenting_original_open = client.open
        def open_with_docs(*args, **kwargs):
            # Сохраняем детали запроса
            request_path = args[0] if args else kwargs.get('path')
            request_method = kwargs.get('method', 'GET')
            request_data = kwargs.get('data', None)
            
            # Выполняем запрос
            response = documenting_original_open(*args, **kwargs)
            
            # Декодируем данные, если они в байтах
            if isinstance(request_data, bytes):
                request_data = request_data.decode('utf-8')
            
            response_data_bytes = response.data
            response_data_str = response_data_bytes.decode('utf-8')

            # Преобразуем JSON строки в словари для красивого вывода
            try:
                request_data = json.loads(request_data) if request_data else None
            except json.JSONDecodeError:
                pass # Оставляем как есть, если это не JSON
                
            try:
                response_data = json.loads(response_data_str) if response_data_str else None
            except json.JSONDecodeError:
                response_data = response_data_str

            # Only record successful responses (status 200)
            if response.status_code == 200:
                request_key = f"{request_method} {request_path}"
                
                # Only record the first successful call for each key
                if request_key not in api_calls:
                    api_calls[request_key] = {
                        'request': {
                            'data': request_data,
                        },
                        'response': {
                            'data': response_data,
                        }
                    }
            
            return response
        client.open = open_with_docs

    yield client


@pytest.fixture(scope='function')
def auth_client2(app, test_user2, pytestconfig):
    """Создание второго тестового клиента с аутентификацией"""
    # Создаем токен для второго тестового пользователя
    with app.app_context():
        access_token = create_access_token(identity=str(test_user2.id))
    
    client = app.test_client()
    
    # Сохраняем токен для использования в тестах
    client.__access_token__ = access_token
    
    # Создаем метод для отправки запросов с токеном
    original_open = client.open
    def open_with_token(*args, **kwargs):
        # Добавляем заголовок авторизации ко всем запросам
        headers = kwargs.get('headers', {})
        if 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {access_token}'
            kwargs['headers'] = headers
        return original_open(*args, **kwargs)
    
    client.open = open_with_token

    if pytestconfig.getoption("docs"):
        documenting_original_open = client.open
        def open_with_docs(*args, **kwargs):
            # Сохраняем детали запроса
            request_path = args[0] if args else kwargs.get('path')
            request_method = kwargs.get('method', 'GET')
            request_data = kwargs.get('data', None)
            
            # Выполняем запрос
            response = documenting_original_open(*args, **kwargs)
            
            # Декодируем данные, если они в байтах
            if isinstance(request_data, bytes):
                request_data = request_data.decode('utf-8')
            
            response_data_bytes = response.data
            response_data_str = response_data_bytes.decode('utf-8')

            # Преобразуем JSON строки в словари для красивого вывода
            try:
                request_data = json.loads(request_data) if request_data else None
            except json.JSONDecodeError:
                pass # Оставляем как есть, если это не JSON
                
            try:
                response_data = json.loads(response_data_str) if response_data_str else None
            except json.JSONDecodeError:
                response_data = response_data_str

            # Only record successful responses (status 200)
            if response.status_code == 200:
                request_key = f"{request_method} {request_path}"
                
                # Only record the first successful call for each key
                if request_key not in api_calls:
                    api_calls[request_key] = {
                        'request': {
                            'data': request_data,
                        },
                        'response': {
                            'data': response_data,
                        }
                    }
            
            return response
        client.open = open_with_docs

    yield client

@pytest.fixture(scope='function')
def test_user(db_session, clean_db):
    """Создание тестового пользователя"""
    user = User.query.filter_by(email='test@example.com').first()
    if not user:
        user = User(
            email='test@example.com',
            user_name='Test User'
        )
        user.set_password('testpassword')
        db_session.add(user)
        db_session.commit()
    
    yield user


@pytest.fixture(scope='function')
def test_user2(db_session, clean_db):
    """Создание второго тестового пользователя"""
    user = User.query.filter_by(email='test2@example.com').first()
    if not user:
        user = User(
            email='test2@example.com',
            user_name='Test User 2'
        )
        user.set_password('testpassword2')
        db_session.add(user)
        db_session.commit()
    
    yield user

def add_initial_test_data(session):
    """Добавление начальных данных для тестов"""
    # Добавляем приоритеты, если их нет
    if not session.query(Priority).first():
        priorities = [
            Priority(name="Low"),
            Priority(name="Medium"),
            Priority(name="High"),
        ]
        for priority in priorities:
            session.add(priority)
    
    # Добавляем статусы, если их нет
    if not session.query(Status).first():
        statuses = [
            Status(name="Not Started"),
            Status(name="In Progress"),
            Status(name="Completed"),
        ]
        for status in statuses:
            session.add(status)
    
    # Добавляем интервалы, если их нет
    if not session.query(Interval).first():
        intervals = [
            Interval(name="DAILY", title="День"),
            Interval(name="WEEKLY", title="Неделя"),
            Interval(name="MONTHLY", title="Месяц"),
            Interval(name="YEARLY", title="Год"),
            Interval(name="WORK", title="Рабочие дни"),
        ]
        for interval in intervals:
            session.add(interval)
    
    session.commit()


@pytest.fixture(scope='function')
def test_list(db_session, test_user):
    """Создание тестового списка"""
    test_list = List(
        title='Test List',
        user_id=test_user.id,
        order=0
    )
    db_session.add(test_list)
    db_session.commit()
    yield test_list


@pytest.fixture(scope='function')
def test_group(db_session, test_user):
    """Создание тестовой группы"""
    test_group = Group(
        title='Test Group',
        user_id=test_user.id,
        order=0
    )
    db_session.add(test_group)
    db_session.commit()
    yield test_group


@pytest.fixture(scope='function')
def test_project(db_session, test_user):
    """Создание тестового проекта"""
    test_project = Project(
        title='Test Project',
        user_id=test_user.id,
        order=0
    )
    db_session.add(test_project)
    db_session.commit()
    yield test_project


@pytest.fixture(scope='function')
def test_task(db_session, test_user):
    """Создание тестовой задачи"""
    test_task = Task(
        title='Test Task',
        user_id=test_user.id
    )
    db_session.add(test_task)
    db_session.commit()
    yield test_task

@pytest.fixture(scope='function')
def task_for_today(db_session, test_user):
    """Создание тестовой задачи на сегодня"""
    task = Task(
        title='Task for today',
        user_id=test_user.id,
        end=datetime.datetime.now(datetime.timezone.utc)
    )
    db_session.add(task)
    db_session.commit()
    yield task

def is_valid_uuid(uuid_string):
    """Проверяет, является ли строка валидным UUID"""
    try:
        uuid.UUID(uuid_string)
        return True
    except (ValueError, TypeError):
        return False

@pytest.fixture(scope='function')
def clean_db(db_session):
    """Фикстура для очистки базы данных перед каждым тестом"""
    # Удаляем все данные из таблиц
    for table in reversed(db.metadata.sorted_tables):
        db_session.execute(table.delete())
    
    # Добавляем начальные данные
    add_initial_test_data(db_session)
    
    db_session.commit()
    
    yield db_session