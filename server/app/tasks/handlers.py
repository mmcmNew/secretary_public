# to_do_app/handlers.py
from flask import current_app

from .models import *
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, literal
import pytz

from .calendar.handlers import get_calendar_events

# Helper to parse ISO datetime strings that may contain timezone information.
# All datetimes are converted to naive UTC before storing in the database so
# that `to_dict` produces values like ``YYYY-MM-DDTHH:MM:SSZ`` which the client
# expects.
def _parse_iso_datetime(value):
    if not value:
        return None
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt
from collections import defaultdict
# from dateutil.relativedelta import relativedelta


def get_unfinished_tasks_count_per_list(user_id):
    """
    Возвращает словарь: {list_id: unfinished_count} для всех списков пользователя.
    """
    results = (
        db.session.query(
            task_list_relations.c.ListID.label('list_id'),
            func.count(Task.id).label('unfinished_count')
        )
        .join(Task, Task.id == task_list_relations.c.TaskID)
        .filter(Task.status_id != 2, Task.user_id == user_id)
        .group_by(task_list_relations.c.ListID)
        .all()
    )
    return {row.list_id: row.unfinished_count for row in results}


def get_unfinished_tasks_count_per_group(user_id):
    """
    Возвращает словарь: {group_id: unfinished_count} для всех групп пользователя.
    """
    # Получаем соответствие: group_id -> [list_id, ...]
    from collections import defaultdict
    group_lists = defaultdict(list)
    group_list_rows = db.session.query(list_group_relations.c.GroupID, list_group_relations.c.ListID).all()
    for group_id, list_id in group_list_rows:
        group_lists[group_id].append(list_id)
    # Получаем количество незавершённых задач по спискам
    unfinished_per_list = get_unfinished_tasks_count_per_list(user_id)
    # Суммируем по группам
    unfinished_per_group = {}
    for group_id, lists in group_lists.items():
        unfinished_per_group[group_id] = sum(unfinished_per_list.get(list_id, 0) for list_id in lists)
    return unfinished_per_group


def get_unfinished_tasks_count_per_project(user_id):
    """
    Возвращает словарь: {project_id: unfinished_count} для всех проектов пользователя.
    """
    from collections import defaultdict
    # Получаем соответствие: project_id -> [list_id, ...] и project_id -> [group_id, ...]
    project_lists = defaultdict(list)
    project_groups = defaultdict(list)
    project_list_rows = db.session.query(list_project_relations.c.ProjectID, list_project_relations.c.ListID).all()
    for project_id, list_id in project_list_rows:
        project_lists[project_id].append(list_id)
    project_group_rows = db.session.query(group_project_relations.c.ProjectID, group_project_relations.c.GroupID).all()
    for project_id, group_id in project_group_rows:
        project_groups[project_id].append(group_id)
    # Получаем количество незавершённых задач по спискам и группам
    unfinished_per_list = get_unfinished_tasks_count_per_list(user_id)
    unfinished_per_group = get_unfinished_tasks_count_per_group(user_id)
    # Суммируем по проектам
    unfinished_per_project = {}
    for project_id in set(list(project_lists.keys()) + list(project_groups.keys())):
        count = sum(unfinished_per_list.get(list_id, 0) for list_id in project_lists.get(project_id, []))
        count += sum(unfinished_per_group.get(group_id, 0) for group_id in project_groups.get(project_id, []))
        unfinished_per_project[project_id] = count
    return unfinished_per_project


