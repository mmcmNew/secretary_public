import os
import eventlet
eventlet.monkey_patch()

from app import create_app, socketio

# Создаем приложение для продакшена
app = create_app('test')

if __name__ == '__main__':
    host = '0.0.0.0'
    port = 5100

    with app.app_context():
        print(f"Database path: {app.config.get('MAIN_DB_PATH', '')}")
        print(f"Static folder: {app.static_folder}")

    print(f"Server running at: http://0.0.0.0:{port}")
    socketio.run(app,
                host=host,
                port=port,
                debug=False,
                use_reloader=False)