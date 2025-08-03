from datetime import datetime, timezone, timedelta
from flask import current_app
from ..models import Task
from .models import TaskOverride
from app import db, socketio
from datetime import datetime, timedelta, timezone
from dateutil.rrule import rrule, WEEKLY, DAILY, MONTHLY, YEARLY, MO, TU, WE, TH, FR
from flask import current_app
from ..models import Task, Status
from .models import TaskOverride


def _parse_iso_datetime(value):
    if not value:
        return None
    if value.endswith('Z'):
        value = value[:-1] + '+00:00'
    try:
        dt = datetime.fromisoformat(value)
    except ValueError:
        raise ValueError(f"Invalid ISO datetime format: {value}")
    
    if dt.tzinfo is None:
        raise ValueError(f"Datetime must include timezone: {value}")
    
    return dt.astimezone(timezone.utc).replace(tzinfo=None)

def _is_task_in_range(task, start_dt, end_dt, is_events=False):
    if is_events and not task.start:
        return False
    st = task.start
    en = task.end or st
    if not st:  # Если нет начала, задача не может быть в диапазоне
        return False
        
    if start_dt and en and en < start_dt:
        return False
    if end_dt and st and st > end_dt:
        return False
    return True


def delete_redundant_override(override, task):
    """Remove override if all data matches the parent task (start/end compare only time)."""
    fields = [
        'title', 'start', 'end', 'note', 'status_id', 'completed_at', 'color', 'priority_id', 'type_id'
    ]
    task_dict = task.to_dict()
    override_data = override.data or {}
    for field in fields:
        val_override = override_data.get(field)
        val_task = task_dict.get(field)
        if field in ('start', 'end'):
            if val_override and val_task:
                try:
                    t_override = datetime.fromisoformat(val_override.replace('Z', '')).time()
                    t_task = datetime.fromisoformat(val_task.replace('Z', '')).time()
                except Exception:
                    return False
                if t_override != t_task:
                    return False
            elif val_override != val_task:
                return False
        else:
            if val_override != val_task:
                return False
    db.session.delete(override)
    db.session.commit()
    return True


