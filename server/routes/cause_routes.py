import os
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.models import db, Cause
from server.utils import current_user

cause_bp = Blueprint('cause_bp', __name__)
MAX_PER_PAGE = 50

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Magic-byte signatures for each allowed extension, so a renamed non-image
# file (e.g. a .html file saved as photo.jpg) is rejected instead of being
# stored and served back under /api/uploads.
IMAGE_SIGNATURES = {
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "gif": [b"GIF87a", b"GIF89a"],
}
SIGNATURE_READ_LENGTH = max(len(sig) for sigs in IMAGE_SIGNATURES.values() for sig in sigs)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def has_valid_image_signature(file_storage, extension):
    header = file_storage.stream.read(SIGNATURE_READ_LENGTH)
    file_storage.stream.seek(0)
    return any(header.startswith(sig) for sig in IMAGE_SIGNATURES.get(extension, []))


def _parse_goal_amount(raw):
    try:
        amount = float(raw)
    except (TypeError, ValueError):
        return None, ('goal_amount must be a number', 400)
    if amount <= 0:
        return None, ('goal_amount must be greater than 0', 400)
    return amount, None


@cause_bp.route('/causes', methods=['GET'])
def list_causes():
    query = Cause.query

    category = request.args.get('category')
    if category and category != 'All':
        query = query.filter(Cause.category == category)

    country = request.args.get('country')
    if country and country != 'All':
        query = query.filter(Cause.country == country)

    search = request.args.get('search')
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(Cause.title.ilike(like), Cause.description.ilike(like)))

    try:
        page = max(int(request.args.get('page', 1)), 1)
        per_page = min(max(int(request.args.get('per_page', 12)), 1), MAX_PER_PAGE)
    except ValueError:
        return jsonify({'error': 'page and per_page must be integers'}), 400

    query = query.order_by(Cause.created_at.desc())
    total = query.count()
    causes = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'causes': [c.to_dict() for c in causes],
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page if total else 0,
    }), 200


@cause_bp.route('/causes/countries', methods=['GET'])
def list_countries():
    rows = db.session.query(Cause.country).distinct().order_by(Cause.country).all()
    return jsonify([r[0] for r in rows if r[0]]), 200


@cause_bp.route('/causes/featured', methods=['GET'])
def featured_causes():
    categories = db.session.query(Cause.category).distinct().all()
    featured = [
        Cause.query.filter_by(category=c[0]).order_by(Cause.created_at.desc()).first()
        for c in categories if c[0]
    ]
    return jsonify([c.to_dict() for c in featured if c]), 200


@cause_bp.route('/causes/mine', methods=['GET'])
@jwt_required()
def my_causes():
    user_id = int(get_jwt_identity())
    causes = Cause.query.filter_by(user_id=user_id).order_by(Cause.created_at.desc()).all()
    return jsonify([c.to_dict() for c in causes]), 200


@cause_bp.route('/causes/<int:cause_id>', methods=['GET'])
def get_cause(cause_id):
    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404
    return jsonify(cause.to_dict(include_user=True)), 200


@cause_bp.route('/causes', methods=['POST'])
@jwt_required()
def create_cause():
    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    country = data.get('country')

    if not all([title, description, category, country]) or data.get('goal_amount') is None:
        return jsonify({'error': 'title, description, goal_amount, category and country are required'}), 400

    goal_amount, err = _parse_goal_amount(data.get('goal_amount'))
    if err:
        return jsonify({'error': err[0]}), err[1]

    cause = Cause(
        title=title,
        description=description,
        goal_amount=goal_amount,
        category=category,
        country=country,
        image_url=data.get('image_url'),
        user_id=int(get_jwt_identity()),
    )
    db.session.add(cause)
    db.session.commit()
    return jsonify(cause.to_dict()), 201


@cause_bp.route('/causes/<int:cause_id>', methods=['PATCH'])
@jwt_required()
def update_cause(cause_id):
    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404
    user = current_user()
    if cause.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'You do not have permission to edit this cause'}), 403

    data = request.get_json() or {}
    if 'goal_amount' in data:
        goal_amount, err = _parse_goal_amount(data['goal_amount'])
        if err:
            return jsonify({'error': err[0]}), err[1]
        cause.goal_amount = goal_amount

    cause.title = data.get('title', cause.title)
    cause.description = data.get('description', cause.description)
    cause.category = data.get('category', cause.category)
    cause.country = data.get('country', cause.country)
    cause.image_url = data.get('image_url', cause.image_url)

    db.session.commit()
    return jsonify(cause.to_dict()), 200


@cause_bp.route('/causes/<int:cause_id>', methods=['DELETE'])
@jwt_required()
def delete_cause(cause_id):
    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404
    user = current_user()
    if cause.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'You do not have permission to delete this cause'}), 403

    db.session.delete(cause)
    db.session.commit()
    return jsonify({'message': 'Cause deleted successfully'}), 200


@cause_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid or missing file. Allowed types: png, jpg, jpeg, gif'}), 400

    extension = file.filename.rsplit(".", 1)[1].lower()
    if not has_valid_image_signature(file, extension):
        return jsonify({'error': 'File content does not match a valid image of the given type'}), 400

    timestamp = int(datetime.utcnow().timestamp())
    filename = secure_filename(f"{get_jwt_identity()}_{timestamp}_{file.filename}")
    file.save(os.path.join(UPLOAD_FOLDER, filename))

    image_url = f"{request.host_url.rstrip('/')}/api/uploads/{filename}"
    return jsonify({'image_url': image_url}), 201


@cause_bp.route('/uploads/<path:filename>', methods=['GET'])
def get_upload(filename):
    response = send_from_directory(UPLOAD_FOLDER, filename)
    # Uploaded files are only ever validated as images, not otherwise
    # sanitized — this stops a browser from sniffing one as HTML/JS and
    # executing it if the signature check above were ever bypassed.
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response
