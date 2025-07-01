"""Utility helpers for Socket.IO notifications."""

from app import socketio


def notify_data_update(**data):
    """Emit update notifications to clients via Socket.IO."""
    socketio.emit('data_updated', data, namespace='/updates')
