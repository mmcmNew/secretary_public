import json
import os
from datetime import datetime

from flask import current_app, jsonify, abort, request
from flask_jwt_extended import jwt_required, current_user

from app import socketio
from . import main
from .handlers import fetch_table_records
from app.db_utils import save_to_base_modules
from ..tasks.handlers import create_daily_scenario
from app.data_paths import get_user_data_path, get_system_data_path


@socketio.on("connect", namespace="/updates")
def updates_ws_connect():
    current_app.logger.info("Client connected to updates websocket")


@socketio.on("disconnect", namespace="/updates")
def updates_ws_disconnect():
    current_app.logger.info("Client disconnected from updates websocket")


@main.route("/api/health", methods=["GET"])
def health_check():
    return (
        jsonify(
            {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "1.0.0",
            }
        ),
        200,
    )


@main.route("/get_scenario/<string:name>", methods=["GET"])
@jwt_required(optional=True)
def get_scenario(name):
    if name == "my_day":
        scenario = create_daily_scenario()
        return {"scenario": scenario}, 200

    scenario_path = None

    if current_user:
        user_scenarios_path = get_user_data_path(current_user.id, "scenarios")
        user_scenario_file = os.path.join(user_scenarios_path, f"{name}.json")
        if os.path.isfile(user_scenario_file):
            scenario_path = user_scenario_file

    if not scenario_path:
        system_scenarios_path = get_system_data_path("scenarios")
        if system_scenarios_path:
            system_scenario_file = os.path.join(system_scenarios_path, f"{name}.json")
            if os.path.isfile(system_scenario_file):
                scenario_path = system_scenario_file

    if not scenario_path:
        abort(404, description="Scenario not found")

    try:
        with open(scenario_path, "r", encoding="utf-8") as file:
            scenario = json.load(file)
        return {"scenario": scenario}, 200
    except Exception as e:
        current_app.logger.error(f"get_scenario error: {e}")
        abort(404, description=f"Scenario error: {e}")


@main.route("/post_new_record", methods=["POST"])
@jwt_required()
def post_new_record():
    data = request.form
    files = request.files
    table_name = data.get("table_name")
    record_info = data.get("record_info")
    result = save_to_base_modules(table_name, "create", record_info, files)
    error = result.get("error")
    new_record_info = result.get("params")
    if new_record_info:
        del new_record_info["table_name"]
    if error:
        return jsonify(error), 404
    else:
        return jsonify(new_record_info), 201


@main.route("/post_edited_record_api", methods=["POST"])
@jwt_required()
def post_edited_record_api():
    data = request.form
    files = request.files
    table_name = data.get("table_name")
    record_info = data.get("record_info")
    result = save_to_base_modules(table_name, "update", record_info, files)
    error = result.get("error")
    updated_record_info = result.get("params")
    if updated_record_info:
        del updated_record_info["table_name"]
    if error:
        return jsonify(error), 404
    else:
        return jsonify(updated_record_info), 201


@main.route("/get_tables", methods=["GET"])
@jwt_required()
def get_tables_route():
    from app.journals.models import JournalSchema

    tables = []
    user_schemas = JournalSchema.query.filter_by(user_id=current_user.id).all()
    for schema in user_schemas:
        tables.append(
            {
                "label": schema.display_name,
                "src": schema.name,
                "type": "journal",
                "user_schema": True,
            }
        )

    return jsonify({"tables": tables}), 200


def get_table_survey(table_name, conn=None):
    try:
        from app.journals.models import JournalSchema

        user_schema = JournalSchema.query.filter_by(
            user_id=current_user.id, name=table_name
        ).first()
        if user_schema:
            action = {
                "type": "survey",
                "table_name": table_name,
                "text": "Продиктуйте новую запись",
                "fields": [],
            }

            for field in user_schema.fields:
                field_entry = {
                    "field_id": field["name"],
                    "field_name": field["label"],
                    "type": field.get("type", "text"),
                    "check": "true",
                }
                if field.get("type") == "file":
                    field_entry["multiple"] = field.get("multiple", False)
                action["fields"].append(field_entry)
            return action
    except Exception:
        pass

    return None


@main.route("/get_table_data", methods=["GET"])
@jwt_required()
def get_table_data():
    table_name = request.args.get("table_name")
    date = request.args.get("date")
    timezone_offset = request.args.get("timezone_offset", None)

    try:
        records, columns = fetch_table_records(table_name, date, timezone_offset)
        if not records:
            return jsonify({"records": [], "columns": columns}), 200

        from app.journals.models import JournalSchema

        user_schema = JournalSchema.query.filter_by(
            user_id=current_user.id, name=table_name
        ).first()

        if user_schema:
            result = records
        else:
            result = [dict(r) for r in records]
        return jsonify({"records": result, "columns": columns}), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении записей: {e}")
        return jsonify({"error": str(e)}), 500
