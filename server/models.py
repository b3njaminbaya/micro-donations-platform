from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

POINTS_PER_DOLLAR = 10


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    # 'user': can create causes and donate. 'admin': can moderate any cause/donation.
    # Never settable from a public request body — see auth_routes.register().
    role = db.Column(db.String(20), nullable=False, default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    causes = db.relationship("Cause", backref="creator", lazy=True)
    donations = db.relationship("Donation", backref="donor", lazy=True)
    comments = db.relationship("Comment", backref="author", lazy=True)
    redeemed_rewards = db.relationship("UserReward", backref="user", lazy=True)
    recurring_donations = db.relationship("RecurringDonation", backref="donor", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def points_earned(self):
        donated = sum(d.amount for d in self.donations if d.status == 'completed')
        return int(donated * POINTS_PER_DOLLAR)

    @property
    def points_redeemed(self):
        return sum(ur.reward.points_required for ur in self.redeemed_rewards if ur.reward)

    @property
    def points_balance(self):
        return self.points_earned - self.points_redeemed

    def to_dict(self, include_points=False):
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat()
        }
        if include_points:
            data["points_balance"] = self.points_balance
        return data

class Cause(db.Model):
    __tablename__ = 'causes'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255))
    goal_amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    donations = db.relationship("Donation", backref="cause", lazy=True)
    comments = db.relationship("Comment", backref="cause", lazy=True)
    recurring_donations = db.relationship("RecurringDonation", backref="cause", lazy=True)

    payouts = db.relationship("Payout", backref="cause", lazy=True)

    @property
    def raised_amount(self):
        return sum(d.amount for d in self.donations if d.status == 'completed')

    @property
    def paid_out_amount(self):
        """Funds already sent or in flight to the creator — reserved so they can't be withdrawn twice."""
        return sum(p.amount for p in self.payouts if p.status in ('pending', 'processing', 'completed'))

    @property
    def available_balance(self):
        return self.raised_amount - self.paid_out_amount

    def to_dict(self, include_user=False):
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "image_url": self.image_url,
            "goal_amount": self.goal_amount,
            "raised_amount": self.raised_amount,
            "available_balance": self.available_balance,
            "category": self.category,
            "country": self.country,
            "created_at": self.created_at.isoformat(),
            "user_id": self.user_id,
            "creator_name": self.creator.name if self.creator else None,
        }
        if include_user:
            data["creator"] = self.creator.to_dict()
        return data

    def to_summary_dict(self):
        return {"id": self.id, "title": self.title, "image_url": self.image_url}

class Donation(db.Model):
    __tablename__ = 'donations'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    # completed: recorded/confirmed. pending: M-Pesa STK push sent, awaiting callback. failed: callback reported failure.
    status = db.Column(db.String(20), nullable=False, default='completed')
    checkout_request_id = db.Column(db.String(80), unique=True, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    cause_id = db.Column(db.Integer, db.ForeignKey("causes.id"), nullable=False)
    # Set only for donations triggered by the recurring-donations job.
    recurring_donation_id = db.Column(db.Integer, db.ForeignKey("recurring_donations.id"), nullable=True)

    def to_dict(self, include_cause=False):
        data = {
            "id": self.id,
            "amount": self.amount,
            "status": self.status,
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "cause_id": self.cause_id,
            "recurring_donation_id": self.recurring_donation_id,
        }
        if include_cause:
            data["cause"] = self.cause.to_summary_dict() if self.cause else None
        return data


class Payout(db.Model):
    __tablename__ = "payouts"

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    # pending: B2C request sent, awaiting Safaricom's result callback.
    # completed: callback reported success. failed: callback reported failure,
    # or the B2C request itself could not be started.
    status = db.Column(db.String(20), nullable=False, default='pending')
    conversation_id = db.Column(db.String(80), unique=True, nullable=True)
    failure_reason = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime, nullable=True)

    cause_id = db.Column(db.Integer, db.ForeignKey("causes.id"), nullable=False)
    requested_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    requested_by = db.relationship("User", foreign_keys=[requested_by_id])

    def to_dict(self, include_cause=False):
        data = {
            "id": self.id,
            "amount": self.amount,
            "phone_number": self.phone_number,
            "status": self.status,
            "failure_reason": self.failure_reason,
            "created_at": self.created_at.isoformat(),
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "cause_id": self.cause_id,
            "requested_by_id": self.requested_by_id,
            "requested_by_name": self.requested_by.name if self.requested_by else None,
        }
        if include_cause:
            data["cause"] = self.cause.to_summary_dict() if self.cause else None
        return data


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    cause_id = db.Column(db.Integer, db.ForeignKey("causes.id"), nullable=False)

    def to_dict(self, include_user=False):
        data = {
            "id": self.id,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "cause_id": self.cause_id
        }
        if include_user:
            data["author"] = self.author.to_dict()
        return data


class Reward(db.Model):
    __tablename__ = "rewards"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    points_required = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    redemptions = db.relationship("UserReward", backref="reward", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "points_required": self.points_required,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat(),
        }


class UserReward(db.Model):
    __tablename__ = "user_rewards"

    id = db.Column(db.Integer, primary_key=True)
    redeemed_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey("rewards.id"), nullable=False)

    def to_dict(self, include_reward=False):
        data = {
            "id": self.id,
            "redeemed_at": self.redeemed_at.isoformat(),
            "user_id": self.user_id,
            "reward_id": self.reward_id,
        }
        if include_reward:
            data["reward"] = self.reward.to_dict() if self.reward else None
        return data


class RecurringDonation(db.Model):
    __tablename__ = "recurring_donations"

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    frequency = db.Column(db.String(10), nullable=False)  # 'weekly' | 'monthly'
    status = db.Column(db.String(10), nullable=False, default='active')  # 'active' | 'cancelled'
    next_run_date = db.Column(db.Date, nullable=False)
    last_run_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    cause_id = db.Column(db.Integer, db.ForeignKey("causes.id"), nullable=False)

    triggered_donations = db.relationship("Donation", backref="recurring_donation", lazy=True)

    def to_dict(self, include_cause=False):
        data = {
            "id": self.id,
            "amount": self.amount,
            "phone_number": self.phone_number,
            "frequency": self.frequency,
            "status": self.status,
            "next_run_date": self.next_run_date.isoformat(),
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "created_at": self.created_at.isoformat(),
            "user_id": self.user_id,
            "cause_id": self.cause_id,
            "charge_count": len(self.triggered_donations),
        }
        if include_cause:
            data["cause"] = self.cause.to_summary_dict() if self.cause else None
        return data
