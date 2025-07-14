from flask import Blueprint
from .antischedule import antischedule_bp

# Создание Blueprint для 'main'
to_do_app = Blueprint('to_do_app', __name__)

to_do_app.register_blueprint(antischedule_bp)


from . import routes
