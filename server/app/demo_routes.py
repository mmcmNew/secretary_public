from flask import Blueprint, jsonify, g, request
from datetime import datetime, timedelta
from .main.models import User
from flask_jwt_extended import create_access_token

demo_bp = Blueprint('demo', __name__)

def get_or_create_demo_user():
    """Get or create demo user"""
    from app import db
    demo_user = User.query.filter_by(email='demo@example.com').first()
    
    if not demo_user:
        demo_user = User(
            user_name="Demo User",
            email="demo@example.com",
            avatar_src="demo-avatar.png",
            last_dashboard_id=0,
            modules=['diary'],  # базовые модули для демо
            access_level_id=1,  # базовый уровень доступа
            is_admin=False
        )
        demo_user.set_password("demo123")  # пароль не будет использоваться
        db.session.add(demo_user)
        db.session.commit()
    
    return demo_user

@demo_bp.route('/api/demo/auth')
def get_demo_token():
    """Get JWT token for demo user"""
    demo_user = get_or_create_demo_user()
    access_token = create_access_token(identity=demo_user.user_id)
    
    return jsonify({
        "status": "success",
        "data": {
            "token": access_token,
            "user": {
                "id": demo_user.user_id,
                "name": demo_user.user_name,
                "email": demo_user.email,
                "avatar": demo_user.avatar_src,
                "access_level": demo_user.access_level_id,
                "is_admin": demo_user.is_admin,
                "modules": demo_user.modules
            }
        }
    })

@demo_bp.route('/api/demo/tasks/get_lists_tree')
def get_demo_lists_tree():
    """Get demo lists tree without auth"""
    from .tasks.list_handlers import get_lists_tree_data
    demo_user = get_or_create_demo_user()
    client_timezone = request.args.get('time_zone', 'UTC')
    data = get_lists_tree_data(client_timezone, user_id=demo_user.user_id)
    return jsonify(data)
