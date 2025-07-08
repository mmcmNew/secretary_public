from flask import Response, request, jsonify, current_app
from flask_socketio import emit
from flask_jwt_extended import jwt_required

from app import socketio
from ..models import User, ChatHistory
from ..handlers import save_and_emit_message
from app.secretary import answer_from_secretary
from app.db_utils import update_record
import json

from . import chat_bp


def ws_log(event):
    current_app.logger.info(f"Client {event} from chat websocket")


socketio.on_event("connect", lambda auth=None: ws_log("connected"), namespace="/chat")
socketio.on_event("disconnect", lambda: ws_log("disconnected"), namespace="/chat")


@socketio.on("request_messages", namespace="/chat")
def handle_request_messages():
    messages = get_messages_data()
    emit("all_messages", messages, to=request.sid)


@chat_bp.route("/api/chat/messages", methods=["GET"])
def get_messages():
    messages = get_messages_data()
    return Response(json.dumps(messages), mimetype="application/json")


def get_messages_data():
    messages_list = ChatHistory.query.order_by(ChatHistory.message_id.desc()).limit(100).all()
    if messages_list:
        messages_list = messages_list[::-1]
        messages = []
        for message in messages_list:
            user = User.query.filter_by(user_id=message.user_id).first()
            message_dict = {
                "message_id": str(message.message_id),
                "user": user.to_dict() if user else {"user_name": "Unknown", "avatar_src": "default.png"},
                "text": message.text,
                "datetime": message.datetime.isoformat() + "Z",
                "files": message.files,
            }
            messages.append(message_dict)
    else:
        messages = []
    return messages


@chat_bp.route("/chat/new_message", methods=["POST"])
@jwt_required()
def new_message():
    data = request.form
    files = request.files

    user_id = data.get("user_id")
    text = data.get("text")
    if not user_id or not text:
        return jsonify({"error": "Invalid data"}), 400

    message, status_code = save_and_emit_message(user_id, text)
    result = {"messages": [message]}

    secretary_answer = answer_from_secretary(text, files)
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

    if not user_id or not text:
        emit("error", {"error": "Invalid data"}, to=request.sid)
        return

    save_and_emit_message(user_id, text)

    secretary_answer = answer_from_secretary(text, files)
    if secretary_answer:
        save_and_emit_message("2", secretary_answer.get("text"))
    else:
        save_and_emit_message("2", "Уточните запрос")


@socketio.on("new_transcript", namespace="/chat")
def handle_new_transcript(data):
    user_id = data.get("user_id")
    text = data.get("text")
    if "стоп стоп стоп" in text.lower() or "stop stop stop" in text.lower():
        emit("stop_listening", to=request.sid)

    if text.lower() == "секретарь привет":
        save_and_emit_message(user_id="2", text="Здравствуйте")
        return

    current_app.logger.debug(f"{user_id}: {text}")

    if not user_id or not text:
        emit("error", {"error": "Invalid data"}, to=request.sid)
        return

    secretary_answer = answer_from_secretary(text)
    if secretary_answer:
        save_and_emit_message(user_id=user_id, text=text)
        message, _ = save_and_emit_message(
            user_id="2", text=secretary_answer.get("text")
        )
        message["params"] = secretary_answer.get("params", None)
        message["context"] = secretary_answer.get("context", None)


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
