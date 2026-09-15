import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from server.models import db, User
from datetime import timedelta

auth_bp = Blueprint('auth_bp', __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 6
MIN_NAME_LENGTH = 2

# Register route
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not all([name, email, password]):
        return jsonify({"success": False, "message": "All fields are required"}), 400

    if len(name) < MIN_NAME_LENGTH:
        return jsonify({"success": False, "message": f"Name must be at least {MIN_NAME_LENGTH} characters"}), 400

    if not EMAIL_RE.match(email):
        return jsonify({"success": False, "message": "Invalid email format"}), 400

    if len(password) < MIN_PASSWORD_LENGTH:
        return jsonify({
            "success": False,
            "message": f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        }), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"success": False, "message": "Email already in use"}), 400

    user = User(name=name, email=email)
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({"success": True, "message": "User registered successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": "Server error"}), 500


# Login route
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not all([email, password]):
        return jsonify({"success": False, "message": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=1))

    return jsonify({
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    })

