import os
import sys

from flask import Flask, send_from_directory
from .config import WorkConfig, TestingConfig
# from flask_ngrok2 import run_with_ngrok
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
# from app.socketio_instance import socketio
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate(render_as_batch=True)
socketio = SocketIO(logger=False, engineio_logger=False, cors_allowed_origins="*", async_mode='eventlet', debug=False)


def create_app(config_type='work'):
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
        dist_folder = os.path.join(base_path, 'app', 'dist')  # путь внутри .exe
    else:
        base_path = os.path.abspath(os.path.dirname(__file__))
        dist_folder = os.path.join(base_path, 'dist')  # путь при разработке

    app = Flask(
        __name__,
        static_folder=dist_folder,
        static_url_path=''  # Статика будет доступна по /
    )

    app.config['DIST_FOLDER'] = dist_folder
    app.config['CONFIG_TYPE'] = config_type

    # Загрузка конфигов
    if config_type == 'test':
        CORS(app, resources={r"/*": {"origins": "*"}})
        app.config.from_object(TestingConfig)
        TestingConfig.init_app(app)
    elif config_type == 'work':
        app.config.from_object(WorkConfig)
        WorkConfig.init_app(app)
    else:
        raise ValueError("Invalid configuration type")

    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app)
    with app.app_context():

        from .main import main as main_blueprint
        app.register_blueprint(main_blueprint)
        from .tasks import to_do_app as tasks_blueprint
        app.register_blueprint(tasks_blueprint)
        from .dashboard import dashboard as dashboard_blueprint
        app.register_blueprint(dashboard_blueprint)
        from .twitch import twitchAPI as twitch_blueprint
        app.register_blueprint(twitch_blueprint)
        from .ai_routes import ai_routes as ai_blueprint
        app.register_blueprint(ai_blueprint, url_prefix='/api')
        from .messengers import messengers as messenger_blueprint
        app.register_blueprint(messenger_blueprint, url_prefix='/api/messengers')

        db.create_all()

        from app.main.models import User
        if config_type == 'test':
            User.add_initial_users()
        from app.tasks.models import TaskTypes
        TaskTypes.add_initial_task_types()
        from app.tasks.models import Status
        Status.add_initial_statuses()
        from app.tasks.models import Priority
        Priority.add_initial_priorities()
        from app.tasks.models import Interval
        Interval.add_initial_intervals()

        db_path = app.config.get('MAIN_DB_PATH', '')
        from app.utilites import create_missing_journals
        create_missing_journals(db_path)

        # Отдаем index.html и статику
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_dist(path):
            if path != "" and os.path.exists(os.path.join(dist_folder, path)):
                return send_from_directory(dist_folder, path)
            else:
                return send_from_directory(dist_folder, 'index.html')

    return app
