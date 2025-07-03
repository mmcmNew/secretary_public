import pytest
from test_auth import register, login, logout, client, app


def test_journal_requires_auth(client):
    resp = client.post('/api/journals/diary', json={'text': 'entry'})
    assert resp.status_code in (401, 302)


def test_journal_crud(client):
    register(client, username='userj', email='userj@example.com')
    login(client, username='userj')

    resp = client.post('/api/journals/diary', json={'text': 'first'})
    assert resp.status_code == 201
    entry = resp.get_json()
    entry_id = entry['id']
    assert entry['data']['text'] == 'first'

    resp = client.get('/api/journals/diary')
    assert resp.status_code == 200
    assert any(e['id'] == entry_id for e in resp.get_json())

    resp = client.put(f'/api/journals/diary/{entry_id}', json={'text': 'second'})
    assert resp.status_code == 200
    assert resp.get_json()['data']['text'] == 'second'

    resp = client.delete(f'/api/journals/diary/{entry_id}')
    assert resp.status_code == 200
    assert resp.get_json()['result'] == 'OK'

    resp = client.get('/api/journals/diary')
    ids = [e['id'] for e in resp.get_json()]
    assert entry_id not in ids
    logout(client)

