from functools import wraps
from flask import request, jsonify, current_app
from .models import DataVersion


def check_version():
    """
    Decorator for checking data version before executing handler function.
    If versions match, returns only version info without executing handler.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client version from request
            client_version = request.args.get('version')
            current_app.logger.info(f'Checking version, client_version: {client_version}')

            # If no client version provided, just get data without updating version
            if not client_version:
                current_app.logger.info('No client version provided, getting fresh data')
                result = f(*args, **kwargs)
                # Add current version to response
                if isinstance(result, dict):
                    current_version = DataVersion.get_version()
                    current_app.logger.info(f'Adding version {current_version} to response')
                    result['version'] = current_version
                return result
            
            # Check if version matches
            version_info = DataVersion.check_version(client_version)
            current_app.logger.info(f'Version check result: {version_info}')
            
            if not version_info['has_changed']:
                current_app.logger.info(f'Version match, returning version info: {version_info["version"]}')
                return jsonify({
                    'version': version_info['version'],
                    'version_matches': True
                })
            
            current_app.logger.info('Version mismatch, proceeding with handler')
            result = f(*args, **kwargs)
            # Update version after getting new data
            DataVersion.update_version()
            # Add version to response
            if isinstance(result, dict):
                current_version = DataVersion.get_version()
                current_app.logger.info(f'Adding new version {current_version} to response')
                result['version'] = current_version
            return result
                
        return decorated_function
    return decorator
