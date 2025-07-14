from flask import Blueprint

antischedule_bp = Blueprint('antischedule', __name__)

from . import routes
