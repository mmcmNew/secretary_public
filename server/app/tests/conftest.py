import pytest
import os
import sys
import uuid
from flask import Flask
from flask_jwt_extended import create_access_token
import datetime

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

@pytest.fixture(scope='session')
def app():
    """Создание тестового приложения Flask"""
    # Создаем тестовое приложение с тестовой конфигурацией
    app = create_app('test')
    
    with app.app_context():
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
        db.drop_all()

@pytest.fixture(scope='function')
def db_session(app):
    with app.app_context():
        yield db.session

@pytest.fixture(scope='session')
def client(app):
    """Создание тестового клиента"""
    return app.test_client()

@pytest.fixture(scope='function')
def auth_client(app, test_user):
    """Создание тестового клиента с аутентификацией"""
    with app.test_client() as client:
        # Создаем токен для тестового пользователя
        with app.app_context():
            access_token = create_access_token(identity=str(test_user.id))
        
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