from flask import Blueprint

# Создание Blueprint для 'main'
to_do_app = Blueprint('to_do_app', __name__)

from . import routes
