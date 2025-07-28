from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import current_user
from .tasks.models import DataVersion
from .socketio_utils import notify_data_update


def etag(version_key):
    """
    Декоратор, который добавляет обработку ETag к маршруту Flask.
    Обернутая функция должна возвращать данные для json-сериализации
    или кортеж (данные, код_статуса).
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            rv = f(*args, **kwargs)
            data, status_code = rv if isinstance(rv, tuple) else (rv, 200)

            if status_code >= 300:
                return jsonify(data), status_code

            version = DataVersion.get_version(version_key)
            response = jsonify(data)
            if version is not None:
                response.set_etag(version)

            return response.make_conditional(request)
        return decorated_function
    return decorator


def update_version_on_success(version_key='tasksVersion', notify_func=None, success_codes=None):
    if success_codes is None:
        success_codes = [200, 201]

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result, status_code = f(*args, **kwargs)
            if status_code in success_codes:
                new_version = DataVersion.update_version(version_key)
                notify_data_update(**{version_key: new_version})
                if notify_func:
                    notify_func(result, request.get_json(), current_user)
                response = jsonify(result)
                response.set_etag(new_version)
                return response, status_code
            return jsonify(result), status_code
        return decorated_function
    return decorator