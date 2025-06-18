import json

from flask import current_app

from werkzeug.datastructures import FileStorage
from io import BytesIO
import base64
from datetime import datetime

import requests
from flask import request, jsonify
from . import ai_routes
from ..utilites import save_to_base_modules, get_columns_names

from ..get_records_utils import get_records_by_ids
from app.block_notes_utiltes import build_blocks_from_records


@ai_routes.route('/ai_record_fix', methods=['POST'])
def ai_record_fix_route():
    data = request.get_json()
    record = data.get("record", "")
    table_name = data.get("table_name")
    query_type = data.get("type", "fix")
    # current_app.logger.info(f"AI record fix route: {data}")

    if not table_name:
        return jsonify({'error': 'Missing table_name'}), 400

    # records = get_records_by_ids(table_name, records_ids)

    if not record:
        return jsonify({'error': 'Record not found'}), 404

    prompt_header = {
        "fix": "Это записи из базы. Исправь ошибки и сделай текст более читабельным. "
               "Можешь добавить какие то факты которые ты знаешь отдельно в примечании, но не выдумывай, "
               "а только добавляй информацию в которой ты точно уверен. Итоговая запись должна быть оформленным в md "
               "текстом с отредактированной записью",
        "summarize": "Сделай краткое резюме для каждой из записей.",
        "tag": "Добавь релевантные теги для каждой записи.",
    }

    prompt = prompt_header.get(query_type, prompt_header["fix"])
    final_prompt = f"{prompt}\nВот запись:\n{record}"

    # current_app.logger.info(final_prompt)
    ai_response = requests.post(
        "https://n8n.ndomen.online/webhook/4999da23-b30e-494b-9435-9948be5ab8d4",
        json={"user_message": final_prompt}
    )

    if ai_response.status_code != 200:
        # current_app.logger.error(f"AI webhook error: {ai_response.text}")
        return jsonify({'error': 'AI webhook error'}), 500

    try:
        ai_json = ai_response.json()
        content = ai_json[0]['message']['content']
        # current_app.logger.info(f"AI parsed result: {content}")
        current_app.logger.info(f"AI WebHook answer success")
        return jsonify(result=content), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при обработке AI ответа: {e}")
        return jsonify({'error': 'Ошибка при обработке AI ответа'}), 500


@ai_routes.route('/ai_post_generate', methods=['POST'])
def ai_post_generate_route():
    data = request.get_json()
    records_ids = data.get("records_ids", [])
    table_name = data.get("table_name")
    query_type = data.get("type", "fix")

    if not records_ids or not table_name:
        return jsonify({'error': 'Missing record_ids or table_name'}), 400

    records = get_records_by_ids(table_name, records_ids)

    if not records:
        return jsonify({'error': 'Records not found'}), 404

    prompt_header = {
        "post": "Это записи из базы. Сгенерируй пост для Telegram. Нужно интересно описать проделанную работу и"
                "по каким проектам она выполнялась. В ответе пришли только пост в формате MD. В начале поста добавляй"
                "даты чтоб был понятен период за который были взяты записи. Добавляй в хештеги"
                "названия проекта и этапа. Посты начинай заголовка. "
                "Например 📅 **Отчет за период: 22.04.2024 — 29.04.2024**",
    }

    prompt = prompt_header.get(query_type, prompt_header["post"])
    final_prompt = f"{prompt}\nВот записи:\n{records}"

    # current_app.logger.info(final_prompt)
    ai_response = requests.post(
        "https://n8n.ndomen.online/webhook/4999da23-b30e-494b-9435-9948be5ab8d4",
        json={"user_message": final_prompt}
    )

    if ai_response.status_code != 200:
        current_app.logger.error(f"AI webhook error: {ai_response.text}")
        return jsonify({'error': 'AI webhook error'}), 500

    try:
        ai_json = ai_response.json()
        content = ai_json[0]['message']['content']
        # current_app.logger.info(f"AI parsed result: {content}")
        record_info = {"body":  content.replace('```markdown', '').replace('```', '').replace('###', ''),
                       "records_ids": json.dumps(records_ids)}
        result = save_to_base_modules('posts_journal', 'create', record_info)
        if result.get('error'):
            return jsonify({'error': result.get('error')}), 500
            current_app.logger.info(f"AI WebHook answer success")
        return jsonify(result='success'), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при обработке AI ответа: {e}")
        return jsonify({'error': 'Ошибка при обработке AI ответа'}), 500


def convert_b64_to_filestorage(b64_data: str, filename: str, content_type: str = "image/jpeg") -> FileStorage:
    file_data = base64.b64decode(b64_data)
    return FileStorage(stream=BytesIO(file_data), filename=filename, content_type=content_type)


@ai_routes.route('/generate-image', methods=['POST'])
def generate_image():
    data = request.get_json()
    text = data.get("text")
    table_name = data.get("table_name")
    record_id = data.get("record_id")
    columns_names = get_columns_names()
    if not text:
        return jsonify(success=False, message="Нет текста")

    # Отправляем на внешний вебхук
    webhook_url = "https://n8n.ndomen.online/webhook/2da3e25d-1ff6-41f9-94e8-d55d43c1247b"
    try:
        webhook_resp = requests.post(webhook_url, json={"text": text})
        webhook_resp.raise_for_status()
        b64_string = webhook_resp.json()["data"][0]["b64_json"]
    except Exception as e:
        return jsonify(success=False, message=f"Ошибка вебхука: {e}")

    # Конвертируем в FileStorage
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"ai_{timestamp}.jpg"
    file_obj = convert_b64_to_filestorage(b64_string, filename)

    # Загружаем и обновляем запись
    files_list = {"ai_file": file_obj}
    result = save_to_base_modules(
        target_module=table_name,       # имя модуля, например journals
        command_type="update",          # или update/create
        message_info={'id': record_id},
        files_list=files_list
    )
    # current_app.logger.info(f"AI image generation and upload result: {result}")
    if 'params' not in result:
        return jsonify(success=False, message="Нет обновлённых данных")

    record = result['params']
    columns = list(record.keys())

    # current_app.logger.info(f"--------------------------------")
    # current_app.logger.info(f"AI image generation and upload columns: {columns}")
    # current_app.logger.info(f"AI image generation and upload columns_names: {columns_names}")
    # current_app.logger.info(f"AI image generation and upload record: {record}")
    blocks = build_blocks_from_records([record], columns, columns_names)
    # current_app.logger.info(f"AI image generation and upload blocks: {blocks}")
    # current_app.logger.info(f"--------------------------------")

    current_app.logger.info(f"AI image generation and upload success")
    return jsonify(success=True, blocks=blocks)
