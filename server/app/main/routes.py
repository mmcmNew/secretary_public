import re
from datetime import timedelta, datetime

from flask_socketio import emit
import json
import os

from . import main
from .handlers import fetch_table_records, save_and_emit_message
from app import socketio
from flask import Response, current_app, abort, render_template, make_response
from flask import request, jsonify, send_from_directory, send_file
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    current_user,
    get_jwt_identity,
)
from werkzeug.security import check_password_hash
from sqlalchemy import or_
from .models import *
from ..subscription_models import UserSubscription
from ..access_control import get_user_permissions
from app import db

from app.secretary import answer_from_secretary
from app.db_utils import (
    update_record,
    save_to_base_modules,
)
from app.command_utils import (
    get_modules,
)
from app.text_to_edge_tts import generate_tts, del_all_audio_files
from ..tasks.handlers import create_daily_scenario
from app.get_records_utils import get_all_filters, fetch_filtered_records
from app.journals.models import JournalEntry
from app.data_paths import get_system_data_path


EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$"


def validate_email(email: str) -> bool:
    return re.match(EMAIL_REGEX, email) is not None


def validate_password(password: str):
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    # if not re.search(r'[A-Z]', password):
    #     return False, 'Password must contain an uppercase letter'
    # if not re.search(r'[a-z]', password):
    #     return False, 'Password must contain a lowercase letter'
    # if not re.search(r'\d', password):
    #     return False, 'Password must contain a digit'
    return True, ""


@current_app.route("/sw.js")
def serve_sw():
    try:
        # Отдаем sw.js из папки dist
        dist_folder = current_app.config.get("DIST_FOLDER", "")
        response = make_response(send_from_directory(dist_folder, "sw.js"))
        response.headers["Content-Type"] = "application/javascript"
        # Service-Worker-Allowed НЕ НУЖЕН
        return response
    except Exception as e:
        current_app.logger.error(f"Error serving sw.js: {e}")
        return "SW not found", 404


@main.route("/manifest.webmanifest")
def serve_manifest():
    try:
        dist_folder = current_app.config.get("DIST_FOLDER", "")
        # Отдаем manifest.webmanifest из папки dist
        response = make_response(
            send_from_directory(dist_folder, "manifest.webmanifest")
        )
        response.headers["Content-Type"] = "application/manifest+json"
        return response
    except Exception as e:
        current_app.logger.error(f"Error serving manifest.webmanifest: {e}")
        return "Manifest not found", 404


def ws_log(event):
    """Log websocket connect and disconnect events."""
    current_app.logger.info(
        f"Client {event} from chat websocket"
    )


socketio.on_event("connect", lambda auth=None: ws_log("connected"), namespace="/chat")
socketio.on_event("disconnect", lambda: ws_log("disconnected"), namespace="/chat")


@socketio.on("connect", namespace="/updates")
def updates_ws_connect():
    current_app.logger.info("Client connected to updates websocket")


@socketio.on("disconnect", namespace="/updates")
def updates_ws_disconnect():
    current_app.logger.info("Client disconnected from updates websocket")


@socketio.on("request_messages", namespace="/chat")
def handle_request_messages():
    """WebSocket обработчик для запроса сообщений"""
    messages = get_messages_data()
    emit("all_messages", messages, to=request.sid)


@main.route("/api/chat/messages", methods=["GET"])
def get_messages():
    """HTTP API для получения сообщений"""
    messages = get_messages_data()
    return Response(json.dumps(messages), mimetype="application/json")


def get_messages_data():
    """Общая функция для получения данных сообщений"""
    messages_list = (
        ChatHistory.query.order_by(ChatHistory.message_id.desc()).limit(100).all()
    )
    if messages_list:
        messages_list = messages_list[::-1]
        messages = []
        for message in messages_list:
            # Получаем пользователя отдельно
            user = User.query.filter_by(user_id=message.user_id).first()
            message_dict = {
                "message_id": str(message.message_id),
                "user": (
                    user.to_dict()
                    if user
                    else {"user_name": "Unknown", "avatar_src": "default.png"}
                ),
                "text": message.text,
                "datetime": message.datetime.isoformat() + "Z",
                "files": message.files,
            }
            messages.append(message_dict)
    else:
        messages = []
    return messages


