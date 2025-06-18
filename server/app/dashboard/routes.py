from flask_socketio import emit
import json
import os

from . import dashboard
from flask import Response, current_app
from flask import request, jsonify, send_from_directory
from .models import *
import logging

from app import socketio


@dashboard.route('/dashboard', methods=['POST'])
def update_dashboard():
    data = request.json
    dashboard_id = data['dashboard_data']['id']
    name = data['dashboard_data']['name']
    containers = data['containers']
    theme_mode = data.get('themeMode',  'light')
    calendar_settings = data.get('calendarSettings', None)

    calendar_settings_json = json.dumps(calendar_settings)
    # current_app.logger.info(f'update_dashboard: {dashboard_id}, {name}, {theme_mode}, {calendar_settings}')

    dashboard_db = Dashboard.query.get(dashboard_id)
    print(dashboard_db)
    if not dashboard_db:
        dashboard_db = Dashboard(id=dashboard_id, name=name, containers=containers, theme_mode=theme_mode,
                                 calendar_settings=calendar_settings_json)
    else:
        dashboard_db.name = name
        dashboard_db.containers = containers
        dashboard_db.theme_mode = theme_mode
        dashboard_db.calendar_settings = calendar_settings_json

    db.session.add(dashboard_db)
    db.session.commit()

    return jsonify({"message": "Dashboard updated successfully"})


@dashboard.route('/dashboard/<int:dashboard_id>', methods=['GET'])
def get_dashboard(dashboard_id):
    dashboard_db = Dashboard.query.get(dashboard_id)
    # print(f'get_dashboard: {dashboard_db.to_dict()}')
    if not dashboard_db:
        return jsonify({"error": "Dashboard not found"}), 404
    return jsonify(dashboard_db.to_dict())


@dashboard.route('/post_timers', methods=['POST'])
def post_timers():
    data = request.json
    # print(f'data: {data}')
    dashboard_id = data.get('dashboardId', 0)
    dashboard_db = Dashboard.query.get(dashboard_id)
    timers = data.get('timers', None)
    # print(f'post_timers: dashboard_db: {dashboard_db.to_dict()}')
    # print(f'post_timers: timers: {timers}')

    if not dashboard_db:
        return jsonify({"error": "Dashboard not found"}), 404

    dashboard_db.timers = timers
    db.session.add(dashboard_db)
    db.session.commit()

    return jsonify({"message": "Timers updated successfully"}), 200
