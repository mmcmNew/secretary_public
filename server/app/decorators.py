from functools import wraps
from flask import request, jsonify, make_response, current_app
from flask_jwt_extended import current_user
from .tasks.models import DataVersion
from .socketio_utils import notify_data_update


def etag(version_key):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            rv = f(*args, **kwargs)
            data, status_code = rv if isinstance(rv, tuple) else (rv, 200)

            if status_code >= 300:
                return rv

            version = DataVersion.get_version(version_key)
            if version is not None:
                # current_app.logger.info(f'ETag version: {version}')
                # current_app.logger.info(f'ETag data: {data}')
                response = make_response(data, status_code)
                # current_app.logger.info(f'Setting ETag: {response}')
                response.set_etag(version)
                # current_app.logger.info(f'Setting ETag: {response}')

                conditional_response = response.make_conditional(request)
                # current_app.logger.info(f'Conditional response: {conditional_response}')
                return conditional_response  

            return data, status_code  
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