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


def test_receipt_requires_completed_donation(client, auth_headers, make_user, app):
    from server.models import db, Donation

    headers, _ = auth_headers
    cause = create_cause(client, headers)
    donor_headers, donor = make_user(email="donor@example.com")

    with app.app_context():
        pending = Donation(
            amount=20, cause_id=cause["id"], user_id=donor["id"],
            status="pending", checkout_request_id="ws_CO_receipt_test",
        )
        db.session.add(pending)
        db.session.commit()
        donation_id = pending.id

    resp = client.get(f"/api/donations/{donation_id}/receipt", headers=donor_headers)
    assert resp.status_code == 400


def test_receipt_downloads_as_pdf_for_owner(client, auth_headers, admin_headers, make_user):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    donor_headers, donor = make_user(email="donor@example.com")

    donation = client.post(
        "/api/donations", json={"cause_id": cause["id"], "amount": 30, "user_id": donor["id"]}, headers=admin_headers
    ).get_json()["donation"]

    resp = client.get(f"/api/donations/{donation['id']}/receipt", headers=donor_headers)
    assert resp.status_code == 200
    assert resp.mimetype == "application/pdf"
    assert resp.data.startswith(b"%PDF")


def test_receipt_denied_for_non_owner(client, auth_headers, admin_headers, make_user):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    donor_headers, donor = make_user(email="donor@example.com")
    other_headers, _ = make_user(name="Third", email="third@example.com")

    donation = client.post(
        "/api/donations", json={"cause_id": cause["id"], "amount": 30, "user_id": donor["id"]}, headers=admin_headers
    ).get_json()["donation"]

    resp = client.get(f"/api/donations/{donation['id']}/receipt", headers=other_headers)
    assert resp.status_code == 403
