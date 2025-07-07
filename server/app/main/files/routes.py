import os
from flask import current_app, send_from_directory, make_response, send_file, abort, request
from flask_jwt_extended import jwt_required, current_user

from ..models import ChatHistory
from app.text_to_edge_tts import generate_tts, del_all_audio_files
from app.data_paths import get_system_data_path

from . import files_bp


@files_bp.route("/sw.js")
def serve_sw():
    try:
        dist_folder = current_app.config.get("DIST_FOLDER", "")
        response = make_response(send_from_directory(dist_folder, "sw.js"))
        response.headers["Content-Type"] = "application/javascript"
        return response
    except Exception as e:
        current_app.logger.error(f"Error serving sw.js: {e}")
        return "SW not found", 404


@files_bp.route("/manifest.webmanifest")
def serve_manifest():
    try:
        dist_folder = current_app.config.get("DIST_FOLDER", "")
        response = make_response(
            send_from_directory(dist_folder, "manifest.webmanifest")
        )
        response.headers["Content-Type"] = "application/manifest+json"
        return response
    except Exception as e:
        current_app.logger.error(f"Error serving manifest.webmanifest: {e}")
        return "Manifest not found", 404


@files_bp.route("/avatars/<path:filename>", methods=["GET"])
@files_bp.route("/sounds/<path:filename>", methods=["GET"])
@files_bp.route("/memory/<path:filename>", methods=["GET"])
@jwt_required(optional=True)
def static_files(filename):
    prefix_map = {
        "/avatars": "avatars",
        "/sounds": "sounds",
        "/memory": "memory_images",
    }

    prefix = "/" + request.path.strip("/").split("/")[0]
    system_dir_key = prefix_map.get(prefix)

    if system_dir_key is None:
        return "File not found", 404

    if prefix == "/memory" and current_user:
        user_memory_path = get_system_data_path(current_user.id, "memory")
        user_file = os.path.join(user_memory_path, filename)
        if os.path.isfile(user_file):
            return send_from_directory(user_memory_path, filename)

    system_path = get_system_data_path(system_dir_key)
    if system_path and os.path.isfile(os.path.join(system_path, filename)):
        return send_from_directory(system_path, filename)

    return "File not found", 404


@files_bp.route("/temp/<path:filename>", methods=["GET"])
def get_temp_files(filename):
    base_dir = os.path.join(current_app.root_path, "temp")
    file_path = os.path.join(base_dir, filename)
    if not os.path.exists(file_path):
        if filename.startswith("edge_audio_"):
            record_id = filename.replace("edge_audio_", "").replace(".mp3", "")
            message = ChatHistory.query.filter_by(message_id=record_id).first()
            if not message:
                abort(404, description="Message not found")
            del_all_audio_files()
            result = generate_tts(text=message.text, record_id=record_id)
            if result:
                return send_file(file_path)
            else:
                abort(404, description=result)
    else:
        return send_file(file_path)

    return "File not found", 404


@files_bp.route("/get_tts_audio", methods=["POST"])
def get_tts_audio():
    text = request.form.get("text")
    if not text:
        abort(400, description="No text provided")

    result = generate_tts(text=text)
    if result:
        return send_file(result)
    else:
        abort(404, description="File not found")


@files_bp.route("/get_tts_audio_filename", methods=["POST"])
def get_tts_audio_filename():
    text = request.form.get("text")
    if not text:
        abort(400, description="No text provided")

    result = generate_tts(text=text)
    if result and os.path.exists(result):
        edge_filename = result.replace("\\", "/").split("/")[-1]
        return {"filename": edge_filename}, 200
    else:
        abort(404, description="File not found")
