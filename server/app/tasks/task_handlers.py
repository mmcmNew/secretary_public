from flask import current_app
from datetime import datetime, timezone, timedelta

from .models import db, Task, Status, List, task_list_relations, task_subtasks_relations
from .calendar.models import TaskOverride
from .utils import _parse_iso_datetime, _is_task_in_range
import pytz


def get_tasks(list_id, client_timezone='UTC', start=None, end=None, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided")

    if list_id == 'events' or list_id == 'my_day':
        tz_name = client_timezone or 'UTC'
        current_app.logger.info(f'get_tasks: list_id: {list_id}, client_timezone: {tz_name}, start: {start}, end: {end}')
        try:
            tz = pytz.timezone(tz_name)
        except Exception:
            tz = pytz.UTC

        if not start and not end:
            now = datetime.now(tz)
            start_dt = tz.localize(datetime(now.year, now.month, now.day, 0, 0, 0)).astimezone(pytz.UTC)
            end_dt = tz.localize(datetime(now.year, now.month, now.day, 23, 59, 59, 999999)).astimezone(pytz.UTC)
            start = start_dt.isoformat()
            end = end_dt.isoformat()
        
        from .calendar.handlers import get_calendar_events
        calendar_data, _ = get_calendar_events(start, end, user_id=user_id)
        tasks = calendar_data.get('events', [])
        if list_id == 'my_day':
            parent_tasks = calendar_data.get('parent_tasks', [])
            my_day_tasks = calendar_data.get('events', [])
            tasks = parent_tasks + my_day_tasks
            # убрать из событий задачи с is_instance = true
            # current_app.logger.info(f'get_tasks: tasks_ids: {tasks}')
            tasks = [task for task in tasks if not task.get('is_instance', False)]
            # current_app.logger.info(f'get_tasks: tasks_result: {tasks}')
        
        return {'tasks': tasks}, 200

    from .models import Task
    from .calendar.models import TaskOverride
    tasks_data = []
    tz_name = client_timezone or 'UTC'
    try:
        tz = pytz.timezone(tz_name)
    except Exception:
        tz = pytz.UTC

    load_options = [
        db.joinedload(Task.lists),
        db.joinedload(Task.status),
        db.joinedload(Task.priority),
        db.joinedload(Task.interval),
    ]

    start_dt = _parse_iso_datetime(start) if start else None
    end_dt = _parse_iso_datetime(end) if end else None

    if list_id == 'all':
        tasks_query = Task.query.options(*load_options).filter_by(user_id=user_id).all()
    elif list_id == 'tasks':
        tasks_query = (
            Task.query.options(*load_options)
            .filter(
                Task.user_id == user_id,
                ~Task.lists.any(),
                ~Task.parent_tasks.any()
            )
            .all()
        )
        # current_app.logger.info(f'get_tasks: tasks_query: {tasks_query}')
    elif list_id == 'important':
        tasks_query = Task.query.options(*load_options).filter(Task.priority_id == 3, Task.user_id == user_id).all()
    elif list_id == 'background':
        tasks_query = Task.query.options(*load_options).filter(Task.is_background, Task.user_id == user_id).all()
    else:
        if not isinstance(list_id, int):
            try:
                list_id = int(list_id)
                tasks_query = (
                Task.query
                    .join(task_list_relations, Task.id == task_list_relations.c.TaskID)
                    .join(List, List.id == task_list_relations.c.ListID)
                    .filter(List.id == list_id, Task.user_id == user_id)
                    .options(*load_options)
                    .all()
                )
            except (TypeError, ValueError):
                return {'error': 'Invalid list_id'}, 400

    for task in tasks_query:
        tasks_data.append(task.to_dict())

    return {'tasks': tasks_data}, 200


def get_tasks_by_ids(task_ids, user_id=None):
    """Return tasks for given list of ids."""
    if user_id is None:
        raise ValueError("user_id must be provided for get_tasks_by_ids")

    if not task_ids:
        return {'tasks': []}, 200

    load_options = [
        db.joinedload(Task.lists),
        db.joinedload(Task.status),
        db.joinedload(Task.priority),
        db.joinedload(Task.interval),
    ]

    tasks = (
        Task.query.options(*load_options)
        .filter(Task.id.in_(task_ids), Task.user_id == user_id)
        .all()
    )
    return {'tasks': [t.to_dict() for t in tasks]}, 200


def add_task(data, user_id=None):
    current_app.logger.info(f'add_task: {data}')
    task_title = data.get('title', '')
    if user_id is None:
        raise ValueError("user_id must be provided for add_task")
    if not task_title or not task_title.strip():
        return {'success': False, 'message': 'Не передан title задачи'}, 400

    start = data.get('start', None)
    end = data.get('end', None)
    list_id = data.get('listId', 'tasks')
    priority_id = 1
    is_background = False
    updated_list_dict = {}

    if end:
        end = _parse_iso_datetime(end)
    if start:
        start = _parse_iso_datetime(start)

    match list_id:
        case 'my_day':
            end = datetime.now(timezone.utc) + timedelta(hours=2)
            start = datetime.now(timezone.utc) + timedelta(hours=1)
        case 'important':
            priority_id = 3
        case 'background':
            is_background = True

    new_task = Task(title=task_title, end=end, start=start, priority_id=priority_id,
                    is_background=is_background, user_id=user_id)
    db.session.add(new_task)

    if list_id and str(list_id).isdigit():
        from .models import List
        updated_list = List.query.filter_by(id=int(list_id), user_id=user_id).first()

        if updated_list:
            updated_list.tasks.append(new_task)
            updated_childes_order = updated_list.childes_order.copy() or []
            if new_task.id not in updated_childes_order:
                updated_childes_order.insert(0, new_task.id)
            updated_list.childes_order = updated_childes_order
            updated_list_dict = updated_list.to_dict()

            db.session.add(updated_list)

    db.session.commit()

    return {'success': True, 'message': 'Задача добавлена', 'task': new_task.to_dict(),
                'task_list': updated_list_dict}, 200


def add_subtask(data, user_id=None):
    task_title = data.get('title', '')
    parent_task_id = data.get('parentTaskId', None)

    if user_id is None:
        raise ValueError("user_id must be provided for add_subtask")

    if parent_task_id:
        parent_task = Task.query.filter_by(id=parent_task_id, user_id=user_id).first()
        if not parent_task:
            return {'success': False, 'message': 'Родительская задача не найдена'}, 404

        new_task = Task(title=task_title, user_id=user_id)

        db.session.add(new_task)
        db.session.commit()

        parent_task.childes_order = parent_task.childes_order or []

        updated_childes_order = parent_task.childes_order.copy()
        updated_childes_order.append(new_task.id)
        parent_task.childes_order = updated_childes_order
        parent_task.subtasks.append(new_task)

        db.session.add(parent_task)
        db.session.commit()

        return {'success': True, 'message': 'Подзадача добавлена', 'subtask': new_task.to_dict(),
                'parent_task': parent_task.to_dict()}, 200
    else:
        return {'success': False, 'message': 'Недостаточно данных для создания подзадачи'}, 404


def edit_task(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for edit_task")
    task_id = data.get('taskId')
    try:
        task_id = int(task_id)
    except (ValueError, TypeError):
        return {'success': False, 'message': 'Invalid task id'}, 400

    updated_fields = {key: value for key, value in data.items() if key not in ['taskId', 'subtasks', 'current_start']}

    current_app.logger.info(f'edit_task {updated_fields}')

    # Преобразуем все пустые строки в None для корректной записи в БД
    updated_fields = {k: (v if v != '' else None) for k, v in updated_fields.items()}

    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return {'success': False, 'message': 'Task not found'}, 404

    for key, value in updated_fields.items():
        if hasattr(task, key):
            if key in ['end', 'completed_at', 'start'] and value:
                value = _parse_iso_datetime(value)
            setattr(task, key, value)

    db.session.add(task)
    db.session.commit()
    return {'success': True, 'task': task.to_dict()}, 200


def change_task_status(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for change_task_status")
    task_id = data.get('taskId')
    status_id = data.get('status_id', 2)
    current_start_str = data.get('current_start')
    current_start = _parse_iso_datetime(current_start_str) if current_start_str else None

    task = Task.query.options(db.joinedload(Task.subtasks),
                              db.joinedload(Task.lists)).filter_by(id=task_id, user_id=user_id).first()
    status = db.session.get(Status, status_id)
    if not status:
        return {'success': False, 'message': 'Status not found'}, 400

    if not task:
        return {'success': False, 'message': 'Task not found'}, 404

    from .calendar.models import TaskOverride
    from datetime import date as dt_date

    if status_id == 2:
        completed_at = data.get('completed_at')
        if completed_at:
            completed_dt = _parse_iso_datetime(completed_at)
        else:
            completed_dt = datetime.now(timezone.utc)

        if task.interval_id and task.start:
            rule = task.build_rrule()
            base_start = current_start or task.start
            # Создаём override для этой даты
            override_date = base_start.date()
            override = TaskOverride.query.filter_by(task_id=task.id, date=override_date).first()
            if not override:
                override = TaskOverride(
                    task_id=task.id,
                    date=override_date,
                    type='modified',
                    data={
                        'status_id': 2,
                        'completed_at': completed_dt.isoformat() + 'Z'
                    }
                )
                db.session.add(override)
            else:
                override.type = 'modified'
                override.data = {**(override.data or {}), 'status_id': 2, 'completed_at': completed_dt.isoformat() + 'Z'}
                db.session.add(override)
                db.session.commit()
            # Не меняем основную задачу, только создаём override
            changed_ids = [task.id]
            result = {'success': True, 'task': 'all', 'changed_ids': changed_ids}
            return result, 200

        # Обычная задача (не повторяющаяся)
        task.status_id = 2
        task.completed_at = completed_dt
        set_subtask_status(task, status, completed_at)
        all_subtasks = collect_all_subtasks(task)
        changed_ids = [task.id] + [sub.id for sub in all_subtasks]
        result = {'success': True, 'task': 'all', 'changed_ids': changed_ids}
    else:
        task.status_id = status_id
        task.completed_at = None
        result = {'success': True, 'task': task.to_dict()}

    db.session.add(task)
    db.session.commit()
    return result, 200


def set_subtask_status(task, status, completed_at=None):
    all_subtasks = collect_all_subtasks(task)
    for subtask in all_subtasks:
        subtask.status = status
        if completed_at:
            subtask.completed_at = _parse_iso_datetime(completed_at)
        else:
            subtask.completed_at = datetime.now(timezone.utc)
    db.session.add_all(all_subtasks)


def collect_all_subtasks(root_task):
    """Собирает все подзадачи итеративно (глубина не ограничена)."""
    collected = []
    stack = [root_task]
    while stack:
        current = stack.pop()
        for sub in current.subtasks:
            collected.append(sub)
            stack.append(sub)
    return collected


def del_task(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for del_task")
    task_id = data.get('taskId')
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return {'error': 'Subtask not found'}, 404

    parent_tasks = Task.query.join(task_subtasks_relations, (Task.id == task_subtasks_relations.c.TaskID)).filter(
        task_subtasks_relations.c.SubtaskID == task_id, Task.user_id == user_id).all()

    for parent_task in parent_tasks:
        if task_id in parent_task.childes_order:
            childes_order = parent_task.childes_order.copy()
            childes_order.remove(task_id)
            parent_task.childes_order = childes_order
            db.session.add(parent_task)

    from sqlalchemy.dialects.postgresql import JSONB
    from sqlalchemy import cast
    lists = List.query.filter(List.childes_order.op('@>')(cast([task_id], JSONB)), List.user_id == user_id).all()

    for list_item in lists:
        if task_id in list_item.childes_order:
            childes_order = list_item.childes_order.copy()
            childes_order.remove(task_id)
            list_item.childes_order = childes_order
            db.session.add(list_item)

    db.session.commit()
    db.session.delete(task)
    db.session.commit()

    return {'success': True, 'message': 'Subtask deleted successfully'}, 200


def get_subtasks_by_parent_id(parent_task_id, user_id=None):
    """Возвращает подзадачи для задачи строго по порядку из childes_order."""
    if user_id is None:
        raise ValueError("user_id must be provided for get_subtasks_by_parent_id")
    parent_task = Task.query.filter_by(id=parent_task_id, user_id=user_id).first()
    if not parent_task:
        return {'success': False, 'message': 'Task not found'}, 404
    if not parent_task.childes_order:
        return {'subtasks': []}, 200
    subtasks = Task.query.filter(Task.id.in_(parent_task.childes_order), Task.user_id == user_id).all()
    subtasks_map = {t.id: t for t in subtasks}
    subtasks_sorted = [subtasks_map[tid] for tid in parent_task.childes_order if tid in subtasks_map]
    return {'subtasks': [t.to_dict() for t in subtasks_sorted]}, 200


def create_daily_scenario():
    tasks = Task.get_myday_tasks()
    scenario = {'name': 'Мой день', 'steps': []}
    tasks_titles = [task.title for task in tasks]

    # Добавление первого действия с перечислением всех задач
    actions = [{
        "type": "text",
        "text": f"На сегодня запланировано: {', '.join(tasks_titles)}" if tasks_titles
        else 'На сегодня ничего не запланировано'
    }]

    today = datetime.now()

    for task in tasks:
        # Установка времени начала, если оно отсутствует
        if not task.start:
            task.start = task.end - timedelta(minutes=30)

        # Применяем к сегодняшней дате время начала и окончания задачи
        start_today = datetime.combine(today.date(), task.start.time())
        deadline_today = datetime.combine(today.date(), task.end.time())

        # Создание таймера для времени начала задачи
        actions.append({
            "type": "timer",
            "name": f"Начало задачи: {task.title}",
            "endtime": start_today.isoformat() + 'Z',
            "time": []
        })

        # Создание таймера для времени завершения задачи
        actions.append({
            "type": "timer",
            "name": f"Завершение задачи: {task.title}",
            "endtime": deadline_today.isoformat() + 'Z',
            "time": []
        })

        # Добавляем опрос после завершения задачи
        actions.append({
            "type": "survey",
            "table_name": "diary",
            "text": "Давайте заполним результаты?",
            "fields": [
                {
                    "field_id": "reason",
                    "field_name": "Причина",
                    "check": "true"
                },
                {
                    "field_id": "comment",
                    "field_name": "Комментарий",
                    "check": "true"
                }
            ]
        })
        scenario['steps'].append({'name': task.title, 'actions': actions})
        actions = []

    return scenario