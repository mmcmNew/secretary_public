import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler


app_dir = os.path.abspath(os.path.dirname(__file__))


class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'my_secret')
    # Параметры логирования
    LOGGING_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    # Формируем пути к файлам логов с текущей датой
    current_date = datetime.now().strftime('%Y-%m-%d')
    DEBUG_LOGGING_LOCATION = os.path.join('logs', f'debug_{current_date}.log')
    ERROR_LOGGING_LOCATION = os.path.join('logs', f'error_{current_date}.log')

    # настройка подключения к базе данных
    app_dir_name = os.path.dirname(__file__)
    MAIN_DB_PATH = os.path.join(app_dir_name, 'user_data', 'db', 'main.db')
    to_do_db_path = os.path.join(app_dir_name, 'user_data', 'db', 'to_do.db')
    appmeta_db_path = os.path.join(app_dir_name, 'user_data', 'db', 'appmeta.db')
    # print(MAIN_DB_PATH)

    SQLALCHEMY_DATABASE_URI = f'sqlite:///{to_do_db_path}'  # основная база данных (пользователи и сообщения чата)
    SQLALCHEMY_BINDS = {
        'main': f'sqlite:///{MAIN_DB_PATH}',  # база данных списка дел
        'app_session_meta': f'sqlite:///{appmeta_db_path}'  # хранит dashboard's и сессию
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {'connect_args': {'detect_types': 1}}  # Включить поддержку типа TIMESTAMP для SQLite



    def init_app(app):
        # Проверяем и создаем директории для логов
        os.makedirs(os.path.dirname(BaseConfig.DEBUG_LOGGING_LOCATION), exist_ok=True)
        os.makedirs(os.path.dirname(BaseConfig.ERROR_LOGGING_LOCATION), exist_ok=True)

        logging.basicConfig(level=logging.DEBUG, format=BaseConfig.LOGGING_FORMAT, datefmt='%Y-%m-%d %H:%M:%S')

        # Формат логирования
        formatter = logging.Formatter(BaseConfig.LOGGING_FORMAT)

        # Обработчик для уровня DEBUG и выше
        debug_handler = RotatingFileHandler(
            BaseConfig.DEBUG_LOGGING_LOCATION)
        debug_handler.setLevel(logging.DEBUG)
        debug_handler.setFormatter(formatter)

        # Обработчик для уровня ERROR и выше
        error_handler = RotatingFileHandler(
            BaseConfig.ERROR_LOGGING_LOCATION)
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)

        # Обработчик для вывода в консоль
        # console_handler = logging.StreamHandler()
        # console_handler.setFormatter(logging.Formatter(BaseConfig.LOGGING_FORMAT))
        # console_handler.setLevel(logging.DEBUG)

        app.logger.addHandler(debug_handler)
        app.logger.addHandler(error_handler)
        # app.logger.addHandler(console_handler)

        # Установка базового уровня логирования
        app.logger.setLevel(logging.DEBUG)

        # Старт приложения
        app.logger.info('Application startup')


class TestingConfig(BaseConfig):
    DEBUG = True
    DATABASE_URI = os.environ.get('DATABASE_URL', 'demo_base.db')


class WorkConfig(BaseConfig):
    DATABASE_URI = os.environ.get('DATABASE_URL', 'database.db')
    DEBUG = True


