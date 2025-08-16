import pytest
import json
from datetime import datetime

def create_parent_task(auth_client):
    """Создает родительскую задачу для тестов"""
    task_data = {
        'title': 'Test Series',
        'start': '2025-07-22T07:30:00Z',
        'end': '2025-07-22T09:30:00Z',
        'listId': 'tasks'
    }
    
    response = auth_client.post('/api/tasks/add_task',
                               data=json.dumps(task_data),
                               content_type='application/json')
    
    assert response.status_code == 200
    task = json.loads(response.data)['task']
    return task

def test_create_override(auth_client, test_user):
    task = create_parent_task(auth_client)
    date = '2025-07-22'
    patch_data = {'note': 'Instance note'}
    
    resp = auth_client.patch('/api/tasks/instance',
        json={
            'parent_task_id': task['id'],
            'date': date,
            'data': patch_data
        })
    
    assert resp.status_code in (200, 201)
    data = resp.get_json()
    assert data['success']
    assert data['instance']['is_override']
    assert data['instance']['data']['note'] == 'Instance note'

def test_update_override(auth_client, test_user):
    task = create_parent_task(auth_client)
    date = '2025-07-22'
    
    # create override
    auth_client.patch('/api/tasks/instance', json={
        'parent_task_id': task['id'],
        'date': date,
        'data': {'note': 'First'}
    })
    
    # update override
    resp = auth_client.patch('/api/tasks/instance', json={
        'parent_task_id': task['id'],
        'date': date,
        'data': {'note': 'Second'}
    })
    
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['instance']['data']['note'] == 'Second'

def test_delete_override_when_no_diff(auth_client, test_user):
    task = create_parent_task(auth_client)
    date = '2025-07-22'
    
    # create override
    auth_client.patch('/api/tasks/instance', json={
        'parent_task_id': task['id'],
        'date': date,
        'data': {'note': 'Instance note'}
    })
    
    # delete override (no diff)
    resp = auth_client.patch('/api/tasks/instance', json={
        'parent_task_id': task['id'],
        'date': date,
        'data': {'note': task.get('note')}
    })
    
    assert resp.status_code == 200
    data = resp.get_json()
    assert not data['instance']['is_override']

def test_skip_instance(auth_client, test_user):
    task = create_parent_task(auth_client)
    date = '2025-07-22'
    
    resp = auth_client.patch('/api/tasks/instance', json={
        'parent_task_id': task['id'],
        'date': date,
        'data': {'type': 'skip'}
    })
    
    assert resp.status_code in (200, 201)
    data = resp.get_json()
    assert data['instance']['type'] == 'skip'