"""
Конфигурация путей к системным и пользовательским данным
"""
import os
from flask import current_app


def get_app_user_data_dir():
    """Return root directory for all user data inside the instance path."""
    base_dir = os.path.join(current_app.instance_path, 'uploads')
    os.makedirs(base_dir, exist_ok=True)
    return base_dir


def initialize_user_data(user_id):
    """
    Инициализирует данные для нового пользователя, копируя системные файлы по умолчанию
    
    Args:
        user_id (int): ID пользователя
    """
    # Создаем базовую структуру папок пользователя
    base_dir = get_app_user_data_dir()
    os.makedirs(os.path.join(base_dir, f'user_{user_id}', 'journals'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, f'user_{user_id}', 'static'), exist_ok=True)


# Пути к файлам журналов
def get_user_journal_path(user_id, journal_name):
    """Возвращает путь к папке журнала пользователя."""
    base = os.path.join(get_app_user_data_dir(), f'user_{user_id}', 'journals', journal_name)
    os.makedirs(base, exist_ok=True)
    return base
