from flask import Blueprint
from .antischedule import antischedule_bp
from .calendar import calendar_bp

# Создание Blueprint для 'main'
to_do_app = Blueprint('to_do_app', __name__)

to_do_app.register_blueprint(antischedule_bp)
to_do_app.register_blueprint(calendar_bp)


from . import routes
