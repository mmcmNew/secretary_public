import os
from datetime import datetime
from flask import current_app
from flask_jwt_extended import current_user
from werkzeug.utils import secure_filename


def upload_files_to_server(files_list, dir_name):
    """Save uploaded files into the user's journal directory."""
    files_names = []
    try:
        current_app.logger.debug(
            "upload_files_to_server: files_list=%s, dir_name=%s",
            files_list,
            dir_name,
        )
        if files_list is None or dir_name is None:
            return "Не получены файлы для загрузки"
        if files_list:
            current_month = datetime.now().strftime('%Y-%m')
            from app.data_paths import get_user_journal_path
            save_path = os.path.join(
                get_user_journal_path(current_user.id, dir_name),
                current_month,
            )
            os.makedirs(save_path, exist_ok=True)
            current_date = datetime.now().strftime('%Y-%m-%d')
            i = 0
            for file_key in files_list:
                file = files_list[file_key]
                file_name = secure_filename(file.filename)
                if not file or not file_name:
                    continue
                file_extension = os.path.splitext(file.filename)[1]
                save_file_name = f'{current_date}[{i}]{file_extension}'
                while os.path.exists(os.path.join(save_path, save_file_name)):
                    i += 1
                    save_file_name = f'{current_date}[{i}]{file_extension}'

                file.save(os.path.join(save_path, save_file_name))
                files_names.append(os.path.join(dir_name, current_month, save_file_name))
                i += 1
        current_app.logger.debug("upload_files_to_server: files_names=%s", files_names)
        result = 'Файлы загружены. '
        return result, files_names
    except Exception as e:
        result = f'Файлы не загружены: {e}. '
        return result, files_names
