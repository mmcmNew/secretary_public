# to_do_app/handlers.py
from flask import current_app, jsonify

from .models import *
from flask_jwt_extended import current_user
from datetime import datetime, timezone, timedelta
from collections import defaultdict
# from dateutil.relativedelta import relativedelta


def get_lists_and_groups_data(client_timezone=0):
    user_id = current_user.id
    groups_list = Group.query.filter_by(user_id=user_id).all()
    lists_list = List.query.filter_by(user_id=user_id).all()
    projects_list = Project.query.filter_by(user_id=user_id).all()

    tasks = Task.query.options(db.joinedload(Task.lists)).filter_by(user_id=user_id).all()
    tasks_map = {task.id: task for task in tasks}

    client_timezone = int(client_timezone)

    default_lists = []
    my_day_tasks = Task.get_myday_tasks(client_timezone)

    # ==== Default lists из уже полученных задач ====
    tasks_without_lists = [task for task in tasks if not task.lists]
    important_tasks = [task for task in tasks if task.priority_id == 3]
    background_tasks = [task for task in tasks if task.is_background]

    for list_id, title, task_list in [
        ('my_day', 'Мой день', my_day_tasks),
        ('tasks', 'Задачи', tasks_without_lists),
        ('important', 'Важные', important_tasks),
        ('background', 'Фоновые задачи', background_tasks),
    ]:
        default_lists.append({
            'id': list_id,
            'title': title,
            'type': 'list',
            'children': [],
            'unfinished_tasks_count': sum(1 for task in task_list if task.status_id != 2),
            'childes_order': [task.id for task in task_list]
        })

    # ==== Подсчёт unfinished по спискам ====
    unfinished_per_list = defaultdict(int)
    for lst in lists_list:
        for task_id in lst.childes_order:
            task = tasks_map.get(task_id)
            if task and task.status_id != 2:  # Проверяем что задача незавершена
                # Считаем unfinished не только для текущего списка, но и для всех списков задачи
                for list_ in task.lists:
                    unfinished_per_list[list_.id] += 1

    # ==== Подсчёт unfinished по группам ====
    unfinished_per_group = defaultdict(int)
    for group in groups_list:
        for list_id in group.childes_order:
            unfinished_per_group[group.id] += unfinished_per_list.get(list_id, 0)

    # ==== Подсчёт unfinished по проектам ====
    unfinished_per_project = defaultdict(int)
    for project in projects_list:
        # Считаем незавершённые задачи из списков проекта
        for lst in project.lists:
            unfinished_per_project[project.id] += unfinished_per_list.get(lst.id, 0)
        # Считаем незавершённые задачи из групп проекта
        for group in project.groups:
            unfinished_per_project[project.id] += unfinished_per_group.get(group.id, 0)

    # ==== Генерация словарей ====
    groups_dict = []
    for group in groups_list:
        d = group.to_dict()
        d['unfinished_tasks_count'] = unfinished_per_group.get(group.id, 0)
        groups_dict.append(d)

    lists_dict = []
    for lst in lists_list:
        d = lst.to_dict()
        d['unfinished_tasks_count'] = unfinished_per_list.get(lst.id, 0)
        lists_dict.append(d)

    projects_dict = []
    for project in projects_list:
        d = project.to_dict()
        d['unfinished_tasks_count'] = unfinished_per_project.get(project.id, 0)
        projects_dict.append(d)

    combined = groups_dict + lists_dict
    sorted_combined = sorted(combined, key=lambda x: x['order'])
    sorted_projects = sorted(projects_dict, key=lambda x: x['order'])

    return {
        'lists': sorted_combined,
        'projects': sorted_projects,
        'default_lists': default_lists
    }


