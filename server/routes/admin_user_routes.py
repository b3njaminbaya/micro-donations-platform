from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from server.models import db, User
from server.utils import current_user

admin_user_bp = Blueprint('admin_user_bp', __name__)
VALID_ROLES = {"user", "admin"}
MAX_PER_PAGE = 50


@admin_user_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def list_users():
    acting_user = current_user()
    if not acting_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403

    query = User.query
    search = request.args.get('search')
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(User.name.ilike(like), User.email.ilike(like)))

    try:
        page = max(int(request.args.get('page', 1)), 1)
        per_page = min(max(int(request.args.get('per_page', 20)), 1), MAX_PER_PAGE)
    except ValueError:
        return jsonify({'error': 'page and per_page must be integers'}), 400

    query = query.order_by(User.created_at.asc())
    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'users': [u.to_dict() for u in users],
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page if total else 0,
    }), 200


@admin_user_bp.route('/admin/users/<int:user_id>/role', methods=['PATCH'])
@jwt_required()
def update_user_role(user_id):
    acting_user = current_user()
    if not acting_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403

    target = User.query.get(user_id)
    if not target:
        return jsonify({'error': 'User not found'}), 404

    new_role = (request.get_json() or {}).get('role')
    if new_role not in VALID_ROLES:
        return jsonify({'error': f"role must be one of {sorted(VALID_ROLES)}"}), 400

    # Blocking self-demotion is sufficient on its own to guarantee the admin
    # count can never reach zero through this endpoint: demoting a *different*
    # admin necessarily means the acting admin still remains afterward.
    if target.role == 'admin' and new_role == 'user' and target.id == acting_user.id:
        return jsonify({'error': 'You cannot remove your own admin role'}), 400

    target.role = new_role
    db.session.commit()
    return jsonify(target.to_dict()), 200
