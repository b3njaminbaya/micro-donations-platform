import os
import tempfile

import pytest

# Tests must be hermetic regardless of what a developer's real .env contains
# (load_dotenv() in server/app.py uses override=False, so setting these here
# first — before server.app is imported — wins over any real .env values).
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["FLASK_DEBUG"] = "1"
os.environ["MPESA_CONSUMER_KEY"] = ""
os.environ["MPESA_CONSUMER_SECRET"] = ""
os.environ["MPESA_SHORTCODE"] = ""
os.environ["MPESA_PASSKEY"] = ""
os.environ["MPESA_CALLBACK_URL"] = ""
os.environ["MPESA_CALLBACK_SECRET"] = ""

from server.app import create_app  # noqa: E402
from server.models import db as _db  # noqa: E402


@pytest.fixture()
def app():
    db_fd, db_path = tempfile.mkstemp()
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

    flask_app = create_app()
    flask_app.config.update(TESTING=True)

    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()

    os.close(db_fd)
    os.unlink(db_path)
    del os.environ["DATABASE_URL"]


@pytest.fixture()
def client(app):
    return app.test_client()


def register_and_login(client, name="Test User", email="user@example.com", password="password123"):
    client.post("/api/register", json={"name": name, "email": email, "password": password})
    resp = client.post("/api/login", json={"email": email, "password": password})
    body = resp.get_json()
    return body["access_token"], body["user"]


@pytest.fixture()
def auth_headers(client):
    token, user = register_and_login(client)
    return {"Authorization": f"Bearer {token}"}, user


@pytest.fixture()
def make_user(client):
    """Factory fixture: make_user(email=...) -> (headers, user_dict)."""
    def _make(name="Another User", email="another@example.com", password="password123"):
        token, user = register_and_login(client, name=name, email=email, password=password)
        return {"Authorization": f"Bearer {token}"}, user
    return _make


@pytest.fixture()
def admin_headers(client, app):
    from server.models import User

    token, user = register_and_login(client, name="Admin", email="admin@example.com", password="adminpass123")
    with app.app_context():
        db_user = User.query.filter_by(email="admin@example.com").first()
        db_user.role = "admin"
        _db.session.commit()
    return {"Authorization": f"Bearer {token}"}
