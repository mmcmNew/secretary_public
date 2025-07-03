from datetime import datetime, timedelta

from flask import current_app
from flask_jwt_extended import current_user

from app.journals.models import JournalEntry
from app.utilites import get_modules


def fetch_table_records(table_name, date_str, timezone_offset_ms):
    modules = get_modules()

    date_obj = datetime.strptime(date_str[:10], '%Y-%m-%d')

    if timezone_offset_ms:
        timezone_offset = timedelta(milliseconds=int(timezone_offset_ms))
    else:
        timezone_offset = datetime.now().astimezone().utcoffset() * -1

    local_start = datetime.combine(date_obj, datetime.min.time())
    local_end = datetime.combine(date_obj, datetime.max.time())
    utc_start = local_start + timezone_offset
    utc_end = local_end + timezone_offset

    if modules.get(table_name, {}).get('type') == 'journal':
        entries = (
            JournalEntry.query
            .filter(JournalEntry.journal_type == table_name,
                    JournalEntry.user_id == current_user.id,
                    JournalEntry.created_at >= utc_start,
                    JournalEntry.created_at <= utc_end)
            .all()
        )
        records = []
        for e in entries:
            data = e.data or {}
            record = {**data, 'id': e.id, 'created_at': e.created_at.isoformat()}
            records.append(record)
        columns = sorted({k for r in records for k in r.keys()})
        return records, columns

    raise ValueError("Unsupported table")

