import os
import json
import re
import sqlite3
from datetime import datetime, timezone, timedelta

from flask import current_app
from flask_login import current_user
from werkzeug.utils import secure_filename


def load_json(filename):
    filename = os.path.join(current_app.root_path, 'user_data', 'settings', filename)
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)


modules = load_json('modules.json')

commands_list = load_json('commands_list.json')

command_information = load_json('command_information.json')

command_num_information = load_json('command_num_information.json')

columns_names = {
            'reason': 'Причина', 'score': 'Оценка', 'lessons': 'Урок', 'comment': 'Комментарий',
            'bias': 'Настроение', 'news': 'Новости', 'session': 'Сессия', 'trading_day': 'Торговый день',
            'model': 'Модель', 'result': 'Результат', 'project_name': 'Название проекта', 'step': 'Этап',
            'name': 'Название', 'author': 'Автор', 'problems': 'Проблемы', 'facts': 'Факты', 'genre': 'Жанр',
            'features': 'Особенности изложения', 'new_info': 'Новая информация', 'type': 'Тип',
            'files': 'Список вложений', 'instrument': 'Инструмент', 'sum': 'Сумма', 'body': 'Тело поста',
            'records_ids': 'id Записей используемых в посте', 'publish_date': 'Дата публикации',
            'channels': 'Каналы', 'title': 'Заголовок', 'date': 'Дата', 'posts_src': 'Ссылки на пост',
            'task_id': 'id связанных задач', 'country': 'Страна', 'year': 'Год', 'time': 'Время', 'id': 'Номер записи'
        }


def get_columns_names():
    return columns_names


def get_existing_columns(table_name, cursor):
    """Получить список существующих столбцов в таблице"""
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns_info = cursor.fetchall()
    # Возвращаем список имен столбцов
    return [column[1] for column in columns_info]  # Второй элемент — это имя столбца


def create_table_if_not_exists(table_name, db_path, table_info):
    # Проверка на существование файла базы данных
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database path '{db_path}' does not exist.")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Проверка на существование таблицы
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
    table_exists = cursor.fetchone()

    if not table_exists:  # Если таблица не существует
        # Составляем запрос на создание таблицы
        columns = ', '.join([f"{col} TEXT" for col in table_info])  # Столбцы таблицы
        columns = columns + ', date DATETIME, files TEXT'
        # current_app.logger.info(f'create_table_if_not_exists: {columns}')
        create_table_query = f"CREATE TABLE {table_name} (id INTEGER PRIMARY KEY AUTOINCREMENT, {columns});"
        cursor.execute(create_table_query)
        current_app.logger.info(f"Таблица {table_name} создана с колонками: {columns}")
    else:
        # current_app.logger.info(f"Таблица {table_name} уже существует.")

        # Проверяем существующие столбцы в таблице
        existing_columns = get_existing_columns(table_name, cursor)
        existing_columns.append('date')
        existing_columns.append('files')

        # Ищем недостающие столбцы
        missing_columns = [col for col in table_info if col not in existing_columns]

        # Добавляем недостающие столбцы
        for column in missing_columns:
            alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column} TEXT;"
            cursor.execute(alter_table_query)
            current_app.logger.info(f"Добавлен столбец {column} в таблицу {table_name}")

    conn.commit()
    conn.close()


def create_missing_journals(db_path):
    for module_name, module_data in modules.items():
        if module_data['type'] == 'journal':  # Проверка на тип "journal"
            table_name = module_name
            table_info = module_data.get('info', [])
            create_table_if_not_exists(table_name, db_path, table_info)


def create_user_directories(base_dir):
    """Create per-user folders with empty database files."""
    os.makedirs(base_dir, exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'db'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'journals'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'memory'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'static', 'avatars'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'static', 'audio'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'static', 'sounds'), exist_ok=True)

    for name in ['main.db', 'to_do.db', 'appmeta.db']:
        db_file = os.path.join(base_dir, 'db', name)
        if not os.path.exists(db_file):
            open(db_file, 'a').close()


def parse_time(text):
    print(text)

    if 'полчаса' in text:
        # конвертировать время в текущую дату + время и преобразовать в ISO стринг с добавлением Z
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

    # конвертировать время в текущую дату + время и преобразовать в ISO стринг с добавлением Z
    end_time = datetime.now(timezone.utc) + timedelta(hours=time_units["час"], minutes=time_units["минут"],
                                                      seconds=time_units["секунд"])

    return {'time': [str(time_units["час"]).zfill(2), str(time_units["минут"]).zfill(2),
                     str(time_units["секунд"]).zfill(2)],
            'initialEndTimeProp': end_time.isoformat()[:23] + 'Z'}


