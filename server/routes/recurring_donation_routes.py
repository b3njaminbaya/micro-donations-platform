from datetime import date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.models import db, RecurringDonation, Donation, Cause
from server.services.mpesa_service import MpesaService
from server.utils import current_user
from server.jobs.schedule import advance

recurring_bp = Blueprint('recurring_bp', __name__)
VALID_FREQUENCIES = {"weekly", "monthly"}


@recurring_bp.route('/recurring-donations', methods=['POST'])
@jwt_required()
def create_recurring_donation():
    data = request.get_json() or {}
    cause_id = data.get('cause_id')
    amount = data.get('amount')
    phone_number = data.get('phone_number')
    frequency = data.get('frequency')

    if not all([cause_id, amount, phone_number, frequency]):
        return jsonify({'error': 'cause_id, amount, phone_number and frequency are required'}), 400
    if frequency not in VALID_FREQUENCIES:
        return jsonify({'error': f"frequency must be one of {sorted(VALID_FREQUENCIES)}"}), 400

    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({'error': 'Cause not found'}), 404

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({'error': 'amount must be a number'}), 400
    if amount <= 0:
        return jsonify({'error': 'amount must be greater than 0'}), 400

    user = current_user()

    # Charge the first cycle immediately, same as a one-off donation.
    response = MpesaService.initiate_stk_push(phone_number, amount, cause_id)
    checkout_request_id = response.get("CheckoutRequestID")
    if not checkout_request_id:
        return jsonify({"error": "Could not start the first M-Pesa payment", "details": response}), 502

    today = date.today()
    subscription = RecurringDonation(
        amount=amount,
        phone_number=phone_number,
        frequency=frequency,
        status='active',
        next_run_date=advance(today, frequency),
        user_id=user.id,
        cause_id=cause_id,
    )
    db.session.add(subscription)
    db.session.flush()  # assigns subscription.id before the Donation references it

    first_charge = Donation(
        amount=amount,
        cause_id=cause_id,
        user_id=user.id,
        status='pending',
        checkout_request_id=checkout_request_id,
        recurring_donation_id=subscription.id,
    )
    db.session.add(first_charge)
    db.session.commit()

    return jsonify({
        'message': 'Recurring donation set up. Approve the M-Pesa prompt on your phone to confirm the first payment.',
        'subscription': subscription.to_dict(include_cause=True),
    }), 201


@recurring_bp.route('/recurring-donations/mine', methods=['GET'])
@jwt_required()
def my_recurring_donations():
    user_id = int(get_jwt_identity())
    subscriptions = (
        RecurringDonation.query
        .filter_by(user_id=user_id)
        .order_by(RecurringDonation.created_at.desc())
        .all()
    )
    return jsonify([s.to_dict(include_cause=True) for s in subscriptions]), 200


@recurring_bp.route('/recurring-donations/<int:subscription_id>', methods=['DELETE'])
@jwt_required()
def cancel_recurring_donation(subscription_id):
    subscription = RecurringDonation.query.get(subscription_id)
    if not subscription:
        return jsonify({'error': 'Recurring donation not found'}), 404

    user = current_user()
    if subscription.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'You do not have permission to cancel this recurring donation'}), 403

    subscription.status = 'cancelled'
    db.session.commit()
    return jsonify({'message': 'Recurring donation cancelled', 'subscription': subscription.to_dict()}), 200
