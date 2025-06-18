from flask import Blueprint

# Создание Blueprint для 'dashboard'
dashboard = Blueprint('dashboard', __name__)

from . import routes