def get_lists_and_groups_data(client_timezone='UTC', user_id=None):
    from collections import defaultdict
    from sqlalchemy import func, case, and_, or_

    if user_id is None:
        raise ValueError("user_id must be provided for get_lists_and_groups_data")
    tz_name = client_timezone or 'UTC'
    try:
        tz = pytz.timezone(tz_name)
    except Exception:
        tz = pytz.UTC

    # Загружаем списки с предварительно посчитанными значениями
    lists = (
        db.session.query(List)
        .filter_by(user_id=user_id)
        .all()
    )
    
    # Используем сохраненные счетчики
    lists_unfinished_map = {lst.id: lst.unfinished_count for lst in lists}
    
    # Подсчет для групп через сумму счетчиков связанных списков
    groups_unfinished_map = {}
    for group in Group.query.filter_by(user_id=user_id):
        group_count = sum(lists_unfinished_map.get(lst.id, 0) for lst in group.lists)
        groups_unfinished_map[group.id] = group_count
        
    # Для специальных списков используем один запрос
    special_tasks_counts = (
        db.session.query(
            func.count(Task.id).filter(and_(~Task.lists.any(), ~Task.parent_tasks.any(), Task.status_id != 2)).label('tasks_count'),
            func.count(Task.id).filter(and_(Task.priority_id == 3, Task.status_id != 2)).label('important_count'),
            func.count(Task.id).filter(and_(Task.is_background, Task.status_id != 2)).label('background_count')
        )
        .filter(Task.user_id == user_id)
        .first()
    )
    
    default_lists_unfinished_map = {
        'tasks': special_tasks_counts.tasks_count,
        'important': special_tasks_counts.important_count,
        'background': special_tasks_counts.background_count
    }

    # Загружаем списки, группы и проекты
    lists_list = List.query.filter_by(user_id=user_id).all()
    groups_list = Group.query.filter_by(user_id=user_id).all()
    projects_list = Project.query.filter_by(user_id=user_id).all()

    # Получаем только ID задач для специальных списков через оптимизированные запросы
    # Получаем ID задач без списков
    tasks_without_lists_ids = [
        r.id for r in db.session.query(Task.id)
        .filter(
            Task.user_id == user_id,
            ~Task.lists.any(),
            ~Task.parent_tasks.any()
        )
        .order_by(Task.id.desc())
        .all()
    ]
    # current_app.logger.info(f'tasks_without_lists_ids: {tasks_without_lists_ids}')
    # Получаем ID важных задач
    important_tasks_ids = [
        r.id for r in db.session.query(Task.id)
        .filter(
            Task.user_id == user_id,
            Task.priority_id == 3
        )
        .order_by(Task.id.desc())
        .all()
    ]
    
    # Получаем ID фоновых задач
    background_tasks_ids = [
        r.id for r in db.session.query(Task.id)
        .filter(
            Task.user_id == user_id,
            Task.is_background
        )
        .order_by(Task.id.desc())
        .all()
    ]

    # Получаем задачи для "Мой день" с учетом таймзоны пользователя
    now = datetime.now(tz)
    # start_dt = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=tz).astimezone(pytz.UTC)
    # end_dt = datetime(now.year, now.month, now.day, 23, 59, 59, 999999, tzinfo=tz).astimezone(pytz.UTC)
    my_day_response, _ = get_tasks('my_day', client_timezone=tz_name, 
                                #  start=start_dt.isoformat(), 
                                #  end=end_dt.isoformat(), 
                                 user_id=user_id)
    my_day_tasks = my_day_response.get('tasks', [])

    # --- Default lists с использованием предварительно посчитанных значений
    default_lists = []
    for list_id, title, task_ids in [
        ('my_day', 'Мой день', [t.get('id') for t in my_day_tasks]),
        ('tasks', 'Задачи', tasks_without_lists_ids),
        ('important', 'Важные', important_tasks_ids),
        ('background', 'Фоновые задачи', background_tasks_ids),
    ]:
        unfinished = default_lists_unfinished_map.get(list_id, 0)
        if list_id == 'my_day':
            # Для "Мой день" по-прежнему нужны полные данные задач для подсчета незавершенных
            unfinished = len([t for t in my_day_tasks if t.get('status_id', 0) != 2])
        
        default_lists.append({
            'id': list_id,
            'title': title,
            'type': 'list',
            'children': [],
            'unfinished_tasks_count': unfinished,
            'childes_order': task_ids
        })

    # Преобразуем объекты в словари с подсчитанными значениями
    groups_dict = [
        {**group.to_dict(), 'unfinished_tasks_count': groups_unfinished_map.get(group.id, 0)}
        for group in groups_list
    ]

    lists_dict = [
        {**lst.to_dict(), 'unfinished_tasks_count': lst.unfinished_count}
        for lst in lists_list
    ]

    projects_dict = [
        {**project.to_dict(), 'unfinished_tasks_count': sum(
            lists_unfinished_map.get(lst.id, 0) for lst in project.lists
        ) + sum(
            groups_unfinished_map.get(group.id, 0) for group in project.groups
        )}
        for project in projects_list
    ]

    # --- Сортировка
    combined = groups_dict + lists_dict
    sorted_combined = sorted(combined, key=lambda x: x['order'])
    sorted_projects = sorted(projects_dict, key=lambda x: x['order'])

    return {
        'lists': sorted_combined,
        'projects': sorted_projects,
        'default_lists': default_lists
    }


