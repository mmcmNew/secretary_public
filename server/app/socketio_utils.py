"""Utility helpers for Socket.IO notifications."""

from app import socketio


def notify_data_update(**data):
    """Emit update notifications to clients via Socket.IO."""
    socketio.emit('data_updated', data, namespace='/updates')

def notify_task_change(action, task_data, list_id=None):
    """Emit specific task change notifications."""
    socketio.emit('task_changed', {
        'action': action,  # 'added', 'updated', 'deleted', 'status_changed'
        'task': task_data,
        'listId': list_id
    }, namespace='/updates')
