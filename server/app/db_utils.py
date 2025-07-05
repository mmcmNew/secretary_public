import os
import json
import sqlite3
from datetime import datetime, timezone
from flask import current_app
from flask_jwt_extended import current_user

from app import db
from app.journals.models import JournalEntry
from .command_utils import modules
from .file_utils import upload_files_to_server


def get_existing_columns(table_name, cursor):
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns_info = cursor.fetchall()
    return [column[1] for column in columns_info]


def create_table_if_not_exists(table_name, db_path, table_info):
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database path '{db_path}' does not exist.")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
    table_exists = cursor.fetchone()

    if not table_exists:
        columns = ', '.join([f"{col} TEXT" for col in table_info])
        columns = columns + ', date DATETIME, files TEXT'
        create_table_query = f"CREATE TABLE {table_name} (id INTEGER PRIMARY KEY AUTOINCREMENT, {columns});"
        cursor.execute(create_table_query)
        current_app.logger.info(f"Таблица {table_name} создана с колонками: {columns}")
    else:
        existing_columns = get_existing_columns(table_name, cursor)
        existing_columns.append('date')
        existing_columns.append('files')
        missing_columns = [col for col in table_info if col not in existing_columns]
        for column in missing_columns:
            alter_table_query = f"ALTER TABLE {table_name} ADD COLUMN {column} TEXT;"
            cursor.execute(alter_table_query)
            current_app.logger.info(f"Добавлен столбец {column} в таблицу {table_name}")

    conn.commit()
    conn.close()


def create_missing_journals(db_path):
    for module_name, module_data in modules.items():
        if module_data['type'] == 'journal':
            table_name = module_name
            table_info = module_data.get('info', [])
            create_table_if_not_exists(table_name, db_path, table_info)


def get_table_columns(table_name, connection):
    query = f"PRAGMA table_info({table_name})"
    cursor = connection.cursor()
    cursor.execute(query)
    columns_info = cursor.fetchall()
    return [info[1] for info in columns_info]


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
    create_missing_journals(db_path)

    try:
        with sqlite3.connect(db_path) as connection:
            table_columns = get_table_columns(table_name, connection)
            prepare_data(message, table_columns)
            filtered_message = {key: value if value is not None else '' for key, value in message.items() if key in table_columns}
            query = (
                f"INSERT INTO {table_name} ({', '.join(filtered_message.keys())}) "
                f"VALUES ({', '.join(['?' for _ in filtered_message.keys()])})"
            )
            values = tuple(filtered_message.values())
            cursor = connection.cursor()
            cursor.execute(query, values)
            connection.commit()
            last_row_id = cursor.lastrowid
            cursor.execute(f"SELECT * FROM {table_name} WHERE ROWID = ?", (last_row_id,))
            added_record = cursor.fetchone()
            added_record_dict = dict(zip([column[0] for column in cursor.description], added_record))
            added_record_dict['table_name'] = table_name
        return {'text': 'Запись добавлена', 'params': added_record_dict}
    except Exception as e:
        current_app.logger.error(f'Ошибка при записи в базу: {e}')
        return {'text': 'Ошибка при записи в базу', 'error': str(e)}


def update_last_record(table_name, message):
    db_path = current_app.config.get('MAIN_DB_PATH', '')
    current_time = datetime.now().strftime("%H:%M")

    if 'comment' in message:
        message['comment'] = f"{current_time}: {message['comment']}"
    try:
        with sqlite3.connect(db_path) as connection:
            table_columns = get_table_columns(table_name, connection)
            cursor = connection.cursor()
            cursor.execute(f"SELECT * FROM {table_name} ORDER BY ROWID DESC LIMIT 1")
            last_record = cursor.fetchone()
            if not last_record:
                return {'text': 'Нет записей для обновления'}
            last_record_dict = dict(zip(table_columns, last_record))
            for key, value in message.items():
                if key in table_columns and str(key).lower() not in ['date', 'id', 'time']:
                    current_value = last_record_dict.get(key, '') or ''
                    if current_value != '':
                        current_value += '\n'
                    last_record_dict[key] = current_value + value
            primary_key = 'id'
            update_query = f"UPDATE {table_name} SET " + ", ".join(
                [f"{key} = ?" for key in last_record_dict.keys() if key != primary_key]
            )
            update_values = tuple(last_record_dict[key] for key in last_record_dict.keys() if key != primary_key)
            cursor.execute(update_query + f" WHERE {primary_key} = ?", update_values + (last_record_dict[primary_key],))
            connection.commit()
            last_record_dict['table_name'] = table_name
        return {'text': 'Запись обновлена', 'params': last_record_dict}
    except Exception as e:
        current_app.logger.error(f'Ошибка при обновлении записи: {e}')
        return {'text': 'Ошибка при обновлении записи', 'error': str(e)}


