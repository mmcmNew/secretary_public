import os
import eventlet
eventlet.monkey_patch()

from app import create_app, socketio

app = create_app('test')

if __name__ == '__main__':
    host = '0.0.0.0'
    port = int(os.environ.get('PORT', 5100))

    with app.app_context():
        print(f"Database path: {app.config.get('MAIN_DB_PATH', '')}")
        print(f"Static folder: {app.config.get('DIST_FOLDER', '')}")

    print(f"Server running at: http://0.0.0.0:{port}")
    
    # Для Docker не используем SSL сертификаты
    socketio.run(app,
                host=host,
                port=port,
                debug=False,
                use_reloader=False)