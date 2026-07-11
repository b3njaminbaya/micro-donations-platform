from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.models import db, Comment, Cause
from server.utils import current_user

comment_bp = Blueprint('comment_bp', __name__)
MAX_CONTENT_LENGTH = 1000


@comment_bp.route('/causes/<int:cause_id>/comments', methods=['GET'])
def list_comments(cause_id):
    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404

    comments = (
        Comment.query
        .filter_by(cause_id=cause_id)
        .order_by(Comment.timestamp.desc())
        .all()
    )
    return jsonify([c.to_dict(include_user=True) for c in comments]), 200


@comment_bp.route('/causes/<int:cause_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(cause_id):
    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404

    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    if not content:
        return jsonify({'error': 'content is required'}), 400
    if len(content) > MAX_CONTENT_LENGTH:
        return jsonify({'error': f'content must be at most {MAX_CONTENT_LENGTH} characters'}), 400

    comment = Comment(content=content, cause_id=cause_id, user_id=int(get_jwt_identity()))
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict(include_user=True)), 201


@comment_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404

    user = current_user()
    if comment.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'You do not have permission to delete this comment'}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted successfully'}), 200