def get_tasks(list_id, client_timezone='UTC', start=None, end=None, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided")

    if list_id == 'events' or list_id == 'my_day':
        tz_name = client_timezone or 'UTC'
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


def _is_task_in_range(task, start_dt, end_dt, is_events=False):
    if is_events and not task.start:
        return False
    st = task.start
    en = task.end or st
    if start_dt and en and en < start_dt:
        return False
    if end_dt and st and st > end_dt:
        return False
    return True


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


def add_object(data, user_id=None):
    object_type = data.get('type', '')
    object_order = data.get('order', -1)

    if user_id is None:
        raise ValueError("user_id must be provided for add_object")      
    
    # Устанавливаем дефолтные названия если title пустой
    object_title = data.get('title', '').strip()
    if not object_title:
        default_names = {'list': 'Новый список', 'group': 'Новая группа', 'project': 'Новый проект'}
        object_title = default_names.get(object_type, 'Новый объект')

    match object_type:
        case 'list':
            new_object = List(title=object_title, order=object_order, user_id=user_id)
        case 'group':
            new_object = Group(title=object_title, order=object_order, user_id=user_id)
        case 'project':
            new_object = Project(title=object_title, order=object_order, user_id=user_id)
        case _:
            return {'success': False, 'message': 'Неизвестный тип объекта'}, 404

    db.session.add(new_object)
    db.session.commit()

    return {'success': True, 'message': 'Объект добавлен', 'object_type': object_type,
            'new_object': new_object.to_dict()}, 200


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


def edit_list(data, user_id=None):
    current_app.logger.info(f'edit_list: data: {data}')
    if user_id is None:
        raise ValueError("user_id must be provided for edit_list")
    if not isinstance(data, dict):
        current_app.logger.error(f'edit_list: Expected dict, got {type(data)}: {data}')
        return {'success': False, 'message': 'Invalid data format'}, 400
    list_id = data.get('listId', None)
    if not list_id:
        return {'success': False, 'message': 'Недостаточно данных для редактирования списка'}, 404
    updated_fields = {key: value for key, value in data.items() if key != 'listId'}

    if str(list_id).startswith('group'):
        updated_list = Group.query.get(list_id.replace('group_', ''))
    elif str(list_id).startswith('project'):
        updated_list = Project.query.get(list_id.replace('project_', ''))
    else:
        updated_list = List.query.get(list_id)

    if not updated_list:
        return {'success': False, 'message': 'List not found'}, 404

    for key, value in updated_fields.items():
        # print(f'key: {key}, value: {value}')
        if hasattr(updated_list, key):
            if key in ['end', 'completed_at'] and value:
                value = _parse_iso_datetime(value)
            setattr(updated_list, key, value)

    db.session.add(updated_list)
    db.session.commit()
    return {'success': True, 'updated_list': updated_list.to_dict()}, 200


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
    status = Status.query.get(status_id)

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

    lists = List.query.filter(List.childes_order.contains([task_id]), List.user_id == user_id).all()

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


def link_group_list(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for link_group_list")
    try:
        source_id = data['source_id']
        target_id = data['target_id']

        if str(source_id).startswith('group_'):
            source = Group.query.filter_by(id=int(source_id.split('_')[1]), user_id=user_id).first()
        elif str(source_id).startswith('project_'):
            source = Project.query.filter_by(id=int(source_id.split('_')[1]), user_id=user_id).first()
        else:
            source = List.query.filter_by(id=int(source_id), user_id=user_id).first()

        if str(target_id).startswith('group_'):
            target = Group.query.filter_by(id=int(target_id.split('_')[1]), user_id=user_id).first()
            if isinstance(source, List):
                if target and target not in source.groups:
                    source.groups.append(target)
            elif isinstance(source, Group):
                if target and target not in source.projects:
                    source.projects.append(target)
        elif str(target_id).startswith('project_'):
            target = Project.query.filter_by(id=int(target_id.split('_')[1]), user_id=user_id).first()
            if isinstance(source, List):
                if target and target not in source.projects:
                    source.projects.append(target)
            elif isinstance(source, Group):
                if target and target not in source.projects:
                    source.projects.append(target)
        else:
            return {"error": "Invalid target ID"}, 400

        # Добавляем элемент в конец списка детей
        if target and source:
            if source_id not in target.childes_order:
                updated_childes_order = target.childes_order.copy()
                updated_childes_order.append(source_id)
                target.childes_order = updated_childes_order

            db.session.add(target)
            db.session.add(source)
            db.session.commit()

        return {"success": True}, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'link_group_list: {e}')
        return {"error": str(e)}, 500


def delete_from_childes(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for delete_from_childes")
    # print(f'delete_from_childes: data: {data}')
    try:
        source_id = data['source_id']
        group_id = data.get('group_id', None)

        # print(f'delete_from_childes: source_id: {source_id}, target_id: {group_id}')

        if group_id in ['my_day', 'tasks', 'important', 'all', 'events']:
            return {"success": True}, 200

        if str(source_id).startswith('task_'):
            source = Task.query.filter_by(id=int(source_id.split('_')[1]), user_id=user_id).first()
        elif str(source_id).startswith('group_'):
            source = Group.query.filter_by(id=int(source_id.split('_')[1]), user_id=user_id).first()
        else:
            source = List.query.filter_by(id=int(source_id), user_id=user_id).first()

        if (isinstance(source, List) or isinstance(source, Group) or isinstance(source, Project)) and group_id is None:
            source.in_general_list = False
            db.session.add(source)
            db.session.commit()
            return {"success": True}, 200

        if str(group_id).startswith('task_'):
            group = Task.query.filter_by(id=int(group_id.split('_')[1]), user_id=user_id).first()
        elif str(group_id).startswith('group_'):
            group = Group.query.filter_by(id=int(group_id.split('_')[1]), user_id=user_id).first()
        elif str(group_id).startswith('project_'):
            group = Project.query.filter_by(id=int(group_id.split('_')[1]), user_id=user_id).first()
        else:
            group = List.query.filter_by(id=int(group_id), user_id=user_id).first()

        if source and group:
            # Удаление элемента из списка детей
            if isinstance(source, Task):
                source_id_int = int(source_id.split('_')[1])
            if source_id_int in group.childes_order:
                updated_childes_order = group.childes_order.copy()
                updated_childes_order.remove(source_id_int)
                group.childes_order = updated_childes_order

            # Разрыв связи между source и group
            if isinstance(source, Task):
                if group in source.lists:
                    source.lists.remove(group)
                elif group in source.parent_tasks:
                    source.parent_tasks.remove(group)
            elif isinstance(source, List):
                if group in source.groups:
                    source.groups.remove(group)
                elif group in source.projects:
                    source.projects.remove(group)
            elif isinstance(source, Group):
                if group in source.projects:
                    source.projects.remove(group)

            db.session.add(group)
            db.session.add(source)
            db.session.commit()

        return {"success": True}, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return {"error": str(e)}, 500


def link_task(data, user_id=None):
    if user_id is None:
        raise ValueError("user_id must be provided for link_task")
    try:
        task_id = data['task_id']
        target_id = data['list_id']
        action = data.get('action', 'link')
        source_list_id = data.get('source_list_id')

        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if str(target_id).startswith('task_'):
            if task_id == int(target_id.split('_')[1]) or task in task.parent_tasks or task in task.subtasks:
                return {"error": "Task cannot be linked to itself"}, 400
            target = Task.query.filter_by(id=int(target_id.split('_')[1]), user_id=user_id).first()
            if task and target and task_id not in [t.id for t in target.subtasks]:
                task.parent_tasks.append(target)
        else:
            target = List.query.filter_by(id=int(target_id), user_id=user_id).first()
            if task and target and task_id not in [t.id for t in target.tasks]:
                task.lists.append(target)
        if target and task and task_id not in target.childes_order:
            updated_childes_order = target.childes_order.copy() or []
            updated_childes_order.append(task_id)
            target.childes_order = updated_childes_order

        db.session.add(target)
        db.session.add(task)
        db.session.commit()

        if action == 'move' and source_list_id:
            delete_from_childes({'source_id': f'task_{task_id}', 'group_id': source_list_id}, user_id=user_id)

        return {"success": True}, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'link_task: Error {e}')
        return {"error": str(e)}, 500


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
