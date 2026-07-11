from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.config import Config
from server.models import db, Donation, Cause
from server.services.mpesa_service import MpesaService

mpesa_bp = Blueprint('mpesa_bp', __name__)


@mpesa_bp.route('/mpesa/stk-push', methods=['POST'])
@jwt_required()
def stk_push():
    """Start an M-Pesa payment. Creates a 'pending' donation the callback below resolves."""
    data = request.get_json() or {}
    phone_number = data.get("phoneNumber")
    amount = data.get("amount")
    cause_id = data.get("causeId")

    if not phone_number or not amount or not cause_id:
        return jsonify({"error": "phoneNumber, amount and causeId are required"}), 400

    cause = Cause.query.get(cause_id)
    if not cause:
        return jsonify({"error": "Cause not found"}), 404

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a number"}), 400
    if amount <= 0:
        return jsonify({"error": "amount must be greater than 0"}), 400

    response = MpesaService.initiate_stk_push(phone_number, amount, cause_id)
    checkout_request_id = response.get("CheckoutRequestID")
    if not checkout_request_id:
        return jsonify({"error": "Could not start the M-Pesa payment", "details": response}), 502

    pending = Donation(
        amount=amount,
        cause_id=cause_id,
        user_id=int(get_jwt_identity()),
        status='pending',
        checkout_request_id=checkout_request_id,
    )
    db.session.add(pending)
    db.session.commit()

    return jsonify(response), 200


@mpesa_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """
    Safaricom's callback. Verified via a shared-secret token appended to the
    callback URL we register (?token=...), since Safaricom calls back with no
    other verifiable signature or IP range guarantee. If MPESA_CALLBACK_SECRET
    isn't configured (e.g. sandbox), verification is skipped rather than
    locking out testing. We always ACK with ResultCode 0 so Safaricom stops
    retrying, regardless of the payment outcome, per Daraja's requirements.
    """
    if Config.CALLBACK_SECRET and request.args.get('token') != Config.CALLBACK_SECRET:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json(silent=True) or {}
    body = data.get("Body", {}).get("stkCallback", {})
    checkout_request_id = body.get("CheckoutRequestID")
    result_code = body.get("ResultCode")

    donation = Donation.query.filter_by(checkout_request_id=checkout_request_id).first()
    if donation and donation.status == 'pending':
        donation.status = 'completed' if result_code == 0 else 'failed'
        db.session.commit()

    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200