@main.route("/avatars/<path:filename>", methods=["GET"])
@main.route("/sounds/<path:filename>", methods=["GET"])
@main.route("/memory/<path:filename>", methods=["GET"])
@jwt_required(optional=True)
def static_files(filename):
    prefix_map = {
        "/avatars": "avatars",
        "/sounds": "sounds",
        "/memory": "memory_images",
    }

    prefix = "/" + request.path.strip("/").split("/")[0]
    system_dir_key = prefix_map.get(prefix)

    if system_dir_key is None:
        return "File not found", 404

    if prefix == "/memory" and current_user:
        user_memory_path = get_system_data_path(current_user.id, "memory")
        user_file = os.path.join(user_memory_path, filename)
        if os.path.isfile(user_file):
            return send_from_directory(user_memory_path, filename)

    system_path = get_system_data_path(system_dir_key)
    if system_path and os.path.isfile(os.path.join(system_path, filename)):
        return send_from_directory(system_path, filename)

    return "File not found", 404


@main.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        current_app.logger.warning(f"LOGIN: missing username or password. Data: {data}")
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(user_name=username).first()
    if not user or not user.check_password(password):
        current_app.logger.warning(
            f"LOGIN: authentication failed for username: {username}"
        )
        return jsonify({"error": "Invalid username or password"}), 401

    # Проверяем активную подписку и обновляем уровень доступа при необходимости
    active_sub = UserSubscription.query.filter_by(
        user_id=user.user_id, is_active=True
    ).first()
    if active_sub:
        if active_sub.end_date and active_sub.end_date < datetime.utcnow():
            active_sub.is_active = False
            user.access_level_id = 1
            db.session.commit()
    permissions = get_user_permissions(getattr(user, "access_level_id", 1))

    access_token = create_access_token(identity=str(user.user_id))
    refresh_token = create_refresh_token(identity=str(user.user_id))
    current_app.logger.info(f"LOGIN: success for user: {username}")
    response = make_response(
        jsonify(
            {
                "user": user.to_dict(),
                "permissions": permissions,
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        ),
        200,
    )
    response.set_cookie(
        "access_token",
        access_token,
        secure=True,
        samesite="Lax",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        secure=True,
        samesite="Lax",
    )
    return response


@main.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        current_app.logger.warning(
            f"REGISTER: missing username/email/password. Data: {data}"
        )
        return jsonify({"error": "Username, email and password are required"}), 400

    if not validate_email(email):
        current_app.logger.warning(f"REGISTER: invalid email format: {email}")
        return jsonify({"error": "Invalid email format"}), 400

    is_valid, message = validate_password(password)
    if not is_valid:
        current_app.logger.warning(f"REGISTER: invalid password: {message}")
        return jsonify({"error": message}), 400

    existing_username = User.query.filter_by(user_name=username).first()
    if existing_username:
        current_app.logger.warning(f"REGISTER: username already taken: {username}")
        return jsonify({"error": "Username already taken"}), 400

    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        current_app.logger.warning(f"REGISTER: email already registered: {email}")
        return jsonify({"error": "Email already registered"}), 400

    user = User(user_name=username, email=email, modules=[])
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Инициализируем рабочее пространство пользователя
    user.initialize_user_workspace()

    access_token = create_access_token(identity=str(user.user_id))
    refresh_token = create_refresh_token(identity=str(user.user_id))
    current_app.logger.info(f"REGISTER: user created: {username}, {email}")
    response = make_response(
        jsonify(
            {
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        ),
        201,
    )
    response.set_cookie(
        "access_token",
        access_token,
        secure=True,
        samesite="Lax",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        secure=True,
        samesite="Lax",
    )
    return response


@main.route("/api/refresh", methods=["POST"])
@jwt_required(refresh=True)
def api_refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    response = make_response(
        jsonify({"access_token": new_access_token}),
        200,
    )
    response.set_cookie(
        "access_token",
        new_access_token,
        secure=True,
        samesite="Lax",
    )
    return response


@main.route("/api/logout", methods=["POST"])
def api_logout():
    response = make_response(jsonify({"result": "OK"}))
    response.set_cookie("access_token", "", expires=0)
    response.set_cookie("refresh_token", "", expires=0)
    return response


@main.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for Docker"""
    return (
        jsonify(
            {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "1.0.0",
            }
        ),
        200,
    )


@main.route("/api/user", methods=["GET"])
@jwt_required()
def api_current_user():
    return jsonify(current_user.to_dict()), 200


@main.route("/temp/<path:filename>", methods=["GET"])
def get_temp_files(filename):
    base_dir = os.path.join(current_app.root_path, "temp")
    file_path = os.path.join(base_dir, filename)
    if not os.path.exists(file_path):
        if filename.startswith("edge_audio_"):
            record_id = filename.replace("edge_audio_", "").replace(".mp3", "")
            message = ChatHistory.query.filter_by(message_id=record_id).first()
            if not message:
                abort(404, description="Message not found")
            del_all_audio_files()  # очищаем временную папку от старых генераций
            result = generate_tts(
                text=message.text, record_id=record_id
            )  # Вызов функции TTS
            if result:  # Проверяем, был ли файл создан
                return send_file(file_path)
            else:
                abort(404, description=result)
    else:
        return send_file(file_path)

    return "File not found", 404


@main.route("/get_tts_audio", methods=["POST"])
def get_tts_audio():
    text = request.form.get("text")
    if not text:
        abort(400, description="No text provided")

    result = generate_tts(text=text)  # Вызов функции TTS
    if result:  # Проверяем, был ли файл создан
        return send_file(result)
    else:
        abort(404, description="File not found")


@main.route("/get_scenario/<string:name>", methods=["GET"])
@jwt_required(optional=True)
def get_scenario(name):
    if name == "my_day":
        scenario = create_daily_scenario()
        return {"scenario": scenario}, 200

    from app.data_paths import get_user_data_path, get_system_data_path

    scenario_path = None

    # Сначала ищем в пользовательских сценариях
    if current_user:
        user_scenarios_path = get_user_data_path(current_user.id, "scenarios")
        user_scenario_file = os.path.join(user_scenarios_path, f"{name}.json")
        if os.path.isfile(user_scenario_file):
            scenario_path = user_scenario_file

    # Если не найден, ищем в системных
    if not scenario_path:
        system_scenarios_path = get_system_data_path("scenarios")
        if system_scenarios_path:
            system_scenario_file = os.path.join(system_scenarios_path, f"{name}.json")
            if os.path.isfile(system_scenario_file):
                scenario_path = system_scenario_file

    if not scenario_path:
        abort(404, description="Scenario not found")

    try:
        with open(scenario_path, "r", encoding="utf-8") as file:
            scenario = json.load(file)
        return {"scenario": scenario}, 200
    except Exception as e:
        current_app.logger.error(f"get_scenario error: {e}")
        abort(404, description=f"Scenario error: {e}")


@main.route("/get_tts_audio_filename", methods=["POST"])
def get_tts_audio_filename():
    text = request.form.get("text")
    if not text:
        abort(400, description="No text provided")

    result = generate_tts(
        text=text
    )  # Вызов функции TTS, которая возвращает путь к файлу
    if result and os.path.exists(
        result
    ):  # Проверяем, был ли файл создан и существует ли он
        edge_filename = result.replace("\\", "/").split("/")[-1]
        return {"filename": edge_filename}, 200  # Отправляем имя файла
    else:
        abort(404, description="File not found")




@main.route("/chat/new_message", methods=["POST"])
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
    user_id = data.get("user_id")
    text = data.get("text")
    if not user_id or not text:
        return jsonify({"error": "Invalid data"}), 400

    # Сохраняем сообщение и отправляем его через SocketIO
    message, status_code = save_and_emit_message(user_id, text)
    result = {"messages": [message]}

    secretary_answer = answer_from_secretary(text, files)
    # current_app.logger.debug(f'Secretary answer: {secretary_answer}')
    if secretary_answer:
        message, status_code = save_and_emit_message("2", secretary_answer.get("text"))
        message["params"] = secretary_answer.get("params", None)
        message["context"] = secretary_answer.get("context", None)
        result["messages"].append(message)
        result["status_code"] = status_code
    else:
        message, status_code = save_and_emit_message("2", "Уточните запрос")
        result["messages"].append(message)
        result["status_code"] = status_code
    return jsonify(result), status_code


@socketio.on("new_message", namespace="/chat")
def handle_new_message(data):
    user_id = data.get("user_id")
    text = data.get("text")
    files = data.get("files", None)
    # print('data: ', data)
    # Проверяем корректность данных

    if not user_id or not text:
        emit("error", {"error": "Invalid data"}, to=request.sid)
        return

    # Сохраняем сообщение и отправляем его через SocketIO
    save_and_emit_message(user_id, text)

    secretary_answer = answer_from_secretary(text, files)
    # current_app.logger.debug(f'Secretary answer: {secretary_answer}')
    if secretary_answer:
        save_and_emit_message("2", secretary_answer.get("text"))
    else:
        save_and_emit_message("2", "Уточните запрос")


# Маршрут для получения транскриптов при постоянном прослушивании
@socketio.on("new_transcript", namespace="/chat")
def handle_new_transcript(data):
    # current_app.logger.info(f'handle_new_transcript: data: {data}')
    user_id = data.get("user_id")
    text = data.get("text")
    # print(f'handle_new_transcript: {user_id}, {text}')
    if "стоп стоп стоп" in text.lower() or "stop stop stop" in text.lower():
        emit("stop_listening", to=request.sid)

    if text.lower() == "секретарь привет":
        save_and_emit_message(user_id="2", text="Здравствуйте")
        return

    current_app.logger.debug(f"{user_id}: {text}")

    # Проверяем корректность данных
    if not user_id or not text:
        emit("error", {"error": "Invalid data"}, to=request.sid)
        return

    # Передаем сообщение секретарю
    secretary_answer = answer_from_secretary(text)
    # print(secretary_answer)
    if secretary_answer:
        save_and_emit_message(user_id=user_id, text=text)
        message, status_code = save_and_emit_message(
            user_id="2", text=secretary_answer.get("text")
        )
        message["params"] = secretary_answer.get("params", None)
        message["context"] = secretary_answer.get("context", None)


# Маршрут для редактирования записи в чате
@socketio.on("post_edited_record", namespace="/chat")
def post_edited_record(data, timezone=""):
    table_name = data.get("table_name")
    record_info = data.copy()
    del record_info["table_name"]
    result = update_record(table_name, record_info)
    error = result.get("error")

    if error:
        emit("post_edited_record_response", {"status": "error", "message": error})
    else:
        emit("post_edited_record_response", {"status": "OK"})


@main.route("/post_new_record", methods=["POST"])
@jwt_required()
def post_new_record():
    data = request.form
    files = request.files
    # current_app.logger.debug(f'post_new_record: {data}, {files}')
    table_name = data.get("table_name")
    record_info = data.get("record_info")
    result = save_to_base_modules(table_name, "create", record_info, files)
    # current_app.logger.debug(f'post_new_record: {result}')
    error = result.get("error")
    new_record_info = result.get("params")
    # проверить есть ли ключ table name перед удалением
    if new_record_info:
        del new_record_info["table_name"]
    if error:
        return jsonify(error), 404
    else:
        return jsonify(new_record_info), 201


@main.route("/post_edited_record_api", methods=["POST"])
@jwt_required()
def post_edited_record_api():
    data = request.form
    files = request.files
    table_name = data.get("table_name")
    record_info = data.get("record_info")
    # print(f'post_new_record: {table_name}, {record_info}')
    result = save_to_base_modules(table_name, "update", record_info, files)
    error = result.get("error")
    updated_record_info = result.get("params")
    if updated_record_info:
        del updated_record_info["table_name"]
    if error:
        return jsonify(error), 404
    else:
        return jsonify(updated_record_info), 201


@main.route("/get_tables", methods=["GET"])
@jwt_required()
def get_tables_route():
    from app.journals.models import JournalSchema

    # Только пользовательские журналы
    tables = []
    user_schemas = JournalSchema.query.filter_by(user_id=current_user.id).all()
    for schema in user_schemas:
        tables.append(
            {
                "label": schema.display_name,
                "src": schema.name,
                "type": "journal",
                "user_schema": True,
            }
        )

    return jsonify({"tables": tables}), 200


def get_table_survey(table_name, conn=None):
    # Проверяем пользовательские журналы
    try:
        from app.journals.models import JournalSchema

        user_schema = JournalSchema.query.filter_by(
            user_id=current_user.id, name=table_name
        ).first()
        if user_schema:
            # Формируем структуру для JSON-ответа
            action = {
                "type": "survey",
                "table_name": table_name,
                "text": "Продиктуйте новую запись",
                "fields": [],
            }

            for field in user_schema.fields:
                field_entry = {
                    "field_id": field["name"],
                    "field_name": field["label"],
                    "type": field.get("type", "text"),
                    "check": "true",
                }
                # Добавляем дополнительные свойства для полей типа file
                if field.get("type") == "file":
                    field_entry["multiple"] = field.get("multiple", False)
                action["fields"].append(field_entry)
            return action
    except:
        pass

    return None


@main.route("/get_table_data", methods=["GET"])
@jwt_required()
def get_table_data():
    table_name = request.args.get("table_name")
    date = request.args.get("date")
    timezone_offset = request.args.get("timezone_offset", None)

    try:
        records, columns = fetch_table_records(table_name, date, timezone_offset)
        if not records:
            return jsonify({"records": [], "columns": columns}), 200

        # Проверяем пользовательские журналы
        from app.journals.models import JournalSchema

        user_schema = JournalSchema.query.filter_by(
            user_id=current_user.id, name=table_name
        ).first()

        if user_schema:
            result = records
        else:
            result = [dict(r) for r in records]
        return jsonify({"records": result, "columns": columns}), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении записей: {e}")
        return jsonify({"error": str(e)}), 500

