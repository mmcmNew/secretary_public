from app.utilites import (find_target_module, save_to_base, save_to_base_modules, find_info,
                          find_command_type)

from app.modules.MetaAIAPI import get_eden_ai_response

from app.tasks.handlers import *

from rapidfuzz import fuzz, process


def answer_from_secretary(text, files=None):
    command_type = find_command_type(text)
    result = None
    if not command_type:
        return result
    target_module, target_module_params = find_target_module(text)
    if not target_module:
        return result
    module_name = target_module_params.get('name', target_module)
    module_info = target_module_params.get('info', {})
    if target_module == 'tasks':
        text = text.replace('под задач', 'подзадач')
    message_info = find_info(target_module, module_info, text)
    if command_type == 'start' and target_module != 'timer':
        return {'text': f'Запускаю {module_name}', 'context': {'component': target_module,
                                                               'params': message_info}}
    match target_module_params.get('type'):
        case 'component':
            message_info['isRunning'] = True
            time = message_info.get('time', None)
            if time:
                end_time = time.get('initialEndTimeProp', None)
            else:
                end_time = None
            params = {'resultText': message_info.get('name'), 'initialEndTimeProp': end_time, 'isRunningProp': True}
            # print(params)
            if target_module == 'timer':
                target_module = 'timersToolbar'
            result = {'text': f'Запускаю {module_name}', 'context': {'component': target_module,
                                                                     'params': params}}
        case 'journal':
            if message_info:
                result = save_to_base_modules(target_module, command_type, message_info, files)
                result['text'] += f' в {module_name}'
        case 'task':
            task_module_result, _ = task_module(command_type, message_info)
            result = {'text': task_module_result.get('message'), 'context': {'UPDATES': ['todo', 'calendar']}}
        case 'ai_chat':
            ai_answer = get_eden_ai_response(text)  # убираем слово найди в начале
            ai_message = ai_answer.get('message', '')
            result = {'text': ai_message}
        # case 'action_module':
        #     action_module = action_module_processing(target_module)
        #     if action_module:
        #         message_type = 'action_module'
        #         ai_answer = {'user_id': 2, 'text': f'Запускаю модуль {target_module}'}
        #     else:
        #         ai_answer = {'user_id': 2, 'text': 'Проблемы при запуске модуля'}

    # print(result)
    return result


def task_module(command_type, data):
    # print(f'task_module: data: {data}')
    subtask_title = data.get('subtask', None)
    task_name = data.get('task_name', None)
    list_name = data.get('list_name', None)

    match command_type:
        case 'create':
            object_type, object_title = get_creating_object_type(data)
            match object_type:
                case 'subtask':
                    task_id, list_id = get_best_task_and_list_id(task_name, list_name)
                    # print(f'task_id: {task_id}, list_id: {list_id}')
                    return add_subtask({'title': subtask_title, 'parentTaskId': task_id, 'listId': list_id})
                case 'task':
                    _, list_id = get_best_matching_lists(list_name)
                    return add_task({'title': task_name, 'listId': list_id})
                case 'list' | 'group' | 'project':
                    return add_object({'title': object_title, 'type': object_type})
        case 'mark':
            task_id, _ = get_best_task_and_list_id(task_name, list_name)
            mark_result, _ = change_task_status({'taskId': task_id})
            # print(f'mark_result: {mark_result}')
            if mark_result['success']:
                result = {'message': f'Поздравляю с завершением задачи'}
            else:
                result = {'message': f'К сожалению мне не удалось найти задачу'}
            return result, 200


def get_best_task_and_list_id(task_name, list_name):
    best_list_id = None
    best_task_id = None
    highest_score = 0
    if not list_name:
        task_id, task_score = get_best_matching_task_id(task_name, 'all')
        if task_id:
            return task_id, 'tasks'
        return None, None
    lists = get_lists_and_groups_data().get('lists', [])
    # print(f'get_best_task_and_list_id: list_name: {list_name}, task_name: {task_name},  lists: {lists}')
    best_matching_lists, _ = get_best_matching_lists(list_name)
    # print(f'best_matching_lists: {best_matching_lists}')
    for l_name, score, _ in best_matching_lists:
        list_id = next((l['id'] for l in lists if l['title'].lower() == l_name.lower()), None)
        # print(f'list_id: {list_id}')
        if list_id:
            task_id, task_score = get_best_matching_task_id(task_name, list_id)
            if task_score > highest_score:
                best_list_id = list_id
                best_task_id = task_id
                highest_score = task_score

    # print(f'best_task_id: {best_task_id}, best_list_id: {best_list_id}')
    return best_task_id, best_list_id


def get_creating_object_type(data):
    # print(f'get_creating_object_type: data: {data}')
    if data.get('subtask'):
        return 'subtask', data['subtask']
    if data.get('task_name'):
        return 'task', data['task_name']
    if data.get('list_name'):
        return 'list', data['list_name']
    if data.get('group_name'):
        return 'group', data['group_name']
    if data.get('project_name'):
        return 'project', data['project_name']
    return None, None


def get_best_matching_lists(list_name):
    if not list_name:
        return [{'tasks', 100}], 'tasks'

    lists_data = get_lists_and_groups_data().get('lists', [])
    list_names = [task_list['title'].lower() for task_list in lists_data]

    # Использование rapidfuzz для поиска всех подходящих списков
    list_matches = process.extract(list_name.lower(), list_names, scorer=fuzz.token_sort_ratio, limit=None,
                                   score_cutoff=80)

    # Находим самый первый list_id для некоторых функций
    list_id = None
    if list_matches:
        best_match_title = list_matches[0][0]
        list_id = next((l['id'] for l in lists_data if l['title'].lower() == best_match_title), None)

    return list_matches, list_id


def get_best_matching_task_id(task_name, list_id='all'):
    tasks_response, _ = get_tasks(list_id)
    tasks_data = tasks_response.get('tasks', [])

    if task_name:
        # Преобразуем заголовки задач и искомое имя задачи в нижний регистр
        tasks_names = [task['title'].lower() for task in tasks_data]

        # print(f'get_best_matching_task_id: {task_name}, {tasks_names}')

        # Использование fuzzywuzzy для поиска наиболее подходящей задачи
        task_matches = process.extract(task_name.lower(), tasks_names, scorer=fuzz.token_sort_ratio, limit=1,
                                       score_cutoff=80)
        # print(f'task_matches: {task_matches}')

        # Получение идентификаторов задач
        if task_matches:
            best_match_title, score, _ = task_matches[0]
            best_match_id = next(task['id'] for task in tasks_data if task['title'].lower() == best_match_title)
            return best_match_id, score

    return None, 0


if __name__ != '__main__':
    print('start manage.py')
