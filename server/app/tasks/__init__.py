from flask import Blueprint
from .antischedule import antischedule_bp
from .overrides import overrides_bp

# Создание Blueprint для 'main'
to_do_app = Blueprint('to_do_app', __name__)

to_do_app.register_blueprint(antischedule_bp)
to_do_app.register_blueprint(overrides_bp)


from . import routes
