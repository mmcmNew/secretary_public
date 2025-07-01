import os
import tempfile
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).resolve().parents[1] / "server"))
SETTINGS_DIR = Path(__file__).resolve().parents[1] / "server" / "app" / "user_data" / "settings"
SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
for name in ["modules.json", "commands_list.json", "command_information.json", "command_num_information.json"]:
    (SETTINGS_DIR / name).write_text("{}")
import pytest

from app import create_app, db

@pytest.fixture()
def app(tmp_path):
    # use tmp_path for database file
    db_file = tmp_path / "test.sqlite"
    from app import config
    config.TestingConfig.MAIN_DB_PATH = str(db_file)
    uri = f"sqlite:///{db_file}"
    config.TestingConfig.SQLALCHEMY_DATABASE_URI = uri
    config.TestingConfig.SQLALCHEMY_BINDS = {
        'main': uri,
        'app_session_meta': uri,
    }
    app = create_app('test')
    yield app
    # teardown
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture()
def client(app):
    return app.test_client()


def register(client, username="user1", email="user1@example.com", password="pass"):
    return client.post('/api/register', json={
        'username': username,
        'email': email,
        'password': password
    })


def login(client, username="user1", password="pass"):
    return client.post('/api/login', json={
        'username': username,
        'password': password
    })


def logout(client):
    return client.post('/api/logout')


def test_register_success(client):
    resp = register(client)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['user']['user_name'] == 'user1'


def test_register_duplicate(client):
    register(client)
    resp = register(client)
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'error' in data


def test_login_logout(client):
    register(client)
    resp = login(client)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['user']['user_name'] == 'user1'

    resp = logout(client)
    assert resp.status_code == 200
    assert resp.get_json()['result'] == 'OK'

