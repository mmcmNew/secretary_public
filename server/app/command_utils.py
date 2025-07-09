import os
import json
import re
from datetime import datetime, timezone, timedelta
from flask import current_app
from flask_jwt_extended import current_user


def load_json(filename):
    filename = os.path.join(
        current_app.static_folder,
        'default_settings',
        'settings',
        filename,
    )
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)


modules = load_json('modules.json')
commands_list = load_json('commands_list.json')
command_information = load_json('command_information.json')
command_num_information = load_json('command_num_information.json')

columns_names = {
    'reason': 'Причина',
    'score': 'Оценка',
    'lessons': 'Урок',
    'comment': 'Комментарий',
    'bias': 'Настроение',
    'news': 'Новости',
    'session': 'Сессия',
    'trading_day': 'Торговый день',
    'model': 'Модель',
    'result': 'Результат',
    'project_name': 'Название проекта',
    'step': 'Этап',
    'name': 'Название',
    'author': 'Автор',
    'problems': 'Проблемы',
    'facts': 'Факты',
    'genre': 'Жанр',
    'features': 'Особенности изложения',
    'new_info': 'Новая информация',
    'type': 'Тип',
    'files': 'Список вложений',
    'instrument': 'Инструмент',
    'sum': 'Сумма',
    'body': 'Тело поста',
    'records_ids': 'id Записей используемых в посте',
    'publish_date': 'Дата публикации',
    'channels': 'Каналы',
    'title': 'Заголовок',
    'date': 'Дата',
    'posts_src': 'Ссылки на пост',
    'task_id': 'id связанных задач',
    'country': 'Страна',
    'year': 'Год',
    'time': 'Время',
    'id': 'Номер записи',
}


def get_columns_names():
    return columns_names


def parse_time(text: str):
    """Parse time description and return dictionary with time info."""
    if 'полчаса' in text:
        end_time = datetime.now(timezone.utc).replace(tzinfo=timezone.utc) + timedelta(minutes=30)
        return {'time': ['00', '30', '00'], 'initialEndTimeProp': end_time.isoformat()[:23] + 'Z'}

    time_units = {"час": 0, "минут": 0, "секунд": 0}
    numbers_in_text = [int(num) for num in re.findall(r'\d+', text)]

    for unit in time_units.keys():
        if unit in text:
            try:
                time_units[unit] = numbers_in_text.pop(0)
            except (ValueError, IndexError):
                continue

    end_time = datetime.now(timezone.utc) + timedelta(
        hours=time_units["час"], minutes=time_units["минут"], seconds=time_units["секунд"]
    )

    return {
        'time': [str(time_units["час"]).zfill(2), str(time_units["минут"]).zfill(2), str(time_units["секунд"]).zfill(2)],
        'initialEndTimeProp': end_time.isoformat()[:23] + 'Z',
    }


def find_command_type(message: str):
    command_type = None
    first_word = message.split()[0].lower().replace(',', '')

    for commands_types, commands in commands_list.items():
        if first_word in commands:
            command_type = commands_types
            break
    return command_type


def find_info(target_module, module_info, text):
    delimiter = "||"
    replacements_made = False

    result = {}
    command_info_dict = command_information | command_num_information
    comment_start = len(text)
    if 'comment' in module_info:
        for value in command_info_dict['comment']:
            comment_start = text.lower().find(value)
            if comment_start != -1:
                end = text.find(' ', comment_start)
                if end == -1:
                    end = len(text)
                text = text[:comment_start] + delimiter + 'comment' + text[end:]
                replacements_made = True
                break

    for info_type in module_info:
        if info_type == 'time':
            result = {'time': parse_time(text)}
            continue
        if info_type == 'comment':
            continue
        for value in command_info_dict[info_type]:
            start = text.lower().find(value, 0, comment_start)
            if start != -1:
                end = text.find(' ', start)
                if end == -1:
                    end = comment_start
                text = text[:start] + delimiter + info_type + text[end:]
                replacements_made = True
                break

    if not replacements_made:
        return result

    split_text = text.split(delimiter)
    for segment in split_text[1:]:
        key = segment.split()[0]
        if key in command_num_information:
            found_numbers = re.findall(r'\d+', segment)
            if found_numbers:
                result[key] = found_numbers[0]
                continue
        value = ' '.join(segment.split()[1:])
        result[key] = value

    return result


def find_target_module(command):
    if command is None or modules is None:
        return None, None

    target_module = None
    earliest_occurrence = len(command) + 1
    for key, values in modules.items():
        for module_command in values['words']:
            position = command.lower().find(module_command)
            if position != -1 and position < earliest_occurrence:
                earliest_occurrence = position
                target_module = key
    if target_module is None:
        return None, None
    return target_module, modules[target_module]


def get_tables():
    modules_cfg = get_modules()
    tables = []

    for key, value in modules_cfg.items():
        if value.get('type') != 'journal':
            continue
        table_info = {
            'label': value.get('name'),
            'src': key,
            'filters': {
                'dropdown': [],
                'text': [],
                'range': [],
                'date': [],
            },
        }
        filter_config = value.get('filter_config', {})
        for f_type in ['dropdown', 'text', 'range', 'date']:
            table_info['filters'][f_type] = filter_config.get(f_type, [])
        if 'date' not in table_info['filters']['date']:
            table_info['filters']['date'].insert(0, 'date')
        tables.append(table_info)
    return tables


def get_modules():
    try:
        user_modules = getattr(current_user, 'modules', None)
        user_id = getattr(current_user, 'id', None)
    except Exception:
        user_modules = None
        user_id = None

    result_modules = modules.copy()

    if user_id:
        try:
            from app.journals.models import JournalSchema
            user_schemas = JournalSchema.query.filter_by(user_id=user_id).all()
            for schema in user_schemas:
                result_modules[schema.name] = {
                    'type': 'journal',
                    'name': schema.display_name,
                    'words': [schema.name],
                    'info': [field['name'] for field in schema.fields],
                    'user_schema': True,
                }
        except Exception as e:
            current_app.logger.error(f'Error loading user schemas: {e}')

    if user_modules:
        return {name: result_modules.get(name, {}) for name in user_modules if name in result_modules}
    return result_modules
