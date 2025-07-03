from flask import current_app, jsonify
from flask_jwt_extended import current_user
from app.utilites import get_modules
from app.journals.models import JournalEntry
from app import db


def get_records_by_ids(table_name, records_ids):
    if not records_ids or not table_name:
        return []

    modules = get_modules()
    if modules.get(table_name, {}).get('type') == 'journal':
        try:
            entries = (JournalEntry.query
                       .filter(JournalEntry.journal_type == table_name,
                               JournalEntry.id.in_(records_ids),
                               JournalEntry.user_id == current_user.id)
                       .all())
            return [{**(e.data or {}), 'id': e.id} for e in entries]
        except Exception as e:
            current_app.logger.error(f"Ошибка при получении записей по ID: {e}")
            return []

    raise ValueError("Invalid table name")


def fetch_filtered_records(table_name, filters):
    modules = get_modules()
    if table_name not in modules or modules[table_name].get('type') != 'journal':
        raise ValueError("Invalid table name")

    module_config = modules[table_name].get('filter_config', {})
    date_fields = module_config.get('date', [])
    range_fields = module_config.get('range', [])
    dropdowns = module_config.get('dropdown', [])
    text_fields = module_config.get('text', [])

    entries = JournalEntry.query.filter_by(user_id=current_user.id, journal_type=table_name).all()
    records = []
    for entry in entries:
        data = entry.data or {}
        record = {**data, 'id': entry.id, 'created_at': entry.created_at.isoformat()}
        include = True

        for field in date_fields:
            from_key = f"{field}_from"
            to_key = f"{field}_to"
            val = record.get(field)
            if filters.get(from_key) and (not val or val < filters[from_key]):
                include = False
            if filters.get(to_key) and (not val or val > filters[to_key]):
                include = False

        for field in range_fields:
            min_key = f"{field}_min"
            max_key = f"{field}_max"
            val = record.get(field)
            try:
                val_f = float(val)
            except (TypeError, ValueError):
                val_f = None
            if val_f is not None:
                if filters.get(min_key) not in [None, ''] and val_f < float(filters[min_key]):
                    include = False
                if filters.get(max_key) not in [None, ''] and val_f > float(filters[max_key]):
                    include = False

        for field in dropdowns:
            vals = filters.get(field)
            if vals:
                if isinstance(vals, str):
                    vals = [vals]
                if record.get(field) not in vals:
                    include = False

        for field in text_fields:
            val_filter = filters.get(field)
            if val_filter and val_filter not in (record.get(field) or ''):
                include = False

        if include:
            records.append(record)

    columns = sorted({key for rec in records for key in rec.keys()})
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
    result = {}
    try:
        entries = JournalEntry.query.filter_by(user_id=current_user.id, journal_type=table_name).all()
        for col in dropdown_fields:
            values = set()
            for e in entries:
                raw = (e.data or {}).get(col)
                if raw is None:
                    continue
                if isinstance(raw, str):
                    parts = [item.strip() for item in raw.split(',') if item.strip()]
                    values.update(parts)
                else:
                    values.add(str(raw))
            result[col] = sorted(values)
        return jsonify(result), 200

    except Exception as e:
        current_app.logger.error(f'Ошибка при получении фильтров: {e}')
        return jsonify({"error": str(e)}), 500


def get_posts_with_records():
    try:
        entries = JournalEntry.query.filter(
            JournalEntry.journal_type == 'posts_journal',
            JournalEntry.user_id == current_user.id
        ).all()
        result = []
        for e in entries:
            data = e.data or {}
            if data.get('records_ids') not in [None, '[]', '']:
                result.append({'title': data.get('title'), 'records_ids': data.get('records_ids')})
        return result

    except Exception as e:
        current_app.logger.error(f'Ошибка при получении постов с записями: {e}')
        return []
