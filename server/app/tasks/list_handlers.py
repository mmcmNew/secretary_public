from flask import current_app
import time
from datetime import datetime
import pytz

from .models import db, List, Group, Project, Task
from sqlalchemy import func, and_
from .calendar.handlers import get_calendar_events
from .utils import _parse_iso_datetime
from .task_handlers import get_tasks


def get_lists_and_groups_data(client_timezone='UTC', user_id=None):
    start_time = time.perf_counter()
    current_app.logger.info(f"PERF (user:{user_id}): get_lists_and_groups_data started.")
    from collections import defaultdict
    from sqlalchemy import func, case, and_, or_

    if user_id is None:
        raise ValueError("user_id must be provided for get_lists_and_groups_data")
    tz_name = client_timezone or 'UTC'
    try:
        tz = pytz.timezone(tz_name)
    except Exception:
        tz = pytz.UTC

    step_start_time = time.perf_counter()
    # Загружаем списки с предварительно посчитанными значениями
    lists = (
        db.session.query(List)
        .filter_by(user_id=user_id)
        .all()
    )
    current_app.logger.info(f"PERF (user:{user_id}): Query all lists took {time.perf_counter() - step_start_time:.4f}s.")

    step_start_time = time.perf_counter()
    # Используем сохраненные счетчики
    lists_unfinished_map = {lst.id: lst.unfinished_count for lst in lists}

    # Подсчет для групп через сумму счетчиков связанных списков
    groups_unfinished_map = {}
    groups_list = Group.query.filter_by(user_id=user_id).all()
    for group in groups_list:
        group_count = sum(lists_unfinished_map.get(lst.id, 0) for lst in group.lists)
        groups_unfinished_map[group.id] = group_count
    current_app.logger.info(f"PERF (user:{user_id}): Calculate group counters took {time.perf_counter() - step_start_time:.4f}s.")

    step_start_time = time.perf_counter()
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
    current_app.logger.info(f"PERF (user:{user_id}): Query special task counts took {time.perf_counter() - step_start_time:.4f}s.")

    default_lists_unfinished_map = {
        'tasks': special_tasks_counts.tasks_count,
        'important': special_tasks_counts.important_count,
        'background': special_tasks_counts.background_count
    }

    # Загружаем списки, группы и проекты
    step_start_time = time.perf_counter()
    lists_list = lists  # Re-use already queried lists
    projects_list = Project.query.filter_by(user_id=user_id).all()
    current_app.logger.info(f"PERF (user:{user_id}): Query projects took {time.perf_counter() - step_start_time:.4f}s.")
    # Получаем только ID задач для специальных списков через оптимизированные запросы
    step_start_time = time.perf_counter()
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
    current_app.logger.info(f"PERF (user:{user_id}): Query tasks_without_lists_ids took {time.perf_counter() - step_start_time:.4f}s.")
    step_start_time = time.perf_counter()
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
    current_app.logger.info(f"PERF (user:{user_id}): Query important_tasks_ids took {time.perf_counter() - step_start_time:.4f}s.")
    step_start_time = time.perf_counter()
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
    current_app.logger.info(f"PERF (user:{user_id}): Query background_tasks_ids took {time.perf_counter() - step_start_time:.4f}s.")

    step_start_time = time.perf_counter()
    # Получаем задачи для "Мой день" с учетом таймзоны пользователя
    now = datetime.now(tz)
    # start_dt = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=tz).astimezone(pytz.UTC)
    # end_dt = datetime(now.year, now.month, now.day, 23, 59, 59, 999999, tzinfo=tz).astimezone(pytz.UTC)
    my_day_response, _ = get_tasks('my_day', client_timezone=tz_name,
                                #  start=start_dt.isoformat(),
                                #  end=end_dt.isoformat(),
                                 user_id=user_id)
    my_day_tasks = my_day_response.get('tasks', [])
    current_app.logger.info(f"PERF (user:{user_id}): Get 'My Day' tasks took {time.perf_counter() - step_start_time:.4f}s.")

    # --- Default lists с использованием предварительно посчитанных значений
    default_lists = []
    for list_id, title, task_ids in [
        ('my_day', 'Мой день', [t.get('id') for t in my_day_tasks if t.get('id')]),
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
            'unfinished_tasks_count': unfinished,
            'childes_order': task_ids
        })
    current_app.logger.info(f"PERF (user:{user_id}): Default lists processing took {time.perf_counter() - step_start_time:.4f}s.")
    current_app.logger.info(f"PERF (user:{user_id}): Default lists: {default_lists}")
    step_start_time = time.perf_counter()
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
    current_app.logger.info(f"PERF (user:{user_id}): Final data structuring took {time.perf_counter() - step_start_time:.4f}s.")

    total_time = time.perf_counter() - start_time
    current_app.logger.info(f"PERF (user:{user_id}): get_lists_and_groups_data finished. Total time: {total_time:.4f}s.")
    return {
        'lists': sorted_combined,
        'projects': sorted_projects,
        'default_lists': default_lists
    }


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
        updated_list = db.session.get(Group, list_id.replace('group_', ''))
    elif str(list_id).startswith('project'):
        updated_list = db.session.get(Project, list_id.replace('project_', ''))
    else:
        updated_list = db.session.get(List, list_id)

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