def find_command_type(message):
    global commands_list, modules
    command_type = None
    first_word = message.split()[0].lower().replace(',', '')
    print(f'find_command_type: first_word: {first_word}')

    for commands_types, commands in commands_list.items():

        if first_word in commands:
            command_type = commands_types
            break

    return command_type


def find_info(target_module, module_info, text):
    # Уникальный разделитель, который маловероятно встретить в тексте
    delimiter = "||"
    replacements_made = False
    # current_app.logger.debug(f'find_info: text: {text}')
    # current_app.logger.debug(f'find_info: target_module: {target_module}, module_info: {module_info}')

    result = {}
    # Заменяем слова на ключевые слова с разделителем
    command_info_dict = command_information | command_num_information  # складываем 2 словаря для нахождения ключей
    # проверка условия если в modules[module_name]['info'] есть ключевое слово comment то проверяются
    # значения из словаря command_info_dict['comment'] и заменяется его значение значением ключа comment и
    # запоминается позиция вхождения ключевого слова в тексте
    comment_start = len(text)
    if 'comment' in module_info:
        for value in command_info_dict['comment']:
            # Находим позицию первого вхождения ключевого слова
            comment_start = text.lower().find(value)
            if comment_start != -1:
                # Находим позицию следующего пробела после ключевого слова
                end = text.find(' ', comment_start)
                if end == -1:
                    end = len(text)  # Если пробел не найден, заменяем до конца текста
                # Заменяем весь фрагмент ключевым словом и разделителем
                text = text[:comment_start] + delimiter + 'comment' + text[end:]
                replacements_made = True
                break  # Прекращаем поиск после первой замены для данного ключа

    for info_type in module_info:
        if info_type == 'time':
            result = {'time': parse_time(text)}
            continue
        if info_type == 'comment':
            continue
        for value in command_info_dict[info_type]:
            # Находим позицию первого вхождения ключевого слова до вхождения ключа comment
            start = text.lower().find(value, 0, comment_start)
            if start != -1:
                # Находим позицию следующего пробела после ключевого слова
                end = text.find(' ', start)
                if end == -1:
                    end = comment_start  # Если пробел не найден, заменяем до конца текста
                # Заменяем весь фрагмент ключевым словом и разделителем
                text = text[:start] + delimiter + info_type + text[end:]
                replacements_made = True
                break  # Прекращаем поиск после первой замены для данного ключа

    # if target_module == 'memory':
    #     cards_count = int(result.get('count', 50))
    #     result['count'] = cards_count
    #     result['items'] = generate_cards(cards_count)

    if not replacements_made:
        return result

    # Разделяем текст по разделителю
    split_text = text.split(delimiter)

    # Собираем словарь, где ключ - это ключевое слово, а значение - текст до следующего ключа
    for i, segment in enumerate(split_text[1:],
                                start=1):  # Пропускаем первый элемент, так как он перед первым ключевым словом
        key = segment.split()[0]  # Первое слово - ключ
        if key in command_num_information:  # для числовых ключей берем первое число после ключа
            found_numbers = re.findall(r'\d+', segment)
            if found_numbers:
                value = found_numbers[0]
                result[key] = value
                continue
        value = ' '.join(segment.split()[1:])  # Остальная часть - значение
        result[key] = value

    return result


def find_target_module(command):
    global modules
    if command is None or modules is None:
        return None, None

    target_module = None
    # Определяем модуль по словарю.
    # Словарь Модуль:{[Список слов активации], [Список команд модуля], [Список информации]}
    earliest_occurrence = len(command) + 1  # берем длину строки как первое встреченное слово
    # проверяем позиции всех модулей и первый встреченный это целевой
    for key, values in modules.items():
        for module_command in values['words']:
            position = command.lower().find(module_command)
            if position != -1 and position < earliest_occurrence:
                earliest_occurrence = position
                target_module = key
    # target_module установлен в первый модуль, найденный в command_text

    if target_module is None:
        return None, None

    return target_module, modules[target_module]


def save_to_base_modules(target_module, command_type, message_info=None, files_list=None):
    global commands_list
    save_files_result = None
    if target_module is None:
        return {'text': 'Не указана таблица для записи'}
    if isinstance(message_info, str):
        # Если message_info строка, попробуем её распарсить как JSON
        try:
            message_info = json.loads(message_info)
        except json.JSONDecodeError:
            raise ValueError("message_info должен быть JSON-строкой или словарём")
    # current_app.logger.debug(f'save_to_base_modules: command_type: {command_type}, target_module: {target_module}')
    # Сохраняем файлы
    if files_list:
        user_dir = current_user.data_dir if current_user.is_authenticated else None
        save_files_result, files_names = upload_files_to_server(files_list, target_module, user_dir=user_dir)
        if files_names:
            # Формируем строку с новыми файлами, добавляя к существующим (если есть)
            new_files = ';'.join(files_names)
            message_info['files'] = new_files
    # current_app.logger.debug(f'save_to_base_modules: command_info: {message_info}')

    match command_type:
        case 'create':
            result = save_to_base(target_module, message_info)
        case 'append':
            result = update_last_record(target_module, message_info)
        case 'update':
            result = update_record(target_module, message_info)
        case _:
            return {'text': 'Команда не обработана'}

    if save_files_result:
        result['text'] = f' {save_files_result}' + result['text']
    return result