def update_record(table_name, record_dict):
    db_path = current_app.config.get('MAIN_DB_PATH', '')
    try:
        with sqlite3.connect(db_path) as connection:
            connection.row_factory = sqlite3.Row
            cursor = connection.cursor()
            record_id = record_dict.get('id')
            if record_id is None:
                return {'text': 'Не указан ID для обновления', 'error': 'Не указан ID для обновления'}
            cursor.execute(f"SELECT * FROM {table_name} WHERE id = ?", (record_id,))
            existing_record = cursor.fetchone()
            if not existing_record:
                return {'text': 'Нет записей для обновления', 'error': 'Нет записей для обновления'}
            if 'files' in record_dict:
                current_files = existing_record['files']
                if current_files:
                    record_dict['files'] = f"{current_files};{record_dict['files']}"
            primary_key = 'id'
            update_query = f"UPDATE {table_name} SET " + ", ".join(
                [f"{key} = ?" for key in record_dict if key != primary_key]
            )
            update_values = tuple(record_dict[key] for key in record_dict if key != primary_key)
            cursor.execute(update_query + f" WHERE {primary_key} = ?", update_values + (record_id,))
            connection.commit()
            cursor.execute(f"SELECT * FROM {table_name} WHERE id = ?", (record_id,))
            updated_record = cursor.fetchone()
            updated_record_dict = dict(updated_record)
            updated_record_dict['table_name'] = table_name
        return {'text': 'Запись обновлена', 'params': updated_record_dict}
    except Exception as e:
        current_app.logger.error(f'Ошибка при обновлении записи: {e}')
        return {'text': 'Ошибка при обновлении записи', 'error': str(e)}


def save_to_base_modules(target_module, command_type, message_info=None, files_list=None):
    save_files_result = None
    if target_module is None:
        return {'text': 'Не указана таблица для записи'}

    if isinstance(message_info, str):
        try:
            message_info = json.loads(message_info)
        except json.JSONDecodeError:
            raise ValueError("message_info должен быть JSON-строкой или словарём")

    message_info = message_info or {}
    module_cfg = modules.get(target_module, {})

    if files_list:
        save_files_result, files_names = upload_files_to_server(files_list, target_module)
        if files_names:
            message_info['files'] = ';'.join(files_names)

    if module_cfg.get('type') == 'journal':
        match command_type:
            case 'create':
                entry = JournalEntry(user_id=current_user.id, journal_type=target_module, data=message_info)
                db.session.add(entry)
            case 'append':
                entry = JournalEntry.query.filter_by(user_id=current_user.id, journal_type=target_module)
                entry = entry.order_by(JournalEntry.id.desc()).first()
                if not entry:
                    return {'text': 'Нет записей для обновления', 'error': 'Нет записей для обновления'}
                for k, v in message_info.items():
                    cur_val = entry.data.get(k, '')
                    entry.data[k] = f"{cur_val}\n{v}" if cur_val else v
            case 'update':
                record_id = message_info.get('id')
                if not record_id:
                    return {'text': 'Не указан ID', 'error': 'Не указан ID'}
                entry = JournalEntry.query.filter_by(id=record_id, user_id=current_user.id, journal_type=target_module).first()
                if not entry:
                    return {'text': 'Запись не найдена', 'error': 'Запись не найдена'}
                for k, v in message_info.items():
                    if k != 'id':
                        entry.data[k] = v
            case _:
                return {'text': 'Команда не обработана'}
        db.session.commit()
        result = {'text': 'Запись сохранена', 'params': entry.to_dict()}
    else:
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