def get_tasks(list_id, client_timezone=0):
    # start_time = datetime.now(timezone.utc)
    tasks_data = []
    user_id = current_user.id
    client_timezone = int(client_timezone)
    seen_tasks = set()  # Множество для отслеживания уникальных идентификаторов задач
    load_options = [db.joinedload(Task.lists),
                    db.joinedload(Task.subtasks),
                    db.joinedload(Task.type),
                    db.joinedload(Task.status),
                    db.joinedload(Task.priority),
                    db.joinedload(Task.interval),
                    ]

    match list_id:
        case 'my_day':
            tasks_query = [t for t in Task.get_myday_tasks(client_timezone) if t.user_id == user_id]
        case 'tasks':
            tasks_query = Task.query.options(*load_options).filter(~Task.lists.any(), Task.user_id == user_id).all()
        case 'important':
            tasks_query = Task.query.options(*load_options).filter(Task.priority_id == 3, Task.user_id == user_id).all()
        case 'background':
            tasks_query = Task.query.options(*load_options).filter(Task.is_background, Task.user_id == user_id).all()
        case 'all':
            tasks_query = Task.query.options(*load_options).filter_by(user_id=user_id).all()
        case 'events':
            tasks_query = Task.query.options(*load_options).filter_by(user_id=user_id).all()
        case _:
            tasks_query = (
                Task.query
                .join(task_list_relations, Task.id == task_list_relations.c.TaskID)
                .join(List, List.id == task_list_relations.c.ListID)
                .filter(List.id == list_id, Task.user_id == user_id)
                .options(*load_options)
                .all()
            )

    # current_app.logger.info(f'get_tasks: total_time_query: {datetime.now(timezone.utc) - start_time}')

    def collect_subtasks(task):
        """Рекурсивно собирает все подзадачи данной задачи."""
        subtasks = []
        if task.id not in seen_tasks:
            seen_tasks.add(task.id)
            subtasks.append(task.to_dict())
            for subtask in task.subtasks:
                subtasks.extend(collect_subtasks(subtask))
        return subtasks

    # Сбор всех задач и их подзадач
    for task in tasks_query:
        tasks_data.extend(collect_subtasks(task))

    # end_time = datetime.now(timezone.utc)
    # total_time = end_time - start_time
    # current_app.logger.info(f'get_tasks: start_time: {start_time}, end_time: {end_time},'
    #                         f'total_time: {total_time}')
    return {'tasks': tasks_data}, 200


def add_object(data):
    object_type = data.get('type', '')
    object_order = data.get('order', -1)
    
    # Устанавливаем дефолтные названия если title пустой
    object_title = data.get('title', '').strip()
    if not object_title:
        default_names = {'list': 'Новый список', 'group': 'Новая группа', 'project': 'Новый проект'}
        object_title = default_names.get(object_type, 'Новый объект')

    user_id = current_user.id
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


def add_task(data):
    task_title = data.get('title', '')
    start = data.get('start', None)
    end = data.get('end', None)
    list_id = data.get('listId', 'tasks')
    priority_id = 1
    # current_app.logger.info(f'add_task: data: {data}')
    is_background = False
    if end:
        end = datetime.fromisoformat(end)
    if start:
        start = datetime.fromisoformat(start)
    if list_id == 'my_day':
        end = datetime.now(timezone.utc) + timedelta(hours=2)
        start = datetime.now(timezone.utc) + timedelta(hours=1)
    if list_id == 'important':
        priority_id = 3
    if list_id == 'background':
        is_background = True

    task_list_dict = {}

    if list_id:
        new_task = Task(title=task_title, end=end, start=start, priority_id=priority_id,
                        is_background=is_background, user_id=current_user.id)
        task_list = List.query.filter_by(id=list_id, user_id=current_user.id).first()

        db.session.add(new_task)

        if task_list:
            task_list.tasks.append(new_task)
            updated_childes_order = task_list.childes_order.copy() or []
            # добавляем id задачи в начало списка childes_order
            if new_task.id not in updated_childes_order:
                updated_childes_order.insert(0, new_task.id)
            task_list.childes_order = updated_childes_order
            task_list_dict = task_list.to_dict()

            db.session.add(task_list)

        db.session.commit()

        return {'success': True, 'message': 'Задача добавлена', 'task': new_task.to_dict(),
                'task_list': task_list_dict}, 200
    else:
        return {'success': False, 'message': 'Недостаточно данных для создания задачи'}, 404


def edit_list(data):
    current_app.logger.info(f'edit_list: data: {data}')
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
                value = datetime.fromisoformat(value)
            setattr(updated_list, key, value)

    db.session.add(updated_list)
    db.session.commit()
    return {'success': True, 'updated_list': updated_list.to_dict()}, 200


