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
        return {'text': 'Команда не обработана'}

    if save_files_result:
        result['text'] = f' {save_files_result}' + result['text']
    return result
