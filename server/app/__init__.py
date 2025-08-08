import os
from flask import Flask, send_from_directory, jsonify, abort, current_app
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_caching import Cache
from flask_debugtoolbar import DebugToolbarExtension

from .config import WorkConfig, TestingConfig
from sqlalchemy import text

db = SQLAlchemy()
migrate = Migrate(render_as_batch=True)
socketio = SocketIO(logger=False, engineio_logger=False, cors_allowed_origins="*", async_mode='eventlet', debug=False)
jwt = JWTManager()
cache = Cache()

def create_app(config_type='work'):
    app = Flask(__name__, static_folder='static', static_url_path='/static', instance_relative_config=True)
    os.makedirs(app.instance_path, exist_ok=True)

    # Настройка конфигурации
    if config_type == 'test':
        app.config.from_object(TestingConfig)
        TestingConfig.init_app(app)
        CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    elif config_type == 'work':
        app.config.from_object(WorkConfig)
        WorkConfig.init_app(app)
    else:
        raise ValueError("Invalid configuration type")

    # Загрузка директорий
    app.config['UPLOAD_FOLDER'] = os.path.join(app.instance_path, 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Инициализация расширений
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio.init_app(app)
    cache.init_app(app, config={'CACHE_TYPE': 'SimpleCache'})
    
    # Включаем DebugToolbar только в режиме отладки
    if app.debug or app.config.get('DEBUG', False):
        app.config['SECRET_KEY'] = app.config.get('SECRET_KEY', 'dev')
        app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
        toolbar = DebugToolbarExtension(app)

    # Регистрация демо-маршрутов
    from .demo_routes import demo_bp
    app.register_blueprint(demo_bp)

    with app.app_context():
        # if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgresql'):
        engine = db.engine
        for schema in app.config.get('SCHEMAS', []):
            with engine.connect() as conn:
                conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS {schema}'))
                conn.commit()

    with app.app_context():
        from .auth_middleware import load_user_permissions
        app.before_request(load_user_permissions)

        # Роуты
        from .main import main as main_blueprint
        app.register_blueprint(main_blueprint)
        from .tasks import to_do_app as tasks_blueprint
        app.register_blueprint(tasks_blueprint, url_prefix='/api')
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

        # JWT загрузка пользователя
        from app.main.models import User
        @jwt.user_lookup_loader
        def load_user_callback(_jwt_header, jwt_data):
            return db.session.get(User, int(jwt_data["sub"]))

        @jwt.expired_token_loader
        def expired_token_callback(jwt_header, jwt_payload):
            return jsonify({'error': 'Token has expired'}), 401

        @jwt.invalid_token_loader
        def invalid_token_callback(error):
            return jsonify({'error': 'Invalid token'}), 401

        with app.app_context():
            # Создание таблиц только в test-режиме
            if config_type == 'test':
                db.create_all()
            # seed не вызывается автоматически!

        # Отдача manifest.webmanifest и sw.js из static
        @app.route('/manifest.webmanifest')
        def manifest():
            # current_app.logger.info('Serving manifest.webmanifest')
            return send_from_directory(
                current_app.static_folder,
                'manifest.webmanifest',
                mimetype='application/manifest+json'
            )

        @app.route('/sw.js')
        def service_worker():
            # current_app.logger.info('Serving sw.js')
            return send_from_directory(
                current_app.static_folder,
                'sw.js',
                mimetype='application/javascript'
            )

        # SPA: отдача index.html и статики
        STATIC_EXCLUDES = (
            'api/', 'static/', 'avatars/', 'sounds/', 'memory/',
            'audio/', 'temp/', 'upload_files/', 'dashboard/', 'tasks/',
            'chat/', 'journals/', 
            # 'sw.js', 'manifest.webmanifest'
        )

        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_dist(path):
            if any(path.startswith(p) for p in STATIC_EXCLUDES):
                abort(404)
            file_path = os.path.join(current_app.static_folder, path)
            return (
                send_from_directory(current_app._static_folder, path)
                if path and os.path.exists(file_path)
                else send_from_directory(current_app.static_folder, 'index.html')
            )

    # Регистрируем CLI-команды
    register_cli_commands(app)

    return app

# CLI-команда для инициализации данных (seed)
def register_cli_commands(app):
    @app.cli.command("seed")
    def seed():
        """Инициализация базовых данных (статусы, приоритеты, интервалы, подписки и т.д.)"""
        from app.tasks.models import Status, Priority, Interval
        Status.add_initial_statuses()
        Priority.add_initial_priorities()
        Interval.add_initial_intervals()
        from .init_subscription_data import init_subscription_data
        init_subscription_data()
        from app.main.models import User
        User.add_initial_users()

        # Создаем триггеры для автоматического обновления счетчиков в списках
        try:
            from .tasks.triggers import create_list_counter_triggers
            create_list_counter_triggers()
            app.logger.info("List counter triggers created successfully.")
        except Exception as e:
            app.logger.error(f"Failed to create list counter triggers: {e}")
        print("Данные успешно инициализированы.")
