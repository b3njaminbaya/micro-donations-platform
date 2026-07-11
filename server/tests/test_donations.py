def create_cause(client, headers, **overrides):
    payload = {
        "title": "Clean Water for Villages",
        "description": "Providing safe drinking water.",
        "goal_amount": 1000,
        "category": "Health",
        "country": "Kenya",
    }
    payload.update(overrides)
    return client.post("/api/causes", json=payload, headers=headers).get_json()


def test_donate_requires_auth(client):
    resp = client.post("/api/donations", json={"cause_id": 1, "amount": 10})
    assert resp.status_code == 401


def test_donate_rejects_missing_cause(client, auth_headers):
    headers, _ = auth_headers
    resp = client.post("/api/donations", json={"cause_id": 999, "amount": 10}, headers=headers)
    assert resp.status_code == 404


def test_donate_rejects_non_positive_amount(client, auth_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    resp = client.post("/api/donations", json={"cause_id": cause["id"], "amount": -5}, headers=headers)
    assert resp.status_code == 400


def test_donation_updates_cause_raised_amount(client, auth_headers, make_user):
    headers, _ = auth_headers
    cause = create_cause(client, headers)

    donor_headers, _ = make_user(email="donor@example.com")
    resp = client.post("/api/donations", json={"cause_id": cause["id"], "amount": 25}, headers=donor_headers)
    assert resp.status_code == 201
    assert resp.get_json()["donation"]["status"] == "completed"

    updated_cause = client.get(f"/api/causes/{cause['id']}").get_json()
    assert updated_cause["raised_amount"] == 25


def test_my_donations_only_returns_own_donations(client, auth_headers, make_user):
    headers, _ = auth_headers
    cause = create_cause(client, headers)

    donor_headers, _ = make_user(email="donor@example.com")
    client.post("/api/donations", json={"cause_id": cause["id"], "amount": 25}, headers=donor_headers)

    mine = client.get("/api/donations/mine", headers=donor_headers).get_json()
    assert len(mine) == 1
    assert mine[0]["cause"]["title"] == cause["title"]

    creator_mine = client.get("/api/donations/mine", headers=headers).get_json()
    assert creator_mine == []


def test_pending_mpesa_donations_are_not_counted_until_completed(client, app, auth_headers):
    from server.models import db, Donation

    headers, user = auth_headers
    cause = create_cause(client, headers)

    with app.app_context():
        pending = Donation(
            amount=100, cause_id=cause["id"], user_id=user["id"],
            status="pending", checkout_request_id="ws_CO_test123",
        )
        db.session.add(pending)
        db.session.commit()

    unresolved = client.get(f"/api/causes/{cause['id']}").get_json()
    assert unresolved["raised_amount"] == 0

    callback_body = {
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": "ws_CO_test123",
                "ResultCode": 0,
                "ResultDesc": "Success",
            }
        }
    }
    resp = client.post("/api/mpesa/callback", json=callback_body)
    assert resp.status_code == 200

    resolved = client.get(f"/api/causes/{cause['id']}").get_json()
    assert resolved["raised_amount"] == 100
