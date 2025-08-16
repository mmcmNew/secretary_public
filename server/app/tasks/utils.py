from datetime import datetime, timezone
import uuid


def _parse_iso_datetime(value):
    """
    Helper to parse ISO datetime strings that may contain timezone information.
    All datetimes are converted to naive UTC before storing in the database.
    """
    if not value:
        return None
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _is_task_in_range(task, start_dt, end_dt, is_events=False):
    """
    Check if a task is within the specified date range.
    """
    if is_events and not task.start:
        return False
    st = task.start
    en = task.end or st
    if start_dt and en and en < start_dt:
        return False
    if end_dt and st and st > end_dt:
        return False
    return True

def is_valid_uuid(uuid_string):
    """Проверяет, является ли строка валидным UUID"""
    try:
        uuid.UUID(uuid_string)
        return True
    except (ValueError, TypeError):
        return False