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


def register(client, username="user1", email="user1@example.com", password="Password1"):
    return client.post('/api/register', json={
        'username': username,
        'email': email,
        'password': password
    })


def login(client, username="user1", password="Password1"):
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
    # verify user folder created
    data_dir = data['user']['data_dir']
    assert os.path.isdir(data_dir)


def test_register_duplicate(client):
    register(client)
    resp = register(client)
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'error' in data


def test_register_duplicate_email(client):
    register(client)
    resp = register(client, username="user2")
    data = resp.get_json()
    assert resp.status_code == 400
    assert data['error'] == 'Email already registered'


def test_register_duplicate_username(client):
    register(client)
    resp = register(client, email="other@example.com")
    data = resp.get_json()
    assert resp.status_code == 400
    assert data['error'] == 'Username already taken'


def test_login_logout(client):
    register(client)
    resp = login(client)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['user']['user_name'] == 'user1'

    resp = logout(client)
    assert resp.status_code == 200
    assert resp.get_json()['result'] == 'OK'


def test_login_user_not_found(client):
    resp = login(client)
    assert resp.status_code == 404
    assert resp.get_json()['error'] == 'User not found'


def test_login_wrong_password(client):
    register(client)
    resp = login(client, password="WrongPass1")
    assert resp.status_code == 401
    assert resp.get_json()['error'] == 'Incorrect password'

