from flask import current_app
from random import random, randint
from urllib.parse import urlencode


def path_to_url(path):
    base_url = "/journals"

    path = path.replace('\\', '/')
    # Разбиваем путь на части
    parts = path.split('/')

    # current_app.logger.debug(f'path_to_url: {parts}')
    # Извлекаем параметры
    category = parts[0]
    date_folder = parts[1]
    filename = parts[2]

    # Формируем параметры URL
    params = {
        'category': category,
        'date_folder': date_folder,
        'filename': filename
    }

    # Кодируем параметры в строку запроса
    query_string = urlencode(params)

    # Формируем конечный URL
    url = f"{base_url}?{query_string}"

    return url


def extract_record_data_from_block(block):
    """
    Извлекает идентификатор записи, имя столбца и текст для обновления из блока.
    Возвращает кортеж (record_id, column_name, record_text) или None, если данные некорректны.
    """
    block_id = block.get('id')
    if not block_id or not block_id.startswith('record-') or '-files-' in block_id:
        return None

    parts = block_id.split('-')
    if len(parts) < 3:
        current_app.logger.warning(f"Неверный формат id: {block_id}")
        return None

    record_id, column_name = parts[1], parts[2]

    # Используем markdownContent, если он есть
    record_text = block.get('markdownContent')
    if not record_text:
        # Fallback на текст из children
        record_text = ''
        for child in block.get('children', []):
            if child.get('type') == 'image':
                continue
            content = child.get('content', [])
            for part in content:
                record_text += part.get('text', '\n') + ' '
            record_text += '\n'
        record_text = record_text.strip()

    return record_id, column_name, record_text


def build_blocks_from_records(table_records, columns, columns_names):
    result = []
    single_record_blocks = []
    # current_app.logger.debug(f"build_blocks_from_records: {table_records}")

    for record in table_records:
        if not isinstance(record, dict):
            record = dict(zip(columns, record))  # ← вот это добавь

        record_id = record['id']
        for col_name in columns:
            col_value = record[col_name]

            if col_name not in columns_names:
                continue

            block_id = f"record-{record_id}-{col_name}"

            if col_name == 'files':
                file_paths = col_value.strip().split(';') if col_value else []
                for i, file_path in enumerate(file_paths):
                    if not file_path:
                        continue
                    file_url = path_to_url(file_path.strip())
                    if file_url.endswith(('.mp4', '.mkv')):
                        block_type = 'video'
                    elif file_url.endswith(('.mp3', '.wav', '.ogg')):
                        block_type = 'audio'
                    else:
                        block_type = 'image'
                    img_block_id = f"{block_id}-{i}"
                    single_record_blocks.append({
                        'id': img_block_id,
                        'type': block_type,
                        'props': {'url': file_url}
                    })
                continue

            paragraphs = str(col_value).strip().split('\n') if col_value else []
            parent_block = {
                'id': block_id,
                'type': 'heading',
                'content': columns_names[col_name],
                'props': {'level': 3},
                'children': []
            }

            if paragraphs:
                for paragraph in paragraphs:
                    paragraph_id = f"{block_id}-{randint(0, 1000000)}"
                    parent_block['children'].append({
                        'id': paragraph_id,
                        'type': 'paragraph',
                        'content': paragraph
                    })
            else:
                parent_block['children'].append({
                    'id': f"{block_id}-empty",
                    'type': 'paragraph',
                    'content': ''
                })

            single_record_blocks.append(parent_block)

        result.append(single_record_blocks)
        single_record_blocks = []

    return result
