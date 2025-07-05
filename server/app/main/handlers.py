from datetime import datetime, timedelta

from flask import current_app
from flask_jwt_extended import current_user

from app.journals.models import JournalEntry
from app.command_utils import get_modules


def fetch_table_records(table_name, date_str, timezone_offset_ms):
    date_obj = datetime.strptime(date_str[:10], '%Y-%m-%d')

    if timezone_offset_ms:
        # Преобразуем миллисекунды в минуты
        timezone_offset_minutes = int(timezone_offset_ms) // 60000
        timezone_offset = timedelta(minutes=timezone_offset_minutes)
    else:
        timezone_offset = timedelta(0)

    local_start = datetime.combine(date_obj, datetime.min.time())
    local_end = datetime.combine(date_obj, datetime.max.time())
    utc_start = local_start - timezone_offset
    utc_end = local_end - timezone_offset

    # Проверяем пользовательские журналы
    from app.journals.models import JournalSchema
    user_schema = JournalSchema.query.filter_by(user_id=current_user.id, name=table_name).first()
    
    if user_schema:
        current_app.logger.debug(f'fetch_table_records: table={table_name}, date={date_str}, tz_offset_ms={timezone_offset_ms}')
        current_app.logger.debug(f'fetch_table_records: utc_start={utc_start}, utc_end={utc_end}, user_id={current_user.id}')
        
        entries = (
            JournalEntry.query
            .filter(JournalEntry.journal_type == table_name,
                    JournalEntry.user_id == current_user.id,
                    JournalEntry.created_at >= utc_start,
                    JournalEntry.created_at <= utc_end)
            .all()
        )
        
        current_app.logger.debug(f'fetch_table_records: found {len(entries)} entries')
        records = []
        for e in entries:
            data = e.data or {}
            record = {**data,
                      'id': e.id,
                      'created_at': e.created_at.isoformat(),
                      'files': [f.to_dict() for f in e.files]}
            records.append(record)
        columns = sorted({k for r in records for k in r.keys()})
        return records, columns

    raise ValueError("Unsupported table")

