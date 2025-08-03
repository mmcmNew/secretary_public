import pytest
import os
import sys
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

@pytest.fixture(scope='session')
def app():
    """Создание тестового приложения Flask"""
    # Создаем тестовое приложение с тестовой конфигурацией
    app = create_app('test')
    
    with app.app_context():
        # Импортируем модели внутри контекста приложения
        global User, Priority, Status, Interval
        from app.main.models import User
        from app.tasks.models import Priority, Status, Interval
        
        # Создаем все таблицы
        db.create_all()
        
        # Добавляем начальные данные
        add_initial_test_data()
        
        yield app
        
        # Очистка после тестов
        db.drop_all()

@pytest.fixture(scope='session')
def client(app):
    """Создание тестового клиента"""
    return app.test_client()

@pytest.fixture(scope='function')
def auth_client(app, test_user):
    """Создание тестового клиента с аутентификацией"""
    with app.test_client() as client:
        # Создаем токен для тестового пользователя
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
def test_user(app):
    """Создание тестового пользователя"""
    with app.app_context():
        # Проверяем, существует ли уже тестовый пользователь
        user = User.query.filter_by(email='test@example.com').first()
        if not user:
            user = User(
                email='test@example.com',
                user_name='Test User'
            )
            user.set_password('testpassword')
            db.session.add(user)
            db.session.commit()
        
        yield user
        
        # Удаляем тестового пользователя после теста
        # db.session.delete(user)
        # db.session.commit()

def add_initial_test_data():
    """Добавление начальных данных для тестов"""
    # Добавляем приоритеты, если их нет
    if not Priority.query.first():
        priorities = [
            Priority(name="Low"),
            Priority(name="Medium"),
            Priority(name="High"),
        ]
        for priority in priorities:
            db.session.add(priority)
    
    # Добавляем статусы, если их нет
    if not Status.query.first():
        statuses = [
            Status(name="Not Started"),
            Status(name="In Progress"),
            Status(name="Completed"),
        ]
        for status in statuses:
            db.session.add(status)
    
    # Добавляем интервалы, если их нет
    if not Interval.query.first():
        intervals = [
            Interval(name="DAILY", title="День"),
            Interval(name="WEEKLY", title="Неделя"),
            Interval(name="MONTHLY", title="Месяц"),
            Interval(name="YEARLY", title="Год"),
            Interval(name="WORK", title="Рабочие дни"),
        ]
        for interval in intervals:
            db.session.add(interval)
    
    db.session.commit()

@pytest.fixture(scope='function')
def clean_db(app):
    """Фикстура для очистки базы данных перед каждым тестом"""
    with app.app_context():
        # Удаляем все данные из таблиц
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        
        # Добавляем начальные данные
        add_initial_test_data()
        
        db.session.commit()
        
        yield db
        
        # Очистка после теста
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()