from flask import Blueprint

main = Blueprint('main', __name__)

from .auth import auth_bp
from .chat import chat_bp
from .files import files_bp

main.register_blueprint(auth_bp)
main.register_blueprint(chat_bp)
main.register_blueprint(files_bp)

from . import routes
