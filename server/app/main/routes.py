import sqlite3
import re
from datetime import timedelta

from flask_socketio import emit
import json
import os

from . import main
from .handlers import fetch_table_records
from app import socketio
from flask import Response, current_app, abort, render_template, make_response
from flask import request, jsonify, send_from_directory, send_file
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    current_user
)
from werkzeug.security import check_password_hash
from sqlalchemy import or_
from .models import *

from app.secretary import answer_from_secretary
from app.utilites import update_record, save_to_base, get_tables, save_to_base_modules, get_columns_names
from app.text_to_edge_tts import generate_tts, del_all_audio_files
from ..tasks.handlers import create_daily_scenario
from app.get_records_utils import get_all_filters, fetch_filtered_records


EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$'


def validate_email(email: str) -> bool:
    return re.match(EMAIL_REGEX, email) is not None


def validate_password(password: str):
    if len(password) < 6:
        return False, 'Password must be at least 6 characters long'
    # if not re.search(r'[A-Z]', password):
    #     return False, 'Password must contain an uppercase letter'
    # if not re.search(r'[a-z]', password):
    #     return False, 'Password must contain a lowercase letter'
    # if not re.search(r'\d', password):
    #     return False, 'Password must contain a digit'
    return True, ''


@current_app.route('/sw.js')
def serve_sw():
    try:
        # Отдаем sw.js из папки dist
        dist_folder = current_app.config.get('DIST_FOLDER', '')
        response = make_response(send_from_directory(dist_folder, 'sw.js'))
        response.headers['Content-Type'] = 'application/javascript'
        # Service-Worker-Allowed НЕ НУЖЕН
        return response
    except Exception as e:
        current_app.logger.error(f"Error serving sw.js: {e}")
        return "SW not found", 404


@main.route('/manifest.webmanifest')
def serve_manifest():
    try:
        dist_folder = current_app.config.get('DIST_FOLDER', '')
        # Отдаем manifest.webmanifest из папки dist
        response = make_response(send_from_directory(dist_folder, 'manifest.webmanifest'))
        response.headers['Content-Type'] = 'application/manifest+json'
        return response
    except Exception as e:
        current_app.logger.error(f"Error serving manifest.webmanifest: {e}")
        return "Manifest not found", 404


@socketio.on('connect', namespace='/chat')
def handle_connect():
    print('Client connected')


@socketio.on('disconnect', namespace='/chat')
def handle_disconnect():
    print('Client disconnected')


@socketio.on('connect', namespace='/updates')
def updates_ws_connect():
    current_app.logger.info('Client connected to updates websocket')


@socketio.on('disconnect', namespace='/updates')
def updates_ws_disconnect():
    current_app.logger.info('Client disconnected from updates websocket')


@socketio.on('request_messages', namespace='/chat')
@main.route('/api/chat/messages', methods=['GET'])
def get_messages():
    # current_app.logger.info('request_messages')
    messages_list = ChatHistory.query.join(ChatHistory.user).order_by(ChatHistory.message_id.desc()).limit(100).all()
    if messages_list:
        messages_list = messages_list[::-1]
        messages = [message.to_dict() for message in messages_list]
    else:
        messages = []
    # print('dict_messages: ', messages)
    response = Response(json.dumps(messages), mimetype='application/json')
    # print(response)
    emit('all_messages', messages, to=request.sid)
    return response


@main.route('/avatars/<path:filename>', methods=['GET'])
@main.route('/static/<path:filename>', methods=['GET'])
@main.route('/sounds/<path:filename>', methods=['GET'])
@main.route('/memory/<path:filename>', methods=['GET'])
@main.route('/audio/<path:filename>', methods=['GET'])
def static_files(filename):
    # Получаем полный путь маршрута
    route = request.path
    # print(f'Requested route: {route}')
    base_dir = current_app.root_path
    # Устанавливаем базовую директорию на основе пути запроса
    if route.startswith('/avatars'):
        base_dir = os.path.join(base_dir, 'user_data', 'static', 'avatars')
    elif route.startswith('/static'):
        base_dir = os.path.join(base_dir, 'user_data', 'static')
    elif route.startswith('/sounds'):
        base_dir = os.path.join(base_dir, 'user_data', 'static', 'sounds')
    elif route.startswith('/memory'):
        base_dir = os.path.join(base_dir, 'user_data', 'memory')
    elif route.startswith('/audio'):
        base_dir = os.path.join(base_dir, 'user_data', 'static', 'audio')

    # print(f'static_files: Base directory: {base_dir}')

    # Проверка на существование файла
    file_path = os.path.join(base_dir, filename)
    # print(f'static_files: File path: {file_path}')
    if not os.path.isfile(file_path):
        current_app.logger.error(f'static_files: File not found: {file_path}')
        return f'File not found: {file_path}', 404

    # Возвращаем файл из базовой директории
    return send_from_directory(base_dir, filename)