def get_table_columns(table_name, connection):
    query = f"PRAGMA table_info({table_name})"
    cursor = connection.cursor()
    cursor.execute(query)
    # current_app.logger.debug(f'get_table_columns: cursor: {cursor}')
    columns_info = cursor.fetchall()
    # PRAGMA table_info returns a list of tuples, where the second element is the column name
    columns = [info[1] for info in columns_info]
    # current_app.logger.debug(f'get_table_columns: {columns}')
    return columns


def prepare_data(message, table_columns):
    current_date = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now().strftime("%H:%M")
    date_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    if 'comment' in message:
        message['comment'] = f"{current_time}: {message['comment']}"
    if 'date' in table_columns:
        message['date'] = date_utc
    if 'time' in table_columns:
        message['time'] = current_time
    if 'trading_day' in message:
        message['trading_day'] = message.get('trading_day', current_date)

    return message


def save_to_base(table_name, message):
    db_path = current_app.config.get('MAIN_DB_PATH', '')
    # current_app.logger.debug(f'save_to_base: db_path: {db_path}')
    # current_app.logger.debug(f'from save_to_base: message: {message}')
    # создать таблицу если ей нет в базе
    create_missing_journals(db_path)

    try:
        # current_app.logger.debug(db_path)
        with sqlite3.connect(db_path) as connection:
            table_columns = get_table_columns(table_name, connection)
            # current_app.logger.debug(f'save_to_base: query: {table_columns}')

            # Prepare data and filter message keys to only include those present in the table
            prepare_data(message, table_columns)
            filtered_message = {key: value if value is not None else '' for key, value in message.items() if
                                key in table_columns}

            query = (f"INSERT INTO {table_name} ({', '.join(filtered_message.keys())}) "
                     f"VALUES ({', '.join(['?' for _ in filtered_message.keys()])})")
            values = tuple(filtered_message.values())
            # current_app.logger.debug(f'save_to_base: query: {query}, values: {values}')

            cursor = connection.cursor()
            cursor.execute(query, values)
            connection.commit()

            # Получить ID последней добавленной записи
            last_row_id = cursor.lastrowid

            # Извлечь последнюю добавленную запись
            cursor.execute(f"SELECT * FROM {table_name} WHERE ROWID = ?", (last_row_id,))
            added_record = cursor.fetchone()
            added_record_dict = dict(zip([column[0] for column in cursor.description], added_record))
            added_record_dict['table_name'] = table_name

        result = {'text': 'Запись добавлена', 'params': added_record_dict}
        return result
    except Exception as e:
        current_app.logger.error(f'Ошибка при записи в базу: {e}')
        result = {'text': 'Ошибка при записи в базу', 'error': str(e)}
        return result


def update_last_record(table_name, message):
    db_path = current_app.config.get('MAIN_DB_PATH', '')
    current_time = datetime.now().strftime("%H:%M")

    if 'comment' in message:
        message['comment'] = f"{current_time}: {message['comment']}"

    # current_app.logger.debug(f'update_last_record: message: {message}')

    try:
        with sqlite3.connect(db_path) as connection:
            table_columns = get_table_columns(table_name, connection)
            cursor = connection.cursor()

            # Fetch the last record's primary key value
            cursor.execute(f"SELECT * FROM {table_name} ORDER BY ROWID DESC LIMIT 1")
            last_record = cursor.fetchone()
            if not last_record:
                return {'text': 'Нет записей для обновления'}

            # Create a dictionary from the last record
            last_record_dict = dict(zip(table_columns, last_record))

            # Update the fields with new values or append if necessary
            for key, value in message.items():
                if key in table_columns and str(key).lower() not in ['date', 'id', 'time']:
                    current_value = last_record_dict.get(key, '') or ''
                    if current_value != '':
                        current_value += '\n'
                    last_record_dict[key] = current_value + value

            # Build the update query dynamically, excluding the primary key column (assuming 'id' is the primary key)
            primary_key = 'id'
            update_query = f"UPDATE {table_name} SET " + ", ".join(
                [f"{key} = ?" for key in last_record_dict.keys() if key != primary_key])
            update_values = tuple(last_record_dict[key] for key in last_record_dict.keys() if key != primary_key)

            cursor.execute(update_query + f" WHERE {primary_key} = ?", update_values + (last_record_dict[primary_key],))
            connection.commit()

            last_record_dict['table_name'] = table_name
        result = {'text': 'Запись обновлена', 'params': last_record_dict}
        return result
    except Exception as e:
        current_app.logger.error(f'Ошибка при обновлении записи: {e}')
        result = {'text': 'Ошибка при обновлении записи', 'error': str(e)}
        return result


