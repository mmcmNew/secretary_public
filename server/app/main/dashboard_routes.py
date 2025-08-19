from .models import Dashboard
from . import main
from flask_socketio import emit
from app import db
import json
from flask import request, jsonify, send_from_directory
from flask_jwt_extended import current_user, jwt_required
from .utils import DEFAULT_CONTAINERS


@main.route('/dashboard/create', methods=['POST'])
@jwt_required()
def create_dashboard():
    data = request.json or {}
    name = data.get('name', 'dashboard')
    containers = data.get('containers', DEFAULT_CONTAINERS)
    theme_mode = data.get('themeMode', 'light')
    calendar_settings = data.get('calendarSettings', None)
    calendar_settings_json = json.dumps(calendar_settings) if calendar_settings else None

    dashboard_db = Dashboard(
        user_id=current_user.id,
        name=name,
        containers=containers,
        theme_mode=theme_mode,
        calendar_settings=calendar_settings_json
    )
    db.session.add(dashboard_db)
    # Обновляем last_dashboard_id пользователя
    current_user.last_dashboard_id = dashboard_db.id
    db.session.add(current_user)
    db.session.commit()

    return jsonify(dashboard_db.to_dict()), 201


@main.route('/dashboard/update', methods=['POST'])
@jwt_required()
def update_dashboard():
    data = request.json or {}
    dashboard_id = data.get('id')
    if not dashboard_id:
        return jsonify({"error": "id is required for update"}), 400

    dashboard_db = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()
    if not dashboard_db:
        return jsonify({"error": "Dashboard not found"}), 404

    dashboard_db.name = data.get('name', dashboard_db.name)
    dashboard_db.containers = data.get('containers', dashboard_db.containers)
    dashboard_db.theme_mode = data.get('themeMode', dashboard_db.theme_mode)
    
    calendar_settings = data.get('calendarSettings')
    if calendar_settings is not None:
        dashboard_db.calendar_settings = json.dumps(calendar_settings)

    db.session.add(dashboard_db)
    current_user.last_dashboard_id = dashboard_id
    db.session.add(current_user)
    db.session.commit()

    return jsonify(dashboard_db.to_dict()), 200


@main.route('/dashboard/list', methods=['GET'])
@jwt_required()
def list_dashboards():
    dashboards = Dashboard.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': d.id, 'name': d.name} for d in dashboards])

@main.route('/dashboard/<dashboard_id>', methods=['GET'])
@jwt_required()
def get_dashboard(dashboard_id):
    dashboard_db = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()
    # print(f'get_dashboard: {dashboard_db.to_dict()}')
    if not dashboard_db:
        return jsonify({"error": "Dashboard not found"}), 404
    return jsonify(dashboard_db.to_dict())


@main.route('/dashboard/last', methods=['GET'])
@jwt_required()
def get_last_dashboard():
    dashboard_db = None
    # Проверяем наличие Dashboard по last_dashboard_id
    if current_user.last_dashboard_id:
        dashboard_db = Dashboard.query.filter_by(id=current_user.last_dashboard_id, user_id=current_user.id).first()

    # Если Dashboard не найден по last_dashboard_id, ищем любой Dashboard пользователя
    if not dashboard_db:
        dashboard_db = Dashboard.query.filter_by(user_id=current_user.id).first()

    # Если у пользователя нет ни одного Dashboard, создаем новый с контейнерами по умолчанию
    if not dashboard_db:
        dashboard_db = Dashboard(user_id=current_user.id, name="dashboard", containers=DEFAULT_CONTAINERS, theme_mode='light')
        db.session.add(dashboard_db)
    # Обновляем last_dashboard_id пользователя
    current_user.last_dashboard_id = dashboard_db.id
    db.session.add(current_user)
    db.session.commit()

    return jsonify(dashboard_db.to_dict())


@main.route('/post_timers', methods=['POST'])
@jwt_required()
def post_timers():
    data = request.json
    # print(f'data: {data}')
    dashboard_id = data.get('dashboardId', 0)
    dashboard_db = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()
    timers = data.get('timers', None)
    # print(f'post_timers: dashboard_db: {dashboard_db.to_dict()}')
    # print(f'post_timers: timers: {timers}')

    if not dashboard_db:
        return jsonify({"error": "Dashboard not found"}), 404

    dashboard_db.timers = timers
    db.session.add(dashboard_db)
    db.session.commit()

    return jsonify({"message": "Timers updated successfully"}), 200
