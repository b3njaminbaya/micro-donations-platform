import io
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.models import db, Donation, Cause
from server.utils import current_user
from server.services.receipt_service import build_receipt_pdf

donation_bp = Blueprint('donation_bp', __name__)


@donation_bp.route('/donations/mine', methods=['GET'])
@jwt_required()
def my_donations():
    user_id = int(get_jwt_identity())
    donations = Donation.query.filter_by(user_id=user_id).order_by(Donation.timestamp.desc()).all()
    return jsonify([d.to_dict(include_cause=True) for d in donations]), 200


@donation_bp.route('/donations/cause/<int:cause_id>', methods=['GET'])
def donations_by_cause(cause_id):
    donations = (
        Donation.query
        .filter_by(cause_id=cause_id, status='completed')
        .order_by(Donation.timestamp.desc())
        .all()
    )
    return jsonify([d.to_dict() for d in donations]), 200


@donation_bp.route('/donations', methods=['POST'])
@jwt_required()
def create_donation():
    data = request.get_json() or {}
    cause_id = data.get('cause_id')
    amount = data.get('amount')

    if cause_id is None or amount is None:
        return jsonify({'error': 'cause_id and amount are required'}), 400

    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({'error': 'amount must be a number'}), 400
    if amount <= 0:
        return jsonify({'error': 'amount must be greater than 0'}), 400

    donation = Donation(
        amount=amount,
        cause_id=cause_id,
        user_id=int(get_jwt_identity()),
        status='completed',
    )
    db.session.add(donation)
    db.session.commit()

    return jsonify({'message': 'Donation recorded successfully', 'donation': donation.to_dict()}), 201


@donation_bp.route('/donations/<int:donation_id>/receipt', methods=['GET'])
@jwt_required()
def download_receipt(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({'error': 'Donation not found'}), 404

    user = current_user()
    if donation.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'You do not have permission to view this receipt'}), 403

    if donation.status != 'completed':
        return jsonify({'error': 'A receipt is only available once the donation is completed'}), 400

    pdf_bytes = build_receipt_pdf(donation)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'receipt-{donation.id}.pdf',
    )
