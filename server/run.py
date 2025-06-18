import eventlet
eventlet.monkey_patch()

from app import create_app, socketio

app = create_app('test')

if __name__ == '__main__':
    host = '0.0.0.0'
    port = 5000

    with app.app_context():
        print(app.config.get('MAIN_DB_PATH', ''))

    cert_path = 'localhost.pem'
    key_path = 'localhost-key.pem'

    print(f"Server running at: https://localhost:{port} or https://<your-IP>:{port}")
    socketio.run(app,
                host=host,
                port=port,
                debug=False,
                use_reloader=False,
                certfile=cert_path,
                keyfile=key_path)
