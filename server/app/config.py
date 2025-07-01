import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

def _db_uri(path):
    return f"sqlite:///{path}"

class BaseConfig:
    SECRET_KEY = 'test-secret'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIN_DB_PATH = os.path.join(BASE_DIR, 'test.sqlite')
    SQLALCHEMY_DATABASE_URI = _db_uri(MAIN_DB_PATH)
    SQLALCHEMY_BINDS = {
        'main': SQLALCHEMY_DATABASE_URI,
        'app_session_meta': SQLALCHEMY_DATABASE_URI,
    }

    @staticmethod
    def init_app(app):
        pass

class WorkConfig(BaseConfig):
    pass

class TestingConfig(BaseConfig):
    TESTING = True