@main.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        current_app.logger.warning(f'LOGIN: missing username or password. Data: {data}')
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter_by(user_name=username).first()
    if not user:
        current_app.logger.warning(f'LOGIN: user not found: {username}')
        return jsonify({'error': 'User not found'}), 404

    if not user.check_password(password):
        current_app.logger.warning(f'LOGIN: incorrect password for user: {username}')
        return jsonify({'error': 'Incorrect password'}), 401

    access_token = create_access_token(identity=str(user.user_id))
    current_app.logger.info(f'LOGIN: success for user: {username}')
    return jsonify({'user': user.to_dict(), 'access_token': access_token}), 200


@main.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        current_app.logger.warning(f'REGISTER: missing username/email/password. Data: {data}')
        return jsonify({'error': 'Username, email and password are required'}), 400

    if not validate_email(email):
        current_app.logger.warning(f'REGISTER: invalid email format: {email}')
        return jsonify({'error': 'Invalid email format'}), 400

    is_valid, message = validate_password(password)
    if not is_valid:
        current_app.logger.warning(f'REGISTER: invalid password: {message}')
        return jsonify({'error': message}), 400

    existing_username = User.query.filter_by(user_name=username).first()
    if existing_username:
        current_app.logger.warning(f'REGISTER: username already taken: {username}')
        return jsonify({'error': 'Username already taken'}), 400

    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        current_app.logger.warning(f'REGISTER: email already registered: {email}')
        return jsonify({'error': 'Email already registered'}), 400

    user = User(user_name=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=str(user.user_id))
    current_app.logger.info(f'REGISTER: user created: {username}, {email}')
    return jsonify({'user': user.to_dict(), 'access_token': access_token}), 201


@main.route('/api/logout', methods=['POST'])
def api_logout():
    return jsonify({'result': 'OK'})


@main.route('/api/user', methods=['GET'])
@jwt_required()
def api_current_user():
    return jsonify(current_user.to_dict()), 200


@main.route('/temp/<path:filename>', methods=['GET'])
def get_temp_files(filename):
    base_dir = os.path.join(current_app.root_path, 'app', 'temp')
    file_path = os.path.join(base_dir, filename)
    if not os.path.exists(file_path):
        if filename.startswith('edge_audio_'):
            record_id = filename.replace('edge_audio_', '').replace('.mp3', '')
            message = ChatHistory.query.filter_by(message_id=record_id).first()
            if not message:
                abort(404, description='Message not found')
            del_all_audio_files()  # очищаем временную папку от старых генераций
            result = generate_tts(text=message.text, record_id=record_id)  # Вызов функции TTS
            if result:  # Проверяем, был ли файл создан
                return send_file(file_path)
            else:
                abort(404, description=result)
    else:
        return send_file(file_path)

    return 'File not found', 404


@main.route('/get_tts_audio', methods=['POST'])
def get_tts_audio():
    text = request.form.get('text')
    if not text:
        abort(400, description="No text provided")

    result = generate_tts(text=text)  # Вызов функции TTS
    if result:  # Проверяем, был ли файл создан
        return send_file(result)
    else:
        abort(404, description="File not found")


