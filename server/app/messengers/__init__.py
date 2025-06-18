from flask import Blueprint, current_app

# Создание Blueprint для 'main'
messengers = Blueprint('messengers', __name__)

from . import routes
