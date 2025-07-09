import os
import argparse
import eventlet
eventlet.monkey_patch()

from app import create_app, socketio


def run_server_with_ssl(app, args):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cert_path = os.path.join(base_dir, 'localhost.pem')
    key_path = os.path.join(base_dir, 'localhost-key.pem')

    if not os.path.exists(cert_path) or not os.path.exists(key_path):
        raise FileNotFoundError("SSL сертификаты не найдены.")

    socketio.run(app,
                 host=args.host,
                 port=args.port,
                 debug=(args.mode == 'development'),
                 use_reloader=(args.mode == 'development'),
                 reloader_options={'extra_files': None} if args.mode == 'development' else None,
                 certfile=cert_path,
                 keyfile=key_path)


def main():
    parser = argparse.ArgumentParser(description="Manage Secretary server")
    parser.add_argument('--mode', choices=['development', 'production', 'docker', 'test'],
                        default=os.environ.get('MODE', 'development'),
                        help='Server mode')
    parser.add_argument('--host', default='0.0.0.0', help='Host to listen on')
    parser.add_argument('--port', type=int, default=5100, help='Port to listen on')
    args = parser.parse_args()

    config_type = 'test' if args.mode == 'test' or 'development' else 'work'
    app = create_app(config_type)

    if args.mode in ['development', 'production']:
        print(f"{args.mode.capitalize()} server running at: https://{args.host}:{args.port}")
        run_server_with_ssl(app, args)
    else:  # docker or test without SSL
        print(f"{args.mode.capitalize()} server running at: http://{args.host}:{args.port}")
        socketio.run(app,
                     host=args.host,
                     port=args.port,
                     debug=(args.mode == 'test'),
                     use_reloader=(args.mode == 'test'))


if __name__ == '__main__':
    main()
