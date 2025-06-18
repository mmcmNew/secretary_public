from flask import Blueprint, current_app

# Создание Blueprint для 'main'
main = Blueprint('main', __name__)

from . import routes
