from . import dashboard
from flask_socketio import emit
import json
import os
from flask import Response, current_app
from flask import request, jsonify, send_from_directory
from flask_jwt_extended import current_user, jwt_required
from .models import *
import logging
from app import socketio

# Контейнеры по умолчанию для нового Dashboard
DEFAULT_CONTAINERS = [
    {
        "containerId": "17542512414069942",
        "id": "17542512414069942",
        "type": "tasks",
        "name": "ToDo",
        "position": {"x": 976, "y": 111},
        "size": {"width": 1400, "height": 800},
        "minSize": {"width": 1100, "height": 700},
        "isLockAspectRatio": False,
        "isResizable": True,
        "isDisableDragging": False,
        "isLocked": False,
        "isMinimized": False
    },
    {
        "containerId": "17542512420066089",
        "id": "17542512420066089",
        "type": "calendar",
        "name": "Calendar",
        "position": {"x": 0, "y": 71},
        "size": {"width": 800, "height": 800},
        "minSize": {"width": 1100, "height": 700},
        "isLockAspectRatio": False,
        "isResizable": True,
        "isDisableDragging": False,
        "isLocked": False,
        "isMinimized": False
    }
]


@dashboard.route('/dashboard/create', methods=['POST'])
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


@dashboard.route('/dashboard/update', methods=['POST'])
@jwt_required()
def update_dashboard():
    data = request.json or {}
    dashboard_data = data.get('dashboard_data')
    if not dashboard_data or 'id' not in dashboard_data:
        return jsonify({"error": "dashboard_data.id is required for update"}), 400
    dashboard_id = dashboard_data['id']
    name = dashboard_data.get('name', 'New Dashboard')
    containers = data.get('containers', [])
    theme_mode = data.get('themeMode', 'light')
    calendar_settings = data.get('calendarSettings', None)
    calendar_settings_json = json.dumps(calendar_settings)

    dashboard_db = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()
    if not dashboard_db:
        return jsonify({"error": "Dashboard not found"}), 404
    dashboard_db.name = name
    dashboard_db.containers = containers
    dashboard_db.theme_mode = theme_mode
    dashboard_db.calendar_settings = calendar_settings_json
    db.session.add(dashboard_db)
    current_user.last_dashboard_id = dashboard_id
    db.session.add(current_user)
    db.session.commit()

    return jsonify(dashboard_db.to_dict()), 200


@dashboard.route('/dashboard/list', methods=['GET'])
@jwt_required()
def list_dashboards():
    dashboards = Dashboard.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': d.id, 'name': d.name} for d in dashboards])

@dashboard.route('/dashboard/<int:dashboard_id>', methods=['GET'])
@jwt_required()
def get_dashboard(dashboard_id):
    dashboard_db = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()
    # print(f'get_dashboard: {dashboard_db.to_dict()}')
    if not dashboard_db:
        return jsonify({"error": "Dashboard not found"}), 404
    return jsonify(dashboard_db.to_dict())


@dashboard.route('/dashboard/last', methods=['GET'])
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


@dashboard.route('/post_timers', methods=['POST'])
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
