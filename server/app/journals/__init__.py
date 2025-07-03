from flask import Blueprint

journals = Blueprint('journals', __name__)

from . import routes
