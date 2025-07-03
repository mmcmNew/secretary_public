import pytest
from test_auth import register, login, logout, client, app


def update_dashboard(client, dashboard_id, name="dash", containers=None):
    return client.post('/dashboard', json={
        'dashboard_data': {'id': dashboard_id, 'name': name},
        'containers': containers or [],
        'themeMode': 'light',
        'calendarSettings': None,
    })


def test_dashboards_per_user(client):
    register(client, username="u1", email="u1@example.com")
    login(client, username="u1")
    resp = client.get('/dashboard/last')
    assert resp.status_code == 200
    data1 = resp.get_json()
    dash1_id = data1['id']
    assert dash1_id != 0
    update_dashboard(client, dash1_id, name="d1")
    user_resp = client.get('/api/user')
    assert user_resp.get_json()['last_dashboard_id'] == dash1_id
    logout(client)

    register(client, username="u2", email="u2@example.com")
    login(client, username="u2")
    resp = client.get('/dashboard/last')
    assert resp.status_code == 200
    data2 = resp.get_json()
    dash2_id = data2['id']
    assert dash2_id != dash1_id
    update_dashboard(client, dash2_id, name="d2")
    user_resp = client.get('/api/user')
    assert user_resp.get_json()['last_dashboard_id'] == dash2_id
    logout(client)

    login(client, username="u1")
    resp = client.get('/dashboard/last')
    assert resp.get_json()['id'] == dash1_id


