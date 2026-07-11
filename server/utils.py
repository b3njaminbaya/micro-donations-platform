from flask_jwt_extended import get_jwt_identity
from server.models import User


def current_user():
    """The authenticated User for the current request. Call inside @jwt_required()."""
    return User.query.get(int(get_jwt_identity()))
