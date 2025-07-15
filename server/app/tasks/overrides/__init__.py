from flask import Blueprint

overrides_bp = Blueprint('overrides', __name__)

from . import routes