def add_subtask(data):
    task_title = data.get('title', '')
    list_id = data.get('listId', None)
    parent_task_id = data.get('parentTaskId', None)

    if parent_task_id:
        parent_task = Task.query.filter_by(id=parent_task_id, user_id=current_user.id).first()
        if not parent_task:
            return {'success': False, 'message': 'Родительская задача не найдена'}, 404

        new_task = Task(title=task_title, user_id=current_user.id)
        if list_id:
            task_list = List.query.filter_by(id=list_id, user_id=current_user.id).first()
            if task_list:
                new_task.lists.append(task_list)

        db.session.add(new_task)
        db.session.commit()

        parent_task.childes_order = parent_task.childes_order or []

        updated_childes_order = parent_task.childes_order.copy()
        updated_childes_order.append(new_task.id)
        parent_task.childes_order = updated_childes_order
        parent_task.subtasks.append(new_task)

        db.session.add(parent_task)
        db.session.commit()

        return {'success': True, 'message': 'Подзадача добавлена', 'new_object': new_task.to_dict(),
                'parent_task': parent_task.to_dict()}, 200
    else:
        return {'success': False, 'message': 'Недостаточно данных для создания подзадачи'}, 404


def edit_task(data):
    # current_app.logger.info(f'edit_task: data: {data}')
    task_id = data.get('taskId')
    updated_fields = {key: value for key, value in data.items() if key not in ['taskId', 'subtasks']}

    # print(f'edit_task: updated_fields: {updated_fields}')

    task = Task.query.get(task_id)

    if not task:
        return {'success': False, 'message': 'Task not found'}, 404

    for key, value in updated_fields.items():
        if hasattr(task, key):
            if key in ['end', 'completed_at', 'start'] and value:
                # print(f'key: {key}, value: {value}')
                value = datetime.fromisoformat(value)
            setattr(task, key, value)

    db.session.add(task)
    db.session.commit()
    return {'success': True, 'task': task.to_dict()}, 200


def change_task_status(data):
    task_id = data.get('taskId')
    status_id = data.get('status_id', 2)

    task = Task.query.options(db.joinedload(Task.subtasks)).get(task_id)
    status = Status.query.get(status_id)

    if not task:
        return {'success': False, 'message': 'Task not found'}, 404

    if status_id == 2:
        task.status_id = 2
        completed_at = data.get('completed_at')
        if completed_at:
            task.completed_at = datetime.fromisoformat(completed_at)
        else:
            task.completed_at = datetime.now(timezone.utc)
        set_subtask_status(task, status, completed_at)
        result = {'success': True, 'task': 'all'}
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
            subtask.completed_at = datetime.fromisoformat(completed_at)
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


def get_anti_schedule():
    anti_schedule = AntiTask.get_anti_schedule(current_user.id)
    return {'anti_schedule': anti_schedule}, 200


def add_anti_task(data):
    # print(f'add_anti_task: data: {data}')
    title = data.get('title').strip()
    start = data.get('start')
    end = data.get('end')
    updated_fields = {key: value for key, value in data.items() if key not in ['taskId', 'id', 'subtasks', 'start',
                                                                               'end', 'title', 'type']}

    if start and end and title:
        start = datetime.fromisoformat(start)
        end = datetime.fromisoformat(end)
        anti_task = AntiTask(title=title, start=start, end=end, user_id=current_user.id)
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
    anti_task = AntiTask.query.get(anti_task_id)
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

    anti_task = AntiTask.query.get(anti_task_id)

    if not anti_task:
        return {'success': False, 'message': 'Task not found'}, 404

    for key, value in updated_fields.items():
        if hasattr(anti_task, key):
            if key in ['end', 'start'] and value:
                value = datetime.fromisoformat(value)
            setattr(anti_task, key, value)

    db.session.add(anti_task)
    db.session.commit()
    return {'success': True, 'task': anti_task.to_dict()}, 200


# def upgrade_task_interval(task, interval_id, status_id):
#     sign = 1 if status_id == 2 else -1
#     # print(f'upgrade_task_interval: task: {task}, interval_id: {interval_id}, status_id: {status_id}')
#     try:
#         match interval_id:
#             case 1:  # Daily
#                 delta = timedelta(days=1 * sign)
#                 task.start += delta
#                 task.deadline += delta
#             case 2:  # Weekly
#                 delta = timedelta(weeks=1 * sign)
#                 task.start += delta
#                 task.deadline += delta
#             case 3:  # Monthly
#                 task.start += relativedelta(months=1 * sign)
#                 task.deadline += relativedelta(months=1 * sign)
#                 # print(f'upgrade_task_interval: task.start: {task.start}, task.deadline: {task.deadline}')
#             case 4:  # Yearly
#                 task.start += relativedelta(years=1 * sign)
#                 task.deadline += relativedelta(years=1 * sign)
#             case 5:  # Workdays (Monday to Friday)
#                 while True:
#                     task.start += timedelta(days=sign)
#                     task.deadline += timedelta(days=sign)
#                     if task.start.weekday() < 5 and task.deadline.weekday() < 5:
#                         break
#
#         if status_id != 2:
#             task.status = Status.query.get(status_id)
#
#         db.session.add(task)
#         result = {'success': True, 'task': task.to_dict()}
#     except Exception as e:
#         current_app.logger.error(f'Ошибка при обновлении интервала задачи {e}')
#         result = {'success': False, 'message': f'Ошибка при обновлении интервала задачи {e}'}
#
#     return result


