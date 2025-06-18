import sqlite3
from flask import current_app, jsonify
from app.utilites import get_modules


def get_records_by_ids(table_name, records_ids):
    db_path = current_app.config.get('MAIN_DB_PATH', '')

    if not records_ids or not table_name:
        return []

    try:
        with sqlite3.connect(db_path) as connection:
            connection.row_factory = sqlite3.Row  # Это позволит возвращать строки как словари
            cursor = connection.cursor()

            placeholders = ','.join('?' for _ in records_ids)
            sql = f"""
                SELECT * FROM {table_name}
                WHERE id IN ({placeholders})
            """
            cursor.execute(sql, records_ids)
            rows = cursor.fetchall()

            return [dict(row) for row in rows]  # Возвращаем список словарей
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении записей по ID: {e}")
        return []


def fetch_filtered_records(table_name, filters):
    modules = get_modules()
    if table_name not in modules or modules[table_name].get('type') != 'journal':
        raise ValueError("Invalid table name")

    module_config = modules[table_name].get('filter_config', {})
    date_fields = module_config.get('date', []) + ['date']
    range_fields = module_config.get('range', [])
    dropdowns = module_config.get('dropdown', [])
    text_fields = module_config.get('text', [])

    db_path = current_app.config.get('MAIN_DB_PATH')

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        sql = f"SELECT * FROM {table_name} WHERE 1=1"
        params = []

        for field in date_fields:
            from_key = f"{field}_from"
            to_key = f"{field}_to"
            if filters.get(from_key):
                sql += f" AND {field} >= ?"
                params.append(filters[from_key])
            if filters.get(to_key):
                sql += f" AND {field} <= ?"
                params.append(filters[to_key])

        for field in range_fields:
            min_key = f"{field}_min"
            max_key = f"{field}_max"
            if filters.get(min_key) not in [None, '']:
                sql += f" AND {field} >= ?"
                params.append(filters[min_key])
            if filters.get(max_key) not in [None, '']:
                sql += f" AND {field} <= ?"
                params.append(filters[max_key])

        for field in dropdowns:
            vals = filters.get(field)
            if isinstance(vals, (list, tuple)) and vals:
                placeholders = ",".join("?" for _ in vals)
                sql += f" AND {field} IN ({placeholders})"
                params.extend(vals)

        for field in text_fields:
            val = filters.get(field)
            if val:
                sql += f" AND {field} LIKE ?"
                params.append(f"%{val}%")

        # current_app.logger.info(f'Filtered SQL: {sql} with {params}')
        cur.execute(sql, params)
        records = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        current_app.logger.info(f'fetch_filtered_records: Fetched {len(records)} records')
        # current_app.logger.info(f'Columns: {columns}')
        # current_app.logger.info(f'First record: {records[0] if records else None}')
        return records, columns


def get_all_filters(table_name):
    """
    Возвращает JSON-объект вида
    {
      "field1": ["opt1", "opt2", ...],
      "field2": [...],
      ...
    }
    для всех полей из filter_config[table_name]['dropdown'].
    """
    # modules должен быть тем же словарём, где хранят filter_config
    modules = get_modules()
    config = modules.get(table_name, {}).get('filter_config', {})
    dropdown_fields = config.get('dropdown', [])
    db_path = current_app.config['MAIN_DB_PATH']

    result = {}
    try:
        with sqlite3.connect(db_path) as conn:
            cur = conn.cursor()
            for col in dropdown_fields:
                # собираем и «разворачиваем» строки через запятую
                cur.execute(f"SELECT {col} FROM {table_name} WHERE {col} IS NOT NULL")
                rows = cur.fetchall()
                values = set()
                for (raw,) in rows:
                    if isinstance(raw, str):
                        parts = [item.strip() for item in raw.split(',') if item.strip()]
                        values.update(parts)
                    else:
                        values.add(str(raw))
                result[col] = sorted(values)
        # current_app.logger.info(f'get_all_filters: {result}')
        return jsonify(result), 200

    except sqlite3.Error as e:
        current_app.logger.error(f'Ошибка при получении фильтров: {e}')
        return jsonify({"error": str(e)}), 500


def get_posts_with_records():
    try:
        db_path = current_app.config.get('MAIN_DB_PATH', '')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT title, records_ids FROM posts_journal
            WHERE records_ids IS NOT NULL AND records_ids != '[]'
        """)

        return cursor.fetchall()

    except Exception as e:
        current_app.logger.error(f'Ошибка при получении постов с записями: {e}')
        return []
    finally:
        if conn:
            conn.close()
