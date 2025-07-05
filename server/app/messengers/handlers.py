import json
from datetime import datetime

from flask import current_app

import requests
from flask import request, jsonify
from ..db_utils import save_to_base_modules

from ..get_records_utils import get_records_by_ids  # или где ты там сохранишь


def post_records_to_socials(data):
    records_ids = data.get("records_ids", [])
    table_name = data.get("table_name",  "posts_journal")
    messenger_type = data.get("messenger_type", "telegram")
    # query_type = data.get("type", "fix")

    if not records_ids or not table_name:
        return {'error': 'Missing record_ids or table_name'}, 400

    record = get_records_by_ids(table_name, records_ids)
    if not record:
        return {'error': 'Records not found'}, 404

    post_result = requests.post("https://n8n.ndomen.online/webhook/535b1ebe-be59-487f-8b51-6b19f3121f03",
                                json={"user_message": record})
    if post_result.status_code != 200:
        current_app.logger.error(f"Ошибка при публикации записи: {post_result.text}")
        return {'error': 'Ошибка при публикации записи'}, 500

    try:
        # Парсинг Telegram-ответа
        tg_result = post_result.json().get("result")
        # current_app.logger.info(f"AI WebHook and Telegram post success {tg_result}")
        if tg_result:
            message_id = tg_result.get("message_id")
            chat_id = tg_result.get("chat", {}).get("id")
            chat_title = tg_result.get("chat", {}).get("title")
            chat_username = tg_result.get("chat", {}).get("username")
            timestamp = tg_result.get("date")

            record_info = {}

            # Формируем ссылку и дату
            message_url = f"https://t.me/{chat_username}/{message_id}" if chat_username and message_id else ""
            publish_date = datetime.fromtimestamp(timestamp).isoformat() if timestamp else ""

            # Обновляем record_info
            record_info["id"] = records_ids[0]
            record_info["publish_date"] = publish_date
            record_info["posts_src"] = message_url
            record_info["channels"] = 'Telegram'
            # current_app.logger.info(f"AI WebHook and Telegram post success {record_info}")
        result = save_to_base_modules(table_name, 'update', record_info)
        # current_app.logger.info(f"Save to base result:{result}")
        if result.get('error'):
            current_app.logger.error(f"Error saving to base: {result.get('error')}")
            return {'error': result.get('error')}, 500

        current_app.logger.info(f"Telegram post success")
        return {'result': 'success'}, 200

    except Exception as e:
        current_app.logger.error(f"Ошибка при записи результата в базу: {e}")
        return jsonify({'error': 'Ошибка при записи результата в базу'}), 500