@main.route('/get_scenario/<string:name>', methods=['GET'])
def get_scenario(name):
    if name == 'my_day':
        scenario = create_daily_scenario()
        # print(f'get_scenario: my_day: {scenario}')
        return {"scenario": scenario}, 200
    scenario_path = os.path.join(current_app.root_path, 'app', 'user_data', 'scenarios', f'{name}.json')
    # print(f'get_scenario: scenario_path: {scenario_path}')
    try:
        with open(scenario_path, 'r', encoding='utf-8') as file:
            scenario = json.load(file)
    except Exception as e:
        print(f'action_module_processing: {e}')
        abort(404, description=f"Scenario error: {e}")
    if scenario:
        # print(f'get_scenario: scenario: {scenario}')
        return {"scenario": scenario}, 200
    else:
        abort(404, description="Scenario not found")


@main.route('/get_tts_audio_filename', methods=['POST'])
def get_tts_audio_filename():
    text = request.form.get('text')
    if not text:
        abort(400, description="No text provided")

    result = generate_tts(text=text)  # Вызов функции TTS, которая возвращает путь к файлу
    if result and os.path.exists(result):  # Проверяем, был ли файл создан и существует ли он
        edge_filename = result.replace('\\', '/').split('/')[-1]
        return {'filename': edge_filename}, 200  # Отправляем имя файла
    else:
        abort(404, description="File not found")


def save_message_to_base(user_id, text):
    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        return {'error': 'User not found'}, 404

    message = ChatHistory(user_id=user.user_id, text=text)
    db.session.add(message)
    db.session.commit()

    # Преобразуем сообщение в словарь
    message_dict = message.to_dict()

    return message_dict, 201


'''@main.route('/api/chat/new_message', methods=['POST'])
def api_new_message():
    data = request.get_json()
    user_id = data.get('user_id')
    text = data.get('text')
    files = data.get('files')

    # Проверяем корректность данных
    if not user_id or not text:
        return jsonify({'error': 'Invalid data'}), 400

    # Вызываем общую функцию сохранения и трансляции сообщения
    message, status_code = save_message_to_base(user_id, text, files)

    # Если ошибка, возвращаем её как ответ
    if status_code != 201:
        return jsonify(message), status_code

    # Если всё хорошо, возвращаем успешный ответ
    return jsonify({'result': 'OK'}), status_code'''


def message_emit(status_code, message, namespace='/chat'):
    # current_app.logger.debug(f'Emit message: {message}')
    if status_code == 201:
        emit('message', message, namespace=namespace, to=request.sid)
    else:
        emit('error', message, namespace=namespace, to=request.sid)


@main.route('/chat/new_message', methods=['POST'])
@jwt_required()
def new_message():
    data = request.form
    files = request.files

    # Преобразуем ImmutableMultiDict в обычный словарь и выводим его содержимое
    data_dict = data.to_dict(flat=False)
    files_dict = {key: files.getlist(key) for key in files}

    # print('data: ', data_dict)
    # print('files: ', files_dict)

    # Проверяем корректность данных
    user_id = data.get('user_id')
    text = data.get('text')
    if not user_id or not text:
        return jsonify({'error': 'Invalid data'}), 400

    # Вызываем общую функцию сохранения сообщения
    message, status_code = save_message_to_base(user_id, text)
    result = {'messages': [message]}

    secretary_answer = answer_from_secretary(text, files)
    # current_app.logger.debug(f'Secretary answer: {secretary_answer}')
    if secretary_answer:
        message, status_code = save_message_to_base('2', secretary_answer.get('text'))
        message['params'] = secretary_answer.get('params', None)
        message['context'] = secretary_answer.get('context', None)
        result['messages'].append(message)
        result['status_code'] = status_code
    else:
        message, status_code = save_message_to_base('2', 'Уточните запрос')
        result['messages'].append(message)
        result['status_code'] = status_code
    return jsonify(result), status_code


@socketio.on('new_message', namespace='/chat')
def handle_new_message(data):
    user_id = data.get('user_id')
    text = data.get('text')
    files = data.get('files', None)
    # print('data: ', data)
    # Проверяем корректность данных

    if not user_id or not text:
        emit('error', {'error': 'Invalid data'}, to=request.sid)
        return

    # Вызываем общую функцию сохранения сообщения
    message, status_code = save_message_to_base(user_id, text)
    # Вызываем общую функцию трансляции сообщения
    message_emit(status_code, message)

    secretary_answer = answer_from_secretary(text, files)
    # current_app.logger.debug(f'Secretary answer: {secretary_answer}')
    if secretary_answer:
        message, status_code = save_message_to_base('2', secretary_answer.get('text'))
        message_emit(status_code, message)
    else:
        message, status_code = save_message_to_base('2', 'Уточните запрос')
        message_emit(status_code, message)


