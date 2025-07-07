# twitch/routes.py
from flask import request, jsonify
from . import twitchAPI
from .handlers import new_twitch_message
from app.main.handlers import save_and_emit_message


@twitchAPI.route('/twitch_message', methods=['POST'])
def twitch_message():
    data = request.get_json()
    print(data)
    result, status_code = new_twitch_message(data)
    text = result.get('answer', '')
    user_id = 2
    if text:
        message, status_code = save_and_emit_message(user_id, text)
    return jsonify(result), status_code

