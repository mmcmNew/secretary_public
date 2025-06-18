from datetime import datetime, timedelta
import sqlite3

from flask import current_app


def fetch_table_records(table_name, date_str, timezone_offset_ms):
    db_path = current_app.config.get('MAIN_DB_PATH', '')

    date_obj = datetime.strptime(date_str[:10], '%Y-%m-%d')

    if timezone_offset_ms:
        timezone_offset = timedelta(milliseconds=int(timezone_offset_ms))
    else:
        timezone_offset = datetime.now().astimezone().utcoffset() * -1

    local_start = datetime.combine(date_obj, datetime.min.time())
    local_end = datetime.combine(date_obj, datetime.max.time())
    utc_start = local_start + timezone_offset
    utc_end = local_end + timezone_offset

    with sqlite3.connect(db_path) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.cursor()
        sql_request = f"""
            SELECT * FROM {table_name} 
            WHERE date BETWEEN ? AND ?
        """
        cursor.execute(sql_request, (utc_start.isoformat(), utc_end.isoformat()))
        return cursor.fetchall(), [description[0] for description in cursor.description]

