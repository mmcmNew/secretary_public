from flask import Blueprint

# Создание Blueprint для 'main'
twitchAPI = Blueprint('twitchAPI', __name__)

from . import routes
