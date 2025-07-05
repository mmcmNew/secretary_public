import os
import argparse
import eventlet
eventlet.monkey_patch()

from app import create_app, socketio

app = create_app('test')

def main():
    parser = argparse.ArgumentParser(description="Manage Secretary server")
    parser.add_argument('--mode', choices=['development', 'production', 'docker'],
                        default=os.environ.get('MODE', 'development'),
                        help='Server mode')
    parser.add_argument('--host', default='0.0.0.0', help='Host to listen on')
    parser.add_argument('--port', type=int, default=5100, help='Port to listen on')
    args = parser.parse_args()

    if args.mode == 'development':
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cert_path = os.path.join(base_dir, 'localhost.pem')
        key_path = os.path.join(base_dir, 'localhost-key.pem')

        print(f"Development server running at: https://localhost:{args.port}")
        print("Hot reload enabled - server will restart on file changes")
        socketio.run(app,
                    host=args.host,
                    port=args.port,
                    debug=True,
                    use_reloader=True,
                    reloader_options={'extra_files': None},
                    certfile=cert_path,
                    keyfile=key_path)
    elif args.mode == 'production':
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cert_path = os.path.join(base_dir, 'localhost.pem')
        key_path = os.path.join(base_dir, 'localhost-key.pem')

        print(f"Server running at: https://localhost:{args.port} or https://<your-IP>:{args.port}")
        socketio.run(app,
                    host=args.host,
                    port=args.port,
                    debug=True,
                    use_reloader=True,
                    certfile=cert_path,
                    keyfile=key_path)
    else:  # docker
        print(f"Server running at: http://{args.host}:{args.port}")
        socketio.run(app,
                    host=args.host,
                    port=args.port,
                    debug=False,
                    use_reloader=False)

if __name__ == '__main__':
    main()

