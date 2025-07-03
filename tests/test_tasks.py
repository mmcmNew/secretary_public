import pytest
from app import create_app, db


def register(client, username="user1", email="user1@example.com", password="Password1"):
    return client.post('/api/register', json={'username': username, 'email': email, 'password': password})

def login(client, username="user1", password="Password1"):
    return client.post('/api/login', json={'username': username, 'password': password})

@pytest.fixture()
def app(tmp_path):
    db_file = tmp_path / "test.sqlite"
    from app import config
    uri = f"sqlite:///{db_file}"
    config.TestingConfig.SQLALCHEMY_DATABASE_URI = uri
    config.TestingConfig.USERS_DB_PATH = str(db_file)
    config.TestingConfig.PRODUCTIVITY_DB_PATH = str(db_file)
    config.TestingConfig.CONTENT_DB_PATH = str(db_file)
    config.TestingConfig.WORKSPACE_DB_PATH = str(db_file)
    config.TestingConfig.COMMUNICATION_DB_PATH = str(db_file)
    config.TestingConfig.SQLALCHEMY_BINDS = {
        'users': uri,
        'content': uri,
        'workspace': uri,
        'communication': uri,
    }
    app = create_app('test')
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture()
def client(app):
    return app.test_client()


def test_tasks_require_login(client):
    resp = client.get('/tasks/get_lists')
    assert resp.status_code in (401, 302)


def test_add_list_and_task(client):
    register(client)
    login(client)
    resp = client.post('/tasks/add_list', json={'title': 'My list', 'type': 'list'})
    assert resp.status_code == 200
    list_id = resp.get_json()['new_object']['id']
    resp = client.post('/tasks/add_task', json={'title': 'Task1', 'listId': list_id})
    assert resp.status_code == 200
    resp = client.get('/tasks/get_tasks', query_string={'list_id': list_id})
    data = resp.get_json()
    assert any(task['title'] == 'Task1' for task in data['tasks'])
