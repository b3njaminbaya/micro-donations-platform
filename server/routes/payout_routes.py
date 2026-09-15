from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from server.models import db, Payout, Cause
from server.services.mpesa_service import MpesaService
from server.utils import current_user

payout_bp = Blueprint('payout_bp', __name__)
MAX_PER_PAGE = 50


@payout_bp.route('/causes/<int:cause_id>/payouts', methods=['POST'])
@jwt_required()
def request_payout(cause_id):
    """Cause creator (or an admin) withdraws some or all of a cause's raised-but-not-yet-paid-out balance."""
    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404

    user = current_user()
    if cause.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'You do not have permission to withdraw funds for this cause'}), 403

    data = request.get_json() or {}
    phone_number = data.get('phone_number')
    amount = data.get('amount')

    if not phone_number or amount is None:
        return jsonify({'error': 'phone_number and amount are required'}), 400

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({'error': 'amount must be a number'}), 400
    if amount <= 0:
        return jsonify({'error': 'amount must be greater than 0'}), 400
    if amount > cause.available_balance:
        return jsonify({
            'error': 'amount exceeds the funds available to withdraw for this cause',
            'available_balance': cause.available_balance,
        }), 400

    response = MpesaService.initiate_b2c_payment(
        phone_number, amount, remarks=f"Payout for {cause.title}",
    )
    conversation_id = response.get("ConversationID")
    if not conversation_id:
        return jsonify({"error": "Could not start the payout", "details": response}), 502

    payout = Payout(
        amount=amount,
        phone_number=phone_number,
        status='pending',
        conversation_id=conversation_id,
        cause_id=cause.id,
        requested_by_id=user.id,
    )
    db.session.add(payout)
    db.session.commit()

    return jsonify({
        'message': 'Payout started. It will complete once M-Pesa confirms the transfer.',
        'payout': payout.to_dict(),
    }), 201


@payout_bp.route('/causes/<int:cause_id>/payouts', methods=['GET'])
@jwt_required()
def list_cause_payouts(cause_id):
    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404

    user = current_user()
    if cause.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'You do not have permission to view payouts for this cause'}), 403

    payouts = (
        Payout.query
        .filter_by(cause_id=cause_id)
        .order_by(Payout.created_at.desc())
        .all()
    )
    return jsonify([p.to_dict() for p in payouts]), 200


@payout_bp.route('/admin/payouts', methods=['GET'])
@jwt_required()
def list_all_payouts():
    user = current_user()
    if not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403

    query = Payout.query

    status = request.args.get('status')
    if status:
        query = query.filter(Payout.status == status)

    try:
        page = max(int(request.args.get('page', 1)), 1)
        per_page = min(max(int(request.args.get('per_page', 20)), 1), MAX_PER_PAGE)
    except ValueError:
        return jsonify({'error': 'page and per_page must be integers'}), 400

    query = query.order_by(Payout.created_at.desc())
    total = query.count()
    payouts = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'payouts': [p.to_dict(include_cause=True) for p in payouts],
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page if total else 0,
    }), 200