def get_lists_tree_data(client_timezone='UTC', user_id=None):
    """
    Получение данных списков в формате, подходящем для react-complex-tree.
    Возвращает данные в порядке: default_lists, projects, общий список групп и списков.
    
    Возвращает структуру:
    {
        'default_lists': [...],
        'projects': [...],
        'lists': [...]  // общий список групп и списков
    }
    """
    # Получаем исходные данные
    original_data = get_lists_and_groups_data(client_timezone, user_id)
    
    if isinstance(original_data, dict) and 'error' in original_data:
        return original_data
    
    # Добавляем параметры для контекстного меню в default_lists
    default_lists = []
    for item in original_data.get('default_lists', []):
        default_lists.append({
            **item,
            'hasContextMenu': False,  # Default lists don't have context menu
            'contextMenuType': 'default_lists',
            'itemType': 'default_list'
        })
    
    # Добавляем параметры для контекстного меню в projects
    projects = []
    for item in original_data.get('projects', []):
        projects.append({
            **item,
            'hasContextMenu': True,  # Projects have context menu
            'contextMenuType': 'project',
            'itemType': 'project'
        })
    
    # Общий список групп и списков с параметрами для контекстного меню
    lists = []
    for item in original_data.get('lists', []):
        if item.get('type') == 'group':
            lists.append({
                **item,
                'hasContextMenu': True,  # Groups have context menu
                'contextMenuType': 'group',
                'itemType': 'group'
            })
        else:
            lists.append({
                **item,
                'hasContextMenu': True,  # Lists have context menu
                'contextMenuType': 'list',
                'itemType': 'list'
            })
    
    # Преобразуем данные в формат react-complex-tree
    def convert_to_tree_format(items, parent_id=None):
        tree_items = {}
        for item in items:
            # Создаем элемент дерева
            tree_items[str(item['id'])] = {
                'index': str(item['id']),
                'data': {
                    'title': item['title'],
                    'type': item.get('type', 'list'),
                    'unfinished_tasks_count': item.get('unfinished_tasks_count', 0),
                    'hasContextMenu': item.get('hasContextMenu', False),
                    'contextMenuType': item.get('contextMenuType', ''),
                    'itemType': item.get('itemType', 'list')
                },
                'canMove': True,
                'canRename': True,
                'children': [str(child_id) for child_id in item.get('childes_order', [])] if item.get('childes_order') else []
            }
            
            # Рекурсивно обрабатываем детей, если они есть
            if item.get('childes_order'):
                # Находим детей по их id
                children = [child for child in items if child['id'] in item['childes_order']]
                child_tree_items = convert_to_tree_format(children, str(item['id']))
                tree_items.update(child_tree_items)
                
        return tree_items
    
    # Преобразуем каждый тип данных
    tree_data = {
        'default_lists': convert_to_tree_format(default_lists),
        'projects': convert_to_tree_format(projects),
        'lists': convert_to_tree_format(lists)
    }
    
    return tree_data