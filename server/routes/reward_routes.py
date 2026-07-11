from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from server.models import db, Reward, UserReward
from server.utils import current_user

reward_bp = Blueprint('reward_bp', __name__)


@reward_bp.route('/rewards', methods=['GET'])
def list_rewards():
    rewards = Reward.query.order_by(Reward.points_required.asc()).all()
    return jsonify([r.to_dict() for r in rewards]), 200


@reward_bp.route('/rewards', methods=['POST'])
@jwt_required()
def create_reward():
    user = current_user()
    if not user.is_admin:
        return jsonify({'error': 'Only admins can manage the rewards catalog'}), 403

    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description')
    points_required = data.get('points_required')

    if not title or not description or points_required is None:
        return jsonify({'error': 'title, description and points_required are required'}), 400

    try:
        points_required = int(points_required)
    except (TypeError, ValueError):
        return jsonify({'error': 'points_required must be a whole number'}), 400
    if points_required <= 0:
        return jsonify({'error': 'points_required must be greater than 0'}), 400

    reward = Reward(
        title=title,
        description=description,
        points_required=points_required,
        image_url=data.get('image_url'),
    )
    db.session.add(reward)
    db.session.commit()
    return jsonify(reward.to_dict()), 201


@reward_bp.route('/rewards/<int:reward_id>', methods=['DELETE'])
@jwt_required()
def delete_reward(reward_id):
    user = current_user()
    if not user.is_admin:
        return jsonify({'error': 'Only admins can manage the rewards catalog'}), 403

    reward = Reward.query.get(reward_id)
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404

    db.session.delete(reward)
    db.session.commit()
    return jsonify({'message': 'Reward deleted successfully'}), 200


@reward_bp.route('/rewards/<int:reward_id>/redeem', methods=['POST'])
@jwt_required()
def redeem_reward(reward_id):
    reward = Reward.query.get(reward_id)
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404

    user = current_user()
    if user.points_balance < reward.points_required:
        return jsonify({
            'error': 'Not enough points to redeem this reward',
            'points_balance': user.points_balance,
            'points_required': reward.points_required,
        }), 400

    redemption = UserReward(user_id=user.id, reward_id=reward.id)
    db.session.add(redemption)
    db.session.commit()

    return jsonify({
        'message': 'Reward redeemed successfully',
        'redemption': redemption.to_dict(include_reward=True),
        'points_balance': user.points_balance,
    }), 201


@reward_bp.route('/rewards/mine', methods=['GET'])
@jwt_required()
def my_rewards():
    user = current_user()
    redemptions = (
        UserReward.query
        .filter_by(user_id=user.id)
        .order_by(UserReward.redeemed_at.desc())
        .all()
    )
    return jsonify({
        'points_earned': user.points_earned,
        'points_redeemed': user.points_redeemed,
        'points_balance': user.points_balance,
        'redemptions': [r.to_dict(include_reward=True) for r in redemptions],
    }), 200
