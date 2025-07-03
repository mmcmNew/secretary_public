from flask_socketio import emit
import json
import os

from . import dashboard
from flask import Response, current_app
from flask import request, jsonify, send_from_directory
from flask_login import current_user, login_required
from .models import *
import logging

from app import socketio


@dashboard.route('/dashboard', methods=['POST'])
@login_required
def update_dashboard():
    data = request.json
    dashboard_id = data['dashboard_data']['id']
    name = data['dashboard_data']['name']
    containers = data['containers']
    theme_mode = data.get('themeMode',  'light')
    calendar_settings = data.get('calendarSettings', None)

    calendar_settings_json = json.dumps(calendar_settings)
    # current_app.logger.info(f'update_dashboard: {dashboard_id}, {name}, {theme_mode}, {calendar_settings}')

    dashboard_db = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()
    if dashboard_id == 0 or not dashboard_db:
        dashboard_db = Dashboard(user_id=current_user.id, name=name, containers=containers,
                                 theme_mode=theme_mode, calendar_settings=calendar_settings_json)
        db.session.add(dashboard_db)
        db.session.commit()
        dashboard_id = dashboard_db.id
    else:
        dashboard_db.name = name
        dashboard_db.containers = containers
        dashboard_db.theme_mode = theme_mode
        dashboard_db.calendar_settings = calendar_settings_json

    current_user.last_dashboard_id = dashboard_id
    db.session.add(current_user)
    db.session.add(dashboard_db)
    db.session.commit()

    return jsonify({"message": "Dashboard updated successfully"})


@dashboard.route('/dashboard/<int:dashboard_id>', methods=['GET'])
@login_required
def get_dashboard(dashboard_id):
    dashboard_db = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()
    # print(f'get_dashboard: {dashboard_db.to_dict()}')
    if not dashboard_db:
        return jsonify({"error": "Dashboard not found"}), 404
    return jsonify(dashboard_db.to_dict())


@dashboard.route('/dashboard/last', methods=['GET'])
@login_required
def get_last_dashboard():
    dashboard_db = None
    if current_user.last_dashboard_id:
        dashboard_db = Dashboard.query.filter_by(id=current_user.last_dashboard_id, user_id=current_user.id).first()

    if not dashboard_db:
        dashboard_db = Dashboard(user_id=current_user.id, name="dashboard", containers=[], theme_mode='light')
        db.session.add(dashboard_db)
        db.session.commit()
        current_user.last_dashboard_id = dashboard_db.id
        db.session.add(current_user)
        db.session.commit()

    return jsonify(dashboard_db.to_dict())


@dashboard.route('/post_timers', methods=['POST'])
@login_required
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