# Маршрут для получения транскриптов при постоянном прослушивании
@socketio.on('new_transcript', namespace='/chat')
def handle_new_transcript(data):
    # current_app.logger.info(f'handle_new_transcript: data: {data}')
    user_id = data.get('user_id')
    text = data.get('text')
    # print(f'handle_new_transcript: {user_id}, {text}')
    if 'стоп стоп стоп' in text.lower() or 'stop stop stop' in text.lower():
        emit('stop_listening', to=request.sid)

    if text.lower() == 'секретарь привет':
        message, status_code = save_message_to_base(user_id='2', text='Здравствуйте')
        message_emit(status_code, message)
        return

    current_app.logger.debug(f'{user_id}: {text}')

    # Проверяем корректность данных
    if not user_id or not text:
        emit('error', {'error': 'Invalid data'}, to=request.sid)
        return

    # Передаем сообщение секретарю
    secretary_answer = answer_from_secretary(text)
    # print(secretary_answer)
    if secretary_answer:
        message, status_code = save_message_to_base(user_id=user_id, text=text)
        message_emit(status_code, message)
        message, status_code = save_message_to_base(user_id='2', text=secretary_answer.get('text'))
        message['params'] = secretary_answer.get('params', None)
        message['context'] = secretary_answer.get('context', None)
        # print(message)
        message_emit(status_code, message)


# Маршрут для редактирования записи в чате
@socketio.on('post_edited_record', namespace='/chat')
def post_edited_record(data, timezone=''):
    table_name = data.get('table_name')
    record_info = data.copy()
    del record_info['table_name']
    result = update_record(table_name, record_info)
    error = result.get('error')

    if error:
        emit('post_edited_record_response', {'status': 'error', 'message': error})
    else:
        emit('post_edited_record_response', {'status': 'OK'})


@main.route('/post_new_record', methods=['POST'])
@jwt_required()
def post_new_record():
    data = request.form
    files = request.files
    # current_app.logger.debug(f'post_new_record: {data}, {files}')
    table_name = data.get('table_name')
    record_info = data.get('record_info')
    result = save_to_base_modules(table_name, 'create', record_info, files)
    # current_app.logger.debug(f'post_new_record: {result}')
    error = result.get('error')
    new_record_info = result.get('params')
    # проверить есть ли ключ table name перед удалением
    if new_record_info:
        del new_record_info['table_name']
    if error:
        return jsonify(error), 404
    else:
        return jsonify(new_record_info), 201


@main.route('/post_edited_record_api', methods=['POST'])
@jwt_required()
def post_edited_record_api():
    data = request.form
    files = request.files
    table_name = data.get('table_name')
    record_info = data.get('record_info')
    # print(f'post_new_record: {table_name}, {record_info}')
    result = save_to_base_modules(table_name, 'update', record_info, files)
    error = result.get('error')
    updated_record_info = result.get('params')
    if updated_record_info:
        del updated_record_info['table_name']
    if error:
        return jsonify(error), 404
    else:
        return jsonify(updated_record_info), 201


@main.route('/get_tables', methods=['GET'])
@jwt_required()
def get_tables_route():
    tables = get_tables()
    # print(f'get_tables: {tables}')
    return jsonify({'tables': tables}), 200


def get_table_survey(table_name, conn):
    columns_names = get_columns_names()
    cursor = conn.cursor()

    # Получаем список столбцов из таблицы
    cursor.execute(f"PRAGMA table_info({table_name})")
    table_info = cursor.fetchall()

    # Проверка на существование таблицы
    if not table_info:
        return jsonify({'error': f"Table '{table_name}' does not exist."}), 400

    # Формируем список полей из таблицы
    columns = [col[1] for col in table_info]  # col[1] это имя столбца в таблице

    # Формируем структуру для JSON-ответа
    action = {
        "type": "survey",
        "table_name": table_name,
        "text": "Продиктуйте новую запись",
        "fields": []
    }

    for col in columns:
        field_name = columns_names.get(col, col)  # Если в columns_names нет, используем само имя столбца
        field_entry = {
            "field_id": col,
            "field_name": field_name,
            "check": "true"
        }
        action["fields"].append(field_entry)

    return action