def update_record(table_name, record_dict):
    db_path = current_app.config.get('MAIN_DB_PATH', '')

    try:
        with sqlite3.connect(db_path) as connection:
            connection.row_factory = sqlite3.Row  # позволяет получать строки как словари
            cursor = connection.cursor()

            record_id = record_dict.get('id')
            if record_id is None:
                return {'text': 'Не указан ID для обновления', 'error': 'Не указан ID для обновления'}

            # Проверка существования записи
            cursor.execute(f"SELECT * FROM {table_name} WHERE id = ?", (record_id,))
            existing_record = cursor.fetchone()
            if not existing_record:
                return {'text': 'Нет записей для обновления', 'error': 'Нет записей для обновления'}

            # Объединение файлов, если нужно
            if 'files' in record_dict:
                current_files = existing_record['files']
                if current_files:
                    record_dict['files'] = f"{current_files};{record_dict['files']}"

            # Обновление записи
            primary_key = 'id'
            update_query = f"UPDATE {table_name} SET " + ", ".join(
                [f"{key} = ?" for key in record_dict if key != primary_key])
            update_values = tuple(record_dict[key] for key in record_dict if key != primary_key)

            cursor.execute(update_query + f" WHERE {primary_key} = ?", update_values + (record_id,))
            connection.commit()

            # Получаем обновлённую запись
            cursor.execute(f"SELECT * FROM {table_name} WHERE id = ?", (record_id,))
            updated_record = cursor.fetchone()
            updated_record_dict = dict(updated_record)
            updated_record_dict['table_name'] = table_name

        return {'text': 'Запись обновлена', 'params': updated_record_dict}
    except Exception as e:
        current_app.logger.error(f'Ошибка при обновлении записи: {e}')
        return {'text': 'Ошибка при обновлении записи', 'error': str(e)}



def upload_files_to_server(files_list, dir_name, user_dir=None):
    files_names = []
    try:
        print(f'upload_files_to_server: files_list: {files_list}, dir_name: {dir_name}')
        if files_list is None or dir_name is None:
            return 'Не получены файлы для загрузки'
        if files_list:
            current_month = datetime.now().strftime('%Y-%m')
            base = user_dir or os.path.join(os.path.dirname(__file__), 'user_data')
            save_path = str(os.path.join(base, 'journals', dir_name, current_month))
            os.makedirs(save_path, exist_ok=True)
            current_date = datetime.now().strftime("%Y-%m-%d")
            i = 0
            for file_key in files_list:
                file = files_list[file_key]
                file_name = secure_filename(file.filename)
                # print(f'file.filename: {file.filename}, secure_filename: {file_name}')
                if not file or not file_name:
                    continue
                file_extension = os.path.splitext(file.filename)[1]
                save_file_name = f'{current_date}[{i}]{file_extension}'
                while os.path.exists(os.path.join(save_path, save_file_name)):
                    i += 1
                    save_file_name = f'{current_date}[{i}]{file_extension}'

                file.save(os.path.join(save_path, save_file_name))
                files_names.append(os.path.join(dir_name, current_month, save_file_name))
                i += 1
        print(f'upload_files_to_server: files_names: {files_names}')
        result = 'Файлы загружены. '
        return result, files_names
    except Exception as e:
        result = f'Файлы не загружены: {e}. '
        return result, files_names


def get_tables():
    global modules
    tables = []

    for key, value in modules.items():
        if value.get('type') != 'journal':
            continue

        # Базовая информация
        table_info = {
            'label': value.get('name'),
            'src': key,
            'filters': {
                'dropdown': [],
                'text': [],
                'range': [],
                'date': []
            }
        }

        filter_config = value.get('filter_config', {})

        # Копируем существующие фильтры
        for f_type in ['dropdown', 'text', 'range', 'date']:
            table_info['filters'][f_type] = filter_config.get(f_type, [])

        # Добавляем "date" по умолчанию, если не указано явно
        if 'date' not in table_info['filters']['date']:
            table_info['filters']['date'].insert(0, 'date')

        tables.append(table_info)

    return tables


def get_modules():
    global modules
    return modules


if __name__ != '__main__':
    print("start_main")
