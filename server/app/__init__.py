import os
import sys

from flask import Flask, send_from_directory, jsonify, abort
from flask_jwt_extended import JWTManager
from .config import WorkConfig, TestingConfig
# from flask_ngrok2 import run_with_ngrok
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_wtf import CSRFProtect
from flask_wtf.csrf import generate_csrf
# from app.socketio_instance import socketio
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate(render_as_batch=True)
socketio = SocketIO(logger=False, engineio_logger=False, cors_allowed_origins="*", async_mode='eventlet', debug=False)
jwt = JWTManager()
csrf = CSRFProtect()


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

    csrf.init_app(app)

    app.config['DIST_FOLDER'] = dist_folder
    app.config['CONFIG_TYPE'] = config_type

    # Загрузка конфигов
    if config_type == 'test':
        CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
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
    jwt.init_app(app)

    @app.after_request
    def set_csrf_cookie(response):
        if app.config.get('WTF_CSRF_ENABLED', True):
            response.set_cookie(
                'csrf_token',
                generate_csrf(),
                secure=True,
                samesite='Lax'
            )
        return response
    with app.app_context():
        
        # Добавляем middleware для проверки прав
        from .auth_middleware import load_user_permissions
        app.before_request(load_user_permissions)

        from .main import main as main_blueprint
        app.register_blueprint(main_blueprint)
        from .tasks import to_do_app as tasks_blueprint
        app.register_blueprint(tasks_blueprint)
        from .dashboard import dashboard as dashboard_blueprint
        app.register_blueprint(dashboard_blueprint)
        from .journals import journals as journals_blueprint
        app.register_blueprint(journals_blueprint, url_prefix='/api/journals')
        from .twitch import twitchAPI as twitch_blueprint
        app.register_blueprint(twitch_blueprint)
        from .ai_routes import ai_routes as ai_blueprint
        app.register_blueprint(ai_blueprint, url_prefix='/api')
        from .messengers import messengers as messenger_blueprint
        app.register_blueprint(messenger_blueprint, url_prefix='/api/messengers')
        from .admin_routes import admin_bp
        app.register_blueprint(admin_bp)
        from .subscription_routes import subscription_bp
        app.register_blueprint(subscription_bp)

        db.create_all()

        from app.main.models import User
        if config_type == 'test':
            User.add_initial_users()

        @jwt.user_lookup_loader
        def load_user_callback(_jwt_header, jwt_data):
            identity = jwt_data["sub"]
            return User.query.get(int(identity))
        
        @jwt.expired_token_loader
        def expired_token_callback(jwt_header, jwt_payload):
            return jsonify({'error': 'Token has expired'}), 401
        
        @jwt.invalid_token_loader
        def invalid_token_callback(error):
            return jsonify({'error': 'Invalid token'}), 401
          
        from app.tasks.models import TaskTypes
        TaskTypes.add_initial_task_types()
        from app.tasks.models import Status
        Status.add_initial_statuses()
        from app.tasks.models import Priority
        Priority.add_initial_priorities()
        from app.tasks.models import Interval
        Interval.add_initial_intervals()
        
        # Инициализация данных подписки
        from .init_subscription_data import init_subscription_data
        init_subscription_data()


        # Отдаем index.html и статику (должно быть в конце, чтобы не перехватывать API маршруты)
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_dist(path):
            # Исключаем API маршруты и серверные пути
            if path.startswith(('api/', 'static/', 'avatars/', 'sounds/', 'memory/', 'audio/', 'temp/', 'upload_files/', 'dashboard/', 'tasks/', 'chat/', 'journals/', 'sw.js', 'manifest.webmanifest')):
                abort(404)
            
            if path != "" and os.path.exists(os.path.join(dist_folder, path)):
                return send_from_directory(dist_folder, path)
            else:
                return send_from_directory(dist_folder, 'index.html')

    return app
