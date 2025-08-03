from flask import current_app
from datetime import datetime, timezone, timedelta
from .models import AntiTask
from app import db


def _parse_iso_datetime(value):
    if not value:
        return None
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt
from collections import defaultdict


def get_anti_schedule(user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for get_anti_schedule")
    anti_schedule = AntiTask.get_anti_schedule(user_id)
    return {'anti_schedule': anti_schedule}, 200


def add_anti_task(data, user_id=None):
    # print(f'add_anti_task: data: {data}')
    title = data.get('title').strip()
    start = data.get('start')
    end = data.get('end')
    updated_fields = {key: value for key, value in data.items() if key not in ['taskId', 'id', 'subtasks', 'start',
                                                                               'end', 'title', 'type']}

    if user_id is None:
        raise ValueError("user_id must be provided for add_anti_task")

    if start and end and title:
        start = _parse_iso_datetime(start)
        end = _parse_iso_datetime(end)
        anti_task = AntiTask(title=title, start=start, end=end, user_id=user_id)
        for key, value in updated_fields.items():
            if hasattr(anti_task, key):
                setattr(anti_task, key, value)
        db.session.add(anti_task)
        db.session.commit()
        return {'success': True, 'message': 'Anti task added successfully', 'task': anti_task.to_dict()}, 200
    else:
        return {'success': False, 'message': 'Missing required fields'}, 400


def del_anti_task(data):
    anti_task_id = data.get('taskId')
    anti_task = db.session.get(AntiTask, anti_task_id)
    if anti_task:
        db.session.delete(anti_task)
        db.session.commit()
        return {'success': True, 'message': 'Anti task deleted successfully'}, 200
    else:
        return {'success': False, 'message': 'Anti task not found'}, 404


def edit_anti_task(data):
    anti_task_id = data.get('taskId')
    updated_fields = {key: value for key, value in data.items() if key not in ['taskId', 'subtasks']}

    # print(f'edit_anti_task: updated_fields: {updated_fields}')

    anti_task = db.session.get(AntiTask, anti_task_id)

    if not anti_task:
        return {'success': False, 'message': 'Task not found'}, 404

    for key, value in updated_fields.items():
        if hasattr(anti_task, key):
            if key in ['end', 'start'] and value:
                value = _parse_iso_datetime(value)
            setattr(anti_task, key, value)

    db.session.add(anti_task)
    db.session.commit()
    return {'success': True, 'task': anti_task.to_dict()}, 200