def del_task(data):
    task_id = data.get('taskId')
    task = Task.query.get(task_id)

    if not task:
        return {'error': 'Subtask not found'}, 404

    parent_tasks = Task.query.join(task_subtasks_relations, (Task.id == task_subtasks_relations.c.TaskID)).filter(
        task_subtasks_relations.c.SubtaskID == task_id).all()

    for parent_task in parent_tasks:
        if task_id in parent_task.childes_order:
            childes_order = parent_task.childes_order.copy()
            childes_order.remove(task_id)
            parent_task.childes_order = childes_order
            db.session.add(parent_task)

    lists = List.query.filter(List.childes_order.contains([task_id])).all()

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


def link_group_list(data):
    try:
        source_id = data['source_id']
        target_id = data['target_id']

        if str(source_id).startswith('group_'):
            source = Group.query.get(int(source_id.split('_')[1]))
        elif str(source_id).startswith('project_'):
            source = Project.query.get(int(source_id.split('_')[1]))
        else:
            source = List.query.get(int(source_id))

        if str(target_id).startswith('group_'):
            target = Group.query.get(int(target_id.split('_')[1]))
            if isinstance(source, List):
                if target not in source.groups:
                    source.groups.append(target)
            elif isinstance(source, Group):
                if target not in source.projects:
                    source.projects.append(target)
        elif str(target_id).startswith('project_'):
            target = Project.query.get(int(target_id.split('_')[1]))
            if isinstance(source, List):
                if target not in source.projects:
                    source.projects.append(target)
            elif isinstance(source, Group):
                if target not in source.projects:
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


def delete_from_childes(data):
    # print(f'delete_from_childes: data: {data}')
    try:
        source_id = data['source_id']
        group_id = data.get('group_id', None)

        # print(f'delete_from_childes: source_id: {source_id}, target_id: {group_id}')

        if group_id in ['my_day', 'tasks', 'important', 'all', 'events']:
            return {"success": True}, 200

        if str(source_id).startswith('task_'):
            source = Task.query.get(int(source_id.split('_')[1]))
        elif str(source_id).startswith('group_'):
            source = Group.query.get(int(source_id.split('_')[1]))
        else:
            source = List.query.get(int(source_id))

        if (isinstance(source, List) or isinstance(source, Group) or isinstance(source, Project)) and group_id is None:
            source.in_general_list = False
            db.session.add(source)
            db.session.commit()
            return {"success": True}, 200

        if str(group_id).startswith('task_'):
            group = Task.query.get(int(group_id.split('_')[1]))
        elif str(group_id).startswith('group_'):
            group = Group.query.get(int(group_id.split('_')[1]))
        elif str(group_id).startswith('project_'):
            group = Project.query.get(int(group_id.split('_')[1]))
        else:
            group = List.query.get(int(group_id))

        if source and group:
            # Удаление элемента из списка детей
            if isinstance(source, Task):
                source_id = int(source_id.split('_')[1])
            if source_id in group.childes_order:
                updated_childes_order = group.childes_order.copy()
                updated_childes_order.remove(source_id)
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


def link_task(data):
    try:
        task_id = data['task_id']
        target_id = data['list_id']
        action = data.get('action', 'link')
        source_list_id = data.get('source_list_id')

        task = Task.query.get(task_id)
        if str(target_id).startswith('task_'):
            if task_id == int(target_id.split('_')[1]) or task in task.parent_tasks or task in task.subtasks:
                return {"error": "Task cannot be linked to itself"}, 400
            target = Task.query.get(int(target_id.split('_')[1]))
            if task_id not in target.subtasks:
                task.parent_tasks.append(target)
        else:
            target = List.query.get(int(target_id))
            if task_id not in target.tasks:
                task.lists.append(target)
        if task_id not in target.childes_order:
            updated_childes_order = target.childes_order.copy() or []
            updated_childes_order.append(task_id)
            target.childes_order = updated_childes_order

        db.session.add(target)
        db.session.add(task)
        db.session.commit()

        if action == 'move' and source_list_id:
            delete_from_childes({'source_id': f'task_{task_id}', 'group_id': source_list_id})

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
