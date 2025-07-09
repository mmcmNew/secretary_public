"""Utility helpers for Socket.IO notifications."""

from app import socketio


def notify_data_update(**data):
    """Emit update notifications to clients via Socket.IO."""
    socketio.emit('data_updated', data, namespace='/updates')

def notify_task_change(action, task_data, list_id=None, lists_data=None, calendar_events=None):
    """Emit specific task change notifications, optionally with lists and calendar events."""
    payload = {
        'action': action,  # 'added', 'updated', 'deleted', 'status_changed'
        'task': task_data,
        'listId': list_id
    }
    if lists_data is not None:
        payload['lists_data'] = lists_data
    if calendar_events is not None:
        payload['calendar_events'] = calendar_events
    socketio.emit('task_changed', payload, namespace='/updates')