# маршрут для получения списка дней на которые есть записи в журнале по имени таблицы
@main.route('/get_days', methods=['GET'])
@jwt_required()
def get_days_route():
    db_path = current_app.config.get('MAIN_DB_PATH', '')
    table_name = request.args.get('table_name')
    month = request.args.get('month')
    year = request.args.get('year')  # Новый параметр year
    timezone_param = request.args.get('timezone', '0')
    try:
        client_timezone_offset = int(timezone_param)
    except ValueError:
        client_timezone_offset = 0  # Смещение времени клиента в минутах от UTC

    # Проверка на наличие входных параметров
    if not table_name or not month or not year:
        return jsonify({'error': 'Missing table_name, month, or year parameters'}), 400

    # Проверка, что month и year являются числовыми значениями
    if not month.isdigit() or not (1 <= int(month) <= 12) or not year.isdigit() or len(year) != 4:
        return jsonify({'error': 'Invalid month or year format'}), 400
    # current_app.logger.debug(f'get_days: {table_name}, {month}, {year}, {client_timezone_offset}')
    try:
        start_date = datetime(int(year), int(month), 1)
        if int(month) == 12:
            end_date = datetime(int(year) + 1, 1, 1)  # Январь следующего года
        else:
            end_date = datetime(int(year), int(month) + 1, 1)  # Первый день следующего месяца

        # Применяем смещение временной зоны клиента
        start_date_utc = start_date - timedelta(minutes=client_timezone_offset)
        end_date_utc = end_date - timedelta(minutes=client_timezone_offset)

        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
            # Используем параметризованный запрос для безопасности
            cursor.execute(f"""
                            SELECT date FROM {table_name} 
                            WHERE date >= ? AND date < ?
                        """, (start_date_utc.strftime('%Y-%m-%d'), end_date_utc.strftime('%Y-%m-%d')))

            # Сохраняем результат в переменную dates
            dates = cursor.fetchall()

            # current_app.logger.debug(f'get_days: {dates}')

            days = []
            for date in dates:
                # Преобразуем строку даты в объект datetime
                # current_app.logger.debug(f'{date[0]}')
                date_obj = datetime.strptime(date[0], '%Y-%m-%d %H:%M:%S')
                # current_app.logger.debug(f'{date_obj}')
                # Применяем обратное смещение временной зоны клиента (возвращаем в часовой пояс клиента)
                client_time = date_obj + timedelta(minutes=client_timezone_offset)

                # Добавляем преобразованную дату в список
                days.append(client_time)

                # Получаем все уникальные даты
            cursor.execute(f"""
                                SELECT DATETIME(date) FROM {table_name}
                            """)
            unique_dates_raw = cursor.fetchall()
            # current_app.logger.debug(f'get_days: {unique_dates_raw}')
            unique_dates_set = set()
            for date in unique_dates_raw:
                # current_app.logger.info(f'get_days: {date}')
                # Преобразуем строку даты в объект datetime
                datetime_obj = datetime.strptime(date[0], '%Y-%m-%d %H:%M:%S')
                # Применяем обратное смещение временной зоны клиента
                client_date = datetime_obj + timedelta(minutes=client_timezone_offset)
                # Добавляем уникальную дату в список
                unique_dates_set.add(client_date.date().isoformat())

            # current_app.logger.debug(f'get_days: {unique_dates_set}')
            unique_dates = sorted(list(unique_dates_set))
            survey = get_table_survey(table_name, connection)
            # current_app.logger.debug(f'get_days: survey: {survey}')

    except Exception as e:
        current_app.logger.error(f'get_days: error: {e}')
        return jsonify({'error': str(e)}), 404

    # print(f'get_days: {days}')
    return jsonify({'days': days, 'unique_dates': unique_dates, 'survey': survey}), 200


