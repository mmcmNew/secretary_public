from flask import Blueprint

# Создание Blueprint для 'main'
ai_routes = Blueprint('ai_routes', __name__)

from . import routes
