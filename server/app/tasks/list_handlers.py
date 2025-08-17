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
    import uuid

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
            func.count(Task.id).filter(and_(~Task.lists.any(), ~Task.parent_tasks.any(), Task.is_completed == False)).label('tasks_count'),
            func.count(Task.id).filter(and_(Task.is_important == True, Task.is_completed == False)).label('important_count'),
            func.count(Task.id).filter(and_(Task.is_background, Task.is_completed == False)).label('background_count')
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
            Task.is_important == True
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
            unfinished = len([t for t in my_day_tasks if not t.get('is_completed')])

        default_lists.append({
            'id': list_id,
            'title': title,
            'type': 'list',
            'unfinished_tasks_count': unfinished,
            'childes_order': task_ids
        })
    current_app.logger.info(f"PERF (user:{user_id}): Default lists processing took {time.perf_counter() - step_start_time:.4f}s.")
    # current_app.logger.info(f"PERF (user:{user_id}): Default lists: {default_lists}")
    step_start_time = time.perf_counter()
    
    # Функция для создания элемента без префиксов
    def create_item(item_dict):
        return {
            **item_dict,
        }
    
    # Преобразуем объекты в словари без префиксов
    groups_dict = []
    for group in groups_list:
        group_dict = {**group.to_dict(), 'unfinished_tasks_count': groups_unfinished_map.get(group.id, 0)}
        if 'lists' in group_dict:
            group_dict['lists'] = [create_item(lst) for lst in group_dict['lists']]
        groups_dict.append(create_item(group_dict))

    lists_dict = []
    for lst in lists_list:
        lst_dict = {**lst.to_dict(), 'unfinished_tasks_count': lst.unfinished_count}
        lists_dict.append(create_item(lst_dict))

    projects_dict = []
    for project in projects_list:
        project_dict = {**project.to_dict(), 'unfinished_tasks_count': sum(
            lists_unfinished_map.get(lst.id, 0) for lst in project.lists
        ) + sum(
            groups_unfinished_map.get(group.id, 0) for group in project.groups
        )}
        if 'lists' in project_dict:
            project_dict['lists'] = [create_item(lst) for lst in project_dict['lists']]
        if 'groups' in project_dict:
            project_dict['groups'] = [create_item(grp) for grp in project_dict['groups']]
            for group in project_dict['groups']:
                if 'lists' in group:
                    group['lists'] = [create_item(lst) for lst in group['lists']]
        projects_dict.append(create_item(project_dict))

    # --- Сортировка
    combined = groups_dict + lists_dict
    sorted_combined = sorted(combined, key=lambda x: x['order'])
    sorted_projects = sorted(projects_dict, key=lambda x: x['order'])
    current_app.logger.info(f"PERF (user:{user_id}): Final data structuring took {time.perf_counter() - step_start_time:.4f}s.")

    total_time = time.perf_counter() - start_time
    current_app.logger.info(f"PERF (user:{user_id}): get_lists_and_groups_data finished. Total time: {total_time:.4f}s.")
    # current_app.logger.info(f'Sorted combined lists: {sorted_combined}')
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
    list_id = data.get('listId')
    list_type = data.get('type')

    if not list_id or not list_type:
        return {'success': False, 'message': 'listId and type are required'}, 400
        
    updated_fields = {key: value for key, value in data.items() if key not in ['listId', 'type']}

    model_map = {
        'group': Group,
        'project': Project,
        'list': List
    }
    model = model_map.get(list_type)
    
    if not model:
        return {'success': False, 'message': f'Invalid type: {list_type}'}, 400

    updated_list = db.session.get(model, list_id)

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
    original_data = get_lists_and_groups_data(client_timezone, user_id)

    if isinstance(original_data, dict) and 'error' in original_data:
        return original_data

    def create_tree_node(root_id, item_id, parent_id, text, item_type, unfinished_count=0):
        return {
            'id': item_id,
            'parent': parent_id,
            'droppable': item_type in ['group', 'project'],
            'text': text,
            'data': {
                'type': item_type,
                'unfinished_tasks_count': unfinished_count,
                'rootId': root_id,
            }
        }

    # Стандартные списки
    default_lists = {
        'id': 'default',
        'name': 'Стандартные',
        'rootId': 'default',
        'data': []
    }
    default_lists['data'] = [
        create_tree_node(
            'default', item['id'], 'default', item['title'], 'standard', item.get('unfinished_tasks_count', 0)
        ) for item in original_data.get('default_lists', [])
    ]

    # Проекты с вложенными элементами (с сортировкой)
    projects_tree = {
        'id': 'projects',
        'name': 'Проекты',
        'rootId': 'projects',
        'data': []
    }
    projects_tree_data = []
    for proj in original_data.get('projects', []):
        proj_id = proj['id']  # ID уже содержит префикс из to_dict()
        projects_tree_data.append(create_tree_node(
            'projects', proj_id, 'projects', proj['title'], 'project', proj.get('unfinished_tasks_count', 0)
        ))
        
        # Сортируем элементы в проекте по childes_order
        childes_order = proj.get('childes_order', [])
        all_elements = {str(lst['id']): lst for lst in proj.get('lists', [])} | {grp['id']: grp for grp in proj.get('groups', [])}
        
        for element_id in childes_order:
            if element_id in all_elements:
                element = all_elements[element_id]
                if element.get('type') == 'group':
                    projects_tree_data.append(create_tree_node(
                        'projects', element_id, proj_id, element['title'], 'group', element.get('unfinished_tasks_count', 0)
                    ))
                    
                    # Сортируем элементы в группе по childes_order
                    group_childes_order = element.get('childes_order', [])
                    group_lists = {str(lst['id']): lst for lst in element.get('lists', [])}
                    
                    for list_id in group_childes_order:
                        if list_id in group_lists:
                            lst = group_lists[list_id]
                            projects_tree_data.append(create_tree_node(
                                'projects', str(lst['id']), element_id, lst['title'], 'list', lst.get('unfinished_tasks_count', 0)
                            ))
                else:
                    projects_tree_data.append(create_tree_node(
                        'projects', str(element['id']), proj_id, element['title'], 'list', element.get('unfinished_tasks_count', 0)
                    ))
    projects_tree['data'] = projects_tree_data

    # Отдельные списки и группы (уже отсортированы в get_lists_and_groups_data)
    lists_tree = {
        'id': 'lists',
        'name': 'Списки и группы',
        'rootId': 'lists',
        'data': []
    }
    lists_tree_data = []
    
    for item in original_data.get('lists', []):
        if item.get('project_id'):
            continue  # Уже обработано в проектах
            
        if item.get('type') == 'group' and not item.get('group_id'):
            group_id = item['id']  # ID уже содержит префикс из to_dict()
            lists_tree_data.append(create_tree_node(
                'lists', group_id, 'lists', item['title'], 'group', item.get('unfinished_tasks_count', 0)
            ))
            
            # Сортируем элементы в группе по childes_order
            group_childes_order = item.get('childes_order', [])
            group_lists = {str(lst['id']): lst for lst in item.get('lists', [])}
            
            for list_id in group_childes_order:
                if list_id in group_lists:
                    lst = group_lists[list_id]
                    lists_tree_data.append(create_tree_node(
                        'lists', str(lst['id']), group_id, lst['title'], 'list', lst.get('unfinished_tasks_count', 0), )
                    )
        elif item.get('type') == 'list' and not item.get('group_id'):
            lists_tree_data.append(create_tree_node(
                'lists', str(item['id']), 'lists', item['title'], 'list', item.get('unfinished_tasks_count', 0))
            )
    lists_tree['data'] = lists_tree_data
    
    result = [default_lists, projects_tree, lists_tree]
    # current_app.logger.info(f"get_lists_tree_data: Resulting tree structure: {result}")
    return result