# @main.route('/journals', methods=['GET'])
# @jwt_required()
# def get_file():
#     current_app.logger.debug(f'get_file{request.args}')
#     # Получение параметров из запроса
#     category = request.args.get('category')
#     date_folder = request.args.get('date_folder')
#     filename = request.args.get('filename')
#     # print(f'get_file: {category}, {date_folder}, {filename}')

#     BASE_DIRECTORY = os.path.join(current_app.root_path, 'app', 'user_data', 'journals')

#     # Построение пути к файлу
#     file_path = os.path.join(BASE_DIRECTORY, category, date_folder, filename)
#     # print(f'get_file: file_path: {file_path}')

#     # Проверка существования файла
#     if os.path.exists(file_path):
#         # Отправка файла клиенту
#         return send_from_directory(directory=os.path.join(BASE_DIRECTORY, category, date_folder), path=filename)
#     else:
#         # Возвращение ошибки 404, если файл не найден
#         abort(404, description="File not found")


@main.route('/journals/file', methods=['GET'])
@jwt_required()
def get_journal_file():
    # current_app.logger.debug(f'get_journal_file{request.args}')
    """Serve files from the journals folder."""
    category = request.args.get('category')
    date_folder = request.args.get('date_folder')
    filename = request.args.get('filename')

    base_dir = os.path.join(current_app.root_path, 'user_data', 'journals',
                            category or '', date_folder or '')
    file_path = os.path.join(base_dir, filename)
    # current_app.logger.debug(f'get_journal_file: {file_path}')
    if not os.path.isfile(file_path):
        abort(404, description="File not found")
    return send_from_directory(base_dir, filename)


@main.route('/get_table_data', methods=['GET'])
@jwt_required()
def get_table_data():
    table_name = request.args.get('table_name')
    date = request.args.get('date')
    timezone_offset = request.args.get('timezone_offset', None)

    try:
        records, columns = fetch_table_records(table_name, date, timezone_offset)
        if not records:
            return jsonify({'records': [], 'columns': columns}), 200
        result = [dict(r) for r in records]
        return jsonify({'records': result, 'columns': columns}), 200
    except Exception as e:
        current_app.logger.error(f'Ошибка при получении записей: {e}')
        return jsonify({'error': str(e)}), 500


@main.route('/update_record_from_blocks', methods=['POST'])
@jwt_required()
def update_record_from_blocks():
    data = request.get_json()
    table_name = data.get('table_name')
    records = data.get('records', [])
    # current_app.logger.debug(f'update_record_from_blocks: {table_name}, {records}')
    if not table_name or not isinstance(records, list):
        current_app.logger.error(f'update_record_from_blocks: Invalid payload')
        return jsonify({'error': 'Invalid payload'}), 400

    try:
        for record in records:
            res = update_record(table_name, record)
            if res.get('error'):
                current_app.logger.error(f"Ошибка обновления записи {record.get('id')}: {res['error']}")
        return jsonify({'success': True}), 200
    except Exception as e:
        current_app.logger.error(f'Ошибка при обновлении записи: {e}')
        return jsonify({'error': str(e)}), 500


@main.route('/get_records', methods=['POST'])
@jwt_required()
def get_records_route():
    try:
        data = request.get_json() or {}
        current_app.logger.debug(f'get_records_route: {data}')
        table_name = data.get('table_name')
        filters = data.get('filters', {})

        if not table_name:
            return jsonify({'error': 'table_name is required'}), 400

        if not filters or all(not v for v in filters.values()):
            return (jsonify({'error': 'Фильтры не заданы. Запрос отклонён для предотвращения получения всех записей.'}),
                    400)

        records, columns = fetch_filtered_records(table_name, filters)

        result = [dict(r) for r in records]
        return jsonify({'records': result, 'columns': columns}), 200

    except ValueError as e:
        current_app.logger.error(f'Validation error: {e}')
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f'Ошибка при получении отфильтрованных блоков: {e}')
        return jsonify({'error': str(e)}), 500


@main.route('/get_tables_filters/<table_name>', methods=['GET'])
@jwt_required()
def api_get_filter_values(table_name):
    return get_all_filters(table_name)
