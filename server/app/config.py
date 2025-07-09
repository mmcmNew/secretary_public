import os
import logging
from datetime import datetime, timedelta
from logging.handlers import RotatingFileHandler


class BaseConfig:
    BASEDIR = os.path.abspath(os.path.dirname(__file__))
    INSTANCE_DB_DIR = os.path.join('db')
    DIST_FOLDER = os.path.join(BASEDIR, 'dist')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'my_secret')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # SQLALCHEMY_ENGINE_OPTIONS = {'connect_args': {'detect_types': 1}}

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

    SCHEMAS = ['users', 'content', 'workspace', 'communication', 'productivity']

    @staticmethod
    def init_app(app):
        instance_path = app.instance_path
        db_dir = os.path.join(instance_path, BaseConfig.INSTANCE_DB_DIR)
        os.makedirs(db_dir, exist_ok=True)
        postgres_url="postgresql+psycopg2://secretary:secretary@localhost:5432/secretary_db"

        database_url = os.environ.get('POSTGRES_URI') or os.environ.get('DATABASE_URL') or postgres_url
        app.config['SCHEMAS'] = BaseConfig.SCHEMAS

        # if database_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        # else:
        #     db_path = os.path.join(db_dir, 'app.db')
        #     app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"

        # Логирование
        log_dir = os.path.join(instance_path, 'logs')
        os.makedirs(log_dir, exist_ok=True)

        date_str = datetime.now().strftime('%Y-%m-%d')
        debug_log = os.path.join(log_dir, f'debug_{date_str}.log')
        error_log = os.path.join(log_dir, f'error_{date_str}.log')

        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

        debug_handler = RotatingFileHandler(debug_log, maxBytes=1_000_000, backupCount=5)
        debug_handler.setLevel(logging.DEBUG)
        debug_handler.setFormatter(formatter)

        error_handler = RotatingFileHandler(error_log, maxBytes=1_000_000, backupCount=5)
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)

        app.logger.setLevel(logging.DEBUG)
        app.logger.addHandler(debug_handler)
        app.logger.addHandler(error_handler)
        app.logger.info('App started')


class TestingConfig(BaseConfig):
    DEBUG = True
    WTF_CSRF_ENABLED = False


class WorkConfig(BaseConfig):
    DEBUG = False
    WTF_CSRF_ENABLED = True