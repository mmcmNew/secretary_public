from datetime import datetime
import re

from flask import current_app, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    current_user,
    get_jwt_identity,
)

from ..models import User
from ...subscription_models import UserSubscription
from ...access_control import get_user_permissions
from app import db

from . import auth_bp

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$"


def validate_email(email: str) -> bool:
    return re.match(EMAIL_REGEX, email) is not None


def validate_password(password: str):
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, ""


@auth_bp.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        current_app.logger.warning(
            f"LOGIN: missing username or password. Data: {data}"
        )
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(user_name=username).first()
    if not user or not user.check_password(password):
        current_app.logger.warning(
            f"LOGIN: authentication failed for username: {username}"
        )
        return jsonify({"error": "Invalid username or password"}), 401

    active_sub = UserSubscription.query.filter_by(
        user_id=user.user_id, is_active=True
    ).first()
    if active_sub:
        if active_sub.end_date and active_sub.end_date < datetime.utcnow():
            active_sub.is_active = False
            user.access_level_id = 1
            db.session.commit()
    permissions = get_user_permissions(getattr(user, "access_level_id", 1), user.user_id)

    access_token = create_access_token(identity=str(user.user_id))
    refresh_token = create_refresh_token(identity=str(user.user_id))
    current_app.logger.info(f"LOGIN: success for user: {username}")
    response = make_response(
        jsonify(
            {
                "user": user.to_dict(),
                "permissions": permissions,
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        ),
        200,
    )
    response.set_cookie(
        "access_token",
        access_token,
        secure=True,
        samesite="Lax",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        secure=True,
        samesite="Lax",
    )
    return response


@auth_bp.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        current_app.logger.warning(
            f"REGISTER: missing username/email/password. Data: {data}"
        )
        return jsonify({"error": "Username, email and password are required"}), 400

    if not validate_email(email):
        current_app.logger.warning(f"REGISTER: invalid email format: {email}")
        return jsonify({"error": "Invalid email format"}), 400

    is_valid, message = validate_password(password)
    if not is_valid:
        current_app.logger.warning(f"REGISTER: invalid password: {message}")
        return jsonify({"error": message}), 400

    existing_username = User.query.filter_by(user_name=username).first()
    if existing_username:
        current_app.logger.warning(f"REGISTER: username already taken: {username}")
        return jsonify({"error": "Username already taken"}), 400

    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        current_app.logger.warning(f"REGISTER: email already registered: {email}")
        return jsonify({"error": "Email already registered"}), 400

    user = User(user_name=username, email=email, modules=[])
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    user.initialize_user_workspace()

    access_token = create_access_token(identity=str(user.user_id))
    refresh_token = create_refresh_token(identity=str(user.user_id))
    current_app.logger.info(f"REGISTER: user created: {username}, {email}")
    response = make_response(
        jsonify(
            {
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        ),
        201,
    )
    response.set_cookie(
        "access_token",
        access_token,
        secure=True,
        samesite="Lax",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        secure=True,
        samesite="Lax",
    )
    return response


@auth_bp.route("/api/refresh", methods=["POST"])
@jwt_required(refresh=True)
def api_refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    response = make_response(
        jsonify({"access_token": new_access_token}),
        200,
    )
    response.set_cookie(
        "access_token",
        new_access_token,
        secure=True,
        samesite="Lax",
    )
    return response


@auth_bp.route("/api/logout", methods=["POST"])
def api_logout():
    response = make_response(jsonify({"result": "OK"}))
    response.set_cookie("access_token", "", expires=0)
    response.set_cookie("refresh_token", "", expires=0)
    return response


@auth_bp.route("/api/user", methods=["GET"])
@jwt_required()
def api_current_user():
    return jsonify(current_user.to_dict()), 200
