import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler


app_dir = os.path.abspath(os.path.dirname(__file__))


class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'my_secret')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    # Параметры логирования
    LOGGING_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    # Формируем пути к файлам логов с текущей датой

    current_date = datetime.now().strftime('%Y-%m-%d')
    DEBUG_LOGGING_LOCATION = os.path.join('logs', f'debug_{current_date}.log')
    ERROR_LOGGING_LOCATION = os.path.join('logs', f'error_{current_date}.log')

    app_dir_name = os.path.dirname(__file__)
    USERS_DB_PATH = os.path.join(app_dir_name, 'user_data', 'db', 'users.db')
    PRODUCTIVITY_DB_PATH = os.path.join(app_dir_name, 'user_data', 'db', 'productivity.db')
    CONTENT_DB_PATH = os.path.join(app_dir_name, 'user_data', 'db', 'content.db')
    WORKSPACE_DB_PATH = os.path.join(app_dir_name, 'user_data', 'db', 'workspace.db')
    COMMUNICATION_DB_PATH = os.path.join(app_dir_name, 'user_data', 'db', 'communication.db')
    MAIN_DB_PATH = CONTENT_DB_PATH  # Backwards compatibility

    SQLALCHEMY_DATABASE_URI = f"sqlite:///{PRODUCTIVITY_DB_PATH}"
    SQLALCHEMY_BINDS = {
        'users': f"sqlite:///{USERS_DB_PATH}",
        'content': f"sqlite:///{CONTENT_DB_PATH}",
        'workspace': f"sqlite:///{WORKSPACE_DB_PATH}",
        'communication': f"sqlite:///{COMMUNICATION_DB_PATH}",
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'detect_types': 1}
    }

    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "True") == "True"
    SESSION_COOKIE_HTTPONLY = os.environ.get("SESSION_COOKIE_HTTPONLY", "True") == "True"
    PERMANENT_SESSION_LIFETIME = int(os.environ.get("PERMANENT_SESSION_LIFETIME", 3600))

    @staticmethod
    def init_app(app):
        os.makedirs(os.path.join(BaseConfig.app_dir_name, 'user_data', 'db'), exist_ok=True)
        os.makedirs(os.path.dirname(BaseConfig.DEBUG_LOGGING_LOCATION), exist_ok=True)
        os.makedirs(os.path.dirname(BaseConfig.ERROR_LOGGING_LOCATION), exist_ok=True)

        logging.basicConfig(level=logging.DEBUG,
                            format=BaseConfig.LOGGING_FORMAT,
                            datefmt='%Y-%m-%d %H:%M:%S')
        formatter = logging.Formatter(BaseConfig.LOGGING_FORMAT)

        debug_handler = RotatingFileHandler(BaseConfig.DEBUG_LOGGING_LOCATION)
        debug_handler.setLevel(logging.DEBUG)
        debug_handler.setFormatter(formatter)

        error_handler = RotatingFileHandler(BaseConfig.ERROR_LOGGING_LOCATION)
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)

        app.logger.addHandler(debug_handler)
        app.logger.addHandler(error_handler)
        app.logger.setLevel(logging.DEBUG)
        app.logger.info('Application startup')

class TestingConfig(BaseConfig):
    DEBUG = True
    DATABASE_URI = os.environ.get('DATABASE_URL', 'demo_base.db')
    WTF_CSRF_ENABLED = False
    SECRET_KEY = BaseConfig.SECRET_KEY or "test"

class WorkConfig(BaseConfig):
    DATABASE_URI = os.environ.get('DATABASE_URL', 'database.db')
    DEBUG = True
