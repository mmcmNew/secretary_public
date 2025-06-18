# twitch/routes.py
from flask import request, jsonify
from . import twitchAPI
from .handlers import new_twitch_message
from app import socketio
from app.main.routes import save_message_to_base


@twitchAPI.route('/twitch_message', methods=['POST'])
def twitch_message():
    data = request.get_json()
    print(data)
    result, status_code = new_twitch_message(data)
    text = result.get('answer', '')
    user_id = 2
    if text:
        message, status_code = save_message_to_base(user_id, text)
        socketio.emit('message', message, namespace='/chat')
    return jsonify(result), status_code

