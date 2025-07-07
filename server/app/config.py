import logging
import os
from datetime import datetime, timedelta
from logging.handlers import RotatingFileHandler


app_dir = os.path.abspath(os.path.dirname(__file__))


class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'my_secret')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    # Параметры логирования
    LOGGING_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    # Формируем пути к файлам логов с текущей датой

    current_date = datetime.now().strftime('%Y-%m-%d')
    DEBUG_LOGGING_LOCATION = os.path.join('logs', f'debug_{current_date}.log')
    ERROR_LOGGING_LOCATION = os.path.join('logs', f'error_{current_date}.log')

    app_dir_name = os.path.dirname(__file__)
    server_root = os.path.dirname(app_dir_name)
    # Paths to SQLite databases will be set in init_app using app.instance_path
    USERS_DB_PATH = ''
    PRODUCTIVITY_DB_PATH = ''
    CONTENT_DB_PATH = ''
    WORKSPACE_DB_PATH = ''
    COMMUNICATION_DB_PATH = ''
    MAIN_DB_PATH = ''  # Backwards compatibility

    SQLALCHEMY_DATABASE_URI = ''
    SQLALCHEMY_BINDS = {}
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'detect_types': 1}
    }

    AI_WEBHOOK_URL = os.environ.get(
        "AI_WEBHOOK_URL",
        "https://n8n.ndomen.online/webhook/4999da23-b30e-494b-9435-9948be5ab8d4",
    )
    AI_IMAGE_WEBHOOK_URL = os.environ.get(
        "AI_IMAGE_WEBHOOK_URL",
        "https://n8n.ndomen.online/webhook/2da3e25d-1ff6-41f9-94e8-d55d43c1247b",
    )

    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "True") == "True"
    SESSION_COOKIE_HTTPONLY = os.environ.get("SESSION_COOKIE_HTTPONLY", "True") == "True"
    PERMANENT_SESSION_LIFETIME = int(os.environ.get("PERMANENT_SESSION_LIFETIME", 3600))

    @staticmethod
    def init_app(app):
        # Configure database locations inside the instance folder
        user_db_dir = os.path.join(app.instance_path, 'db')
        os.makedirs(user_db_dir, exist_ok=True)

        app.config['USERS_DB_PATH'] = os.path.join(user_db_dir, 'users.db')
        app.config['PRODUCTIVITY_DB_PATH'] = os.path.join(user_db_dir, 'productivity.db')
        app.config['CONTENT_DB_PATH'] = os.path.join(user_db_dir, 'content.db')
        app.config['WORKSPACE_DB_PATH'] = os.path.join(user_db_dir, 'workspace.db')
        app.config['COMMUNICATION_DB_PATH'] = os.path.join(user_db_dir, 'communication.db')
        app.config['MAIN_DB_PATH'] = app.config['CONTENT_DB_PATH']

        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{app.config['PRODUCTIVITY_DB_PATH']}"
        app.config['SQLALCHEMY_BINDS'] = {
            'users': f"sqlite:///{app.config['USERS_DB_PATH']}",
            'content': f"sqlite:///{app.config['CONTENT_DB_PATH']}",
            'workspace': f"sqlite:///{app.config['WORKSPACE_DB_PATH']}",
            'communication': f"sqlite:///{app.config['COMMUNICATION_DB_PATH']}",
        }

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


class WorkConfig(BaseConfig):
    DEBUG = False
    DATABASE_URI = os.environ.get('DATABASE_URL', 'base.db')
    WTF_CSRF_ENABLED = True