def get_calendar_events(start=None, end=None, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided")

    start_dt = _parse_iso_datetime(start) if start else None
    end_dt = _parse_iso_datetime(end) if end else None

    if start_dt and end_dt and start_dt > end_dt:
        raise ValueError("start date must not be after end date")

    load_options = [
        db.joinedload(Task.lists),
        db.joinedload(Task.status),
        db.joinedload(Task.priority),
        db.joinedload(Task.interval),
    ]

    current_app.logger.info(f'get_calendar_events {start_dt} {end_dt}')

    tasks_query = Task.query.options(*load_options).filter_by(user_id=user_id).all()
    events = []
    parent_tasks = []

    recurring_task_ids = [task.id for task in tasks_query if task.interval_id and task.start]

    current_app.logger.info(f'recurring_task_ids {recurring_task_ids}')
    current_app.logger.info(f'tasks_query {tasks_query}')

    if recurring_task_ids and start_dt and end_dt:
        overrides = TaskOverride.query.filter(
            TaskOverride.task_id.in_(recurring_task_ids),
            TaskOverride.date >= start_dt.date(),
            TaskOverride.date <= end_dt.date(),
            TaskOverride.user_id == user_id
        ).all()
    elif recurring_task_ids:
        overrides = TaskOverride.query.filter(
            TaskOverride.task_id.in_(recurring_task_ids),
            TaskOverride.user_id == user_id
        ).all()
    else:
        overrides = []
    override_map = {(o.task_id, o.date): o for o in overrides}

    for task in tasks_query:
        if task.interval_id and task.start:
            parent_tasks.append(task.to_dict())

            rule = task.build_rrule()
            if task.end and task.start:
                duration = task.end - task.start
                if duration.total_seconds() <= 0:
                    duration = timedelta(hours=1)
            else:
                duration = timedelta(hours=1)

            rng_start = start_dt or datetime.min.replace(tzinfo=None)
            rng_end = end_dt or datetime.max.replace(tzinfo=None)
            occurrences = rule.between(rng_start - duration, rng_end, inc=True) if rule else []

            for occ in occurrences:
                occ_end = occ + duration
                # occ_date = occ.date()
                occ_date = datetime(occ.year, occ.month, occ.day).date()


                override = override_map.get((task.id, occ_date))

                def build_instance(base_data, is_override=False, override_id=None):
                    instance = dict(base_data)
                    # Use start/end from override data if provided, otherwise fall back
                    start_val = base_data.get('start')
                    end_val = base_data.get('end')
                    instance['start'] = occ.isoformat() + 'Z'
                    instance['end'] = occ_end.isoformat() + 'Z'
                    instance['is_override'] = is_override
                    instance['parent_task_id'] = task.id
                    instance['is_instance'] = True
                    if override_id:
                        instance['override_id'] = override_id
                        instance['id'] = f"override_{override_id}"
                    else:
                        instance['id'] = f"instance_{task.id}_{occ_date.isoformat()}"
                    instance['range'] = {
                        'start': occ.isoformat() + 'Z' if occ else None,
                        'end': occ_end.isoformat() + 'Z' if occ_end else None,
                    }
                    return instance

                if override:
                    if delete_redundant_override(override, task):
                        events.append(build_instance(task.to_dict(), is_override=False))
                        continue
                    if override.type == 'skip':
                        continue
                    elif override.type == 'modified':
                        merged_data = {**task.to_dict(), **(override.data or {})}
                        events.append(build_instance(merged_data, is_override=True, override_id=override.id))
                        continue

                events.append(build_instance(task.to_dict(), is_override=False))
        else:
            if _is_task_in_range(task, start_dt, end_dt, is_events=True):
                events.append(task.to_dict())


    return {
        'events': events,
        'parent_tasks': parent_tasks
    }, 200


def get_task_override_by_id(override_id, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for get_task_override_by_id")
    override = TaskOverride.query.filter_by(id=override_id, user_id=user_id).first()
    if not override:
        return {'success': False, 'message': 'Override not found'}, 404
    return {'success': True, 'override': override.to_dict()}, 200


def patch_instance_handler(data, user_id):
    from datetime import datetime
    task_id = data.get('task_id') or data.get('parent_task_id')
    date_str = data.get('date')
    patch_data = data.get('data', {})
    if not (task_id and date_str):
        return {'success': False, 'message': 'task_id and date required'}, 400
    try:
        date = datetime.fromisoformat(date_str).date()
    except ValueError:
        return {'success': False, 'message': 'Invalid date format'}, 400
    parent_task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not parent_task:
        return {'success': False, 'message': 'Parent task not found'}, 404
    override = TaskOverride.query.filter_by(task_id=task_id, user_id=user_id, date=date).first()
    parent_data = parent_task.to_dict()
    # Только разрешённые поля (можно расширить список)
    allowed_fields = ['start', 'end', 'note', 'status_id', 'completed_at', 'color', 'priority_id', 'type_id']
    changed = {k: v for k, v in patch_data.items() if k in allowed_fields and parent_data.get(k) != v}
    # Обработка skip
    if patch_data.get('type') == 'skip':
        if override:
            override.type = 'skip'
            override.data = {}
            db.session.add(override)
            db.session.commit()
            return {'success': True, 'instance': {'parent_task_id': task_id, 'date': date_str, 'override_id': override.id, 'is_override': True, 'type': 'skip', 'data': {}}}, 200
        else:
            new_override = TaskOverride(task_id=task_id, user_id=user_id, date=date, type='skip', data={})
            db.session.add(new_override)
            db.session.commit()
            return {'success': True, 'instance': {'parent_task_id': task_id, 'date': date_str, 'override_id': new_override.id, 'is_override': True, 'type': 'skip', 'data': {}}}, 200
    # Если изменений нет — удалить override, если был
    if not changed:
        if override:
            db.session.delete(override)
            db.session.commit()
        return {'success': True, 'instance': {'parent_task_id': task_id, 'date': date_str, 'is_override': False, 'data': parent_data}}, 200
    if override:
        override.data = changed
        override.type = 'modified'
        db.session.add(override)
        db.session.commit()
        return {'success': True, 'instance': {'parent_task_id': task_id, 'date': date_str, 'override_id': override.id, 'is_override': True, 'type': 'modified', 'data': {**parent_data, **changed}}}, 200
    else:
        new_override = TaskOverride(task_id=task_id, user_id=user_id, date=date, type='modified', data=changed)
        db.session.add(new_override)
        db.session.commit()
        return {'success': True, 'instance': {'parent_task_id': task_id, 'date': date_str, 'override_id': new_override.id, 'is_override': True, 'type': 'modified', 'data': {**parent_data, **changed}}}, 200

