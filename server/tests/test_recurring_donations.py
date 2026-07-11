from datetime import date, timedelta


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


def test_create_recurring_donation_requires_auth(client):
    resp = client.post("/api/recurring-donations", json={})
    assert resp.status_code == 401


def test_create_recurring_donation_rejects_bad_frequency(client, auth_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    resp = client.post(
        "/api/recurring-donations",
        json={"cause_id": cause["id"], "amount": 10, "phone_number": "254700000000", "frequency": "daily"},
        headers=headers,
    )
    assert resp.status_code == 400


def test_create_recurring_donation_fails_cleanly_without_mpesa_config(client, auth_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    resp = client.post(
        "/api/recurring-donations",
        json={"cause_id": cause["id"], "amount": 10, "phone_number": "254700000000", "frequency": "weekly"},
        headers=headers,
    )
    # No sandbox credentials configured in the test environment.
    assert resp.status_code == 502


def test_create_recurring_donation_succeeds_with_mocked_mpesa(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "server.routes.recurring_donation_routes.MpesaService.initiate_stk_push",
        lambda phone, amount, cause_id: {"CheckoutRequestID": "ws_CO_recurring_1"},
    )
    headers, user = auth_headers
    cause = create_cause(client, headers)

    resp = client.post(
        "/api/recurring-donations",
        json={"cause_id": cause["id"], "amount": 15, "phone_number": "254700000000", "frequency": "monthly"},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.get_json()["subscription"]
    assert body["status"] == "active"
    assert body["cause"]["title"] == cause["title"]
    assert body["cause"]["image_url"] == cause["image_url"]
    # The first charge is pending confirmation, not yet counted as a completed payment.
    assert body["charge_count"] == 1

    mine = client.get("/api/recurring-donations/mine", headers=headers).get_json()
    assert len(mine) == 1

    donations = client.get("/api/donations/mine", headers=headers).get_json()
    assert len(donations) == 1
    assert donations[0]["status"] == "pending"


def test_cancel_recurring_donation_requires_ownership(client, auth_headers, make_user, monkeypatch):
    monkeypatch.setattr(
        "server.routes.recurring_donation_routes.MpesaService.initiate_stk_push",
        lambda phone, amount, cause_id: {"CheckoutRequestID": "ws_CO_recurring_2"},
    )
    headers, _ = auth_headers
    cause = create_cause(client, headers)

    subscription = client.post(
        "/api/recurring-donations",
        json={"cause_id": cause["id"], "amount": 15, "phone_number": "254700000000", "frequency": "weekly"},
        headers=headers,
    ).get_json()["subscription"]

    other_headers, _ = make_user(email="other@example.com")
    resp = client.delete(f"/api/recurring-donations/{subscription['id']}", headers=other_headers)
    assert resp.status_code == 403

    resp = client.delete(f"/api/recurring-donations/{subscription['id']}", headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["subscription"]["status"] == "cancelled"


def test_job_charges_due_subscriptions_and_advances_schedule(client, auth_headers, app, monkeypatch):
    from server.models import db, RecurringDonation
    from server.jobs import run_recurring_donations

    monkeypatch.setattr(
        "server.jobs.run_recurring_donations.MpesaService.initiate_stk_push",
        lambda phone, amount, cause_id: {"CheckoutRequestID": "ws_CO_job_run"},
    )

    headers, user = auth_headers
    cause = create_cause(client, headers)

    with app.app_context():
        due = RecurringDonation(
            amount=25, phone_number="254700000000", frequency="weekly",
            status="active", next_run_date=date.today() - timedelta(days=1),
            user_id=user["id"], cause_id=cause["id"],
        )
        not_due = RecurringDonation(
            amount=25, phone_number="254700000000", frequency="weekly",
            status="active", next_run_date=date.today() + timedelta(days=5),
            user_id=user["id"], cause_id=cause["id"],
        )
        db.session.add_all([due, not_due])
        db.session.commit()

        run_recurring_donations.run()

        db.session.refresh(due)
        db.session.refresh(not_due)
        assert due.next_run_date == date.today() - timedelta(days=1) + timedelta(weeks=1)
        assert due.last_run_at is not None
        assert not_due.last_run_at is None  # untouched, not due yet

    donations = client.get("/api/donations/mine", headers=headers).get_json()
    assert len(donations) == 1
    assert donations[0]["status"] == "pending"
