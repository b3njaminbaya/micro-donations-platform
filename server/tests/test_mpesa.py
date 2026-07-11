import os


def test_stk_push_fails_cleanly_without_config(client, auth_headers, app):
    from server.models import db, Cause

    headers, user = auth_headers
    with app.app_context():
        cause = Cause(
            title="Test", description="Test", goal_amount=100,
            category="Health", country="Kenya", user_id=user["id"],
        )
        db.session.add(cause)
        db.session.commit()
        cause_id = cause.id

    resp = client.post(
        "/api/mpesa/stk-push",
        json={"phoneNumber": "254700000000", "amount": 10, "causeId": cause_id},
        headers=headers,
    )
    # No sandbox credentials configured in the test environment -> a clean
    # 502 with details, never an unhandled 500.
    assert resp.status_code == 502
    assert "error" in resp.get_json()


def test_callback_rejects_wrong_token_when_secret_configured(client, monkeypatch):
    monkeypatch.setattr("server.routes.mpesa_routes.Config.CALLBACK_SECRET", "supersecret")
    resp = client.post("/api/mpesa/callback?token=wrong", json={})
    assert resp.status_code == 403


def test_callback_accepts_correct_token_when_secret_configured(client, monkeypatch):
    monkeypatch.setattr("server.routes.mpesa_routes.Config.CALLBACK_SECRET", "supersecret")
    resp = client.post("/api/mpesa/callback?token=supersecret", json={})
    assert resp.status_code == 200


def test_callback_allows_any_request_when_no_secret_configured(client, monkeypatch):
    monkeypatch.setattr("server.routes.mpesa_routes.Config.CALLBACK_SECRET", None)
    resp = client.post("/api/mpesa/callback", json={})
    assert resp.status_code == 200
