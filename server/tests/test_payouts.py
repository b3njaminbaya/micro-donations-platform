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


def fund_cause(client, cause_id, amount, admin_headers, donor_id=None):
    payload = {"cause_id": cause_id, "amount": amount}
    if donor_id is not None:
        payload["user_id"] = donor_id
    return client.post("/api/donations", json=payload, headers=admin_headers).get_json()


def test_request_payout_requires_auth(client):
    resp = client.post("/api/causes/1/payouts", json={"amount": 10, "phone_number": "254700000000"})
    assert resp.status_code == 401


def test_request_payout_requires_ownership(client, auth_headers, admin_headers, make_user):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 100, admin_headers)

    other_headers, _ = make_user(email="other@example.com")
    resp = client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 10, "phone_number": "254700000000"},
        headers=other_headers,
    )
    assert resp.status_code == 403


def test_request_payout_rejects_amount_above_available_balance(client, auth_headers, admin_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 50, admin_headers)

    resp = client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 100, "phone_number": "254700000000"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert resp.get_json()["available_balance"] == 50


def test_request_payout_rejects_non_positive_amount(client, auth_headers, admin_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 50, admin_headers)

    resp = client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 0, "phone_number": "254700000000"},
        headers=headers,
    )
    assert resp.status_code == 400


def test_request_payout_fails_cleanly_without_b2c_config(client, auth_headers, admin_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 50, admin_headers)

    resp = client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 50, "phone_number": "254700000000"},
        headers=headers,
    )
    assert resp.status_code == 502
    assert "error" in resp.get_json()


def test_request_payout_succeeds_with_mocked_mpesa_and_reserves_balance(client, auth_headers, admin_headers, monkeypatch):
    monkeypatch.setattr(
        "server.routes.payout_routes.MpesaService.initiate_b2c_payment",
        lambda phone, amount, remarks: {"ConversationID": "AG_20260916_payout1"},
    )
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 100, admin_headers)

    resp = client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 60, "phone_number": "254700000000"},
        headers=headers,
    )
    assert resp.status_code == 201
    payout = resp.get_json()["payout"]
    assert payout["status"] == "pending"

    updated_cause = client.get(f"/api/causes/{cause['id']}").get_json()
    assert updated_cause["raised_amount"] == 100
    assert updated_cause["available_balance"] == 40

    # A second withdrawal beyond what's left (100 - 60 already reserved) is rejected.
    resp = client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 50, "phone_number": "254700000000"},
        headers=headers,
    )
    assert resp.status_code == 400


def test_admin_can_request_payout_for_any_cause(client, auth_headers, admin_headers, monkeypatch):
    monkeypatch.setattr(
        "server.routes.payout_routes.MpesaService.initiate_b2c_payment",
        lambda phone, amount, remarks: {"ConversationID": "AG_20260916_payout2"},
    )
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 100, admin_headers)

    resp = client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 20, "phone_number": "254700000000"},
        headers=admin_headers,
    )
    assert resp.status_code == 201


def test_list_cause_payouts_requires_ownership(client, auth_headers, admin_headers, make_user, monkeypatch):
    monkeypatch.setattr(
        "server.routes.payout_routes.MpesaService.initiate_b2c_payment",
        lambda phone, amount, remarks: {"ConversationID": "AG_20260916_payout3"},
    )
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 100, admin_headers)
    client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 20, "phone_number": "254700000000"},
        headers=headers,
    )

    other_headers, _ = make_user(email="other@example.com")
    resp = client.get(f"/api/causes/{cause['id']}/payouts", headers=other_headers)
    assert resp.status_code == 403

    resp = client.get(f"/api/causes/{cause['id']}/payouts", headers=headers)
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1

    resp = client.get(f"/api/causes/{cause['id']}/payouts", headers=admin_headers)
    assert resp.status_code == 200


def test_admin_payouts_listing_requires_admin(client, auth_headers):
    headers, _ = auth_headers
    resp = client.get("/api/admin/payouts", headers=headers)
    assert resp.status_code == 403


def test_admin_payouts_listing_is_paginated(client, auth_headers, admin_headers, monkeypatch):
    conversation_ids = iter(f"AG_20260916_bulk{i}" for i in range(20))
    monkeypatch.setattr(
        "server.routes.payout_routes.MpesaService.initiate_b2c_payment",
        lambda phone, amount, remarks: {"ConversationID": next(conversation_ids)},
    )
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 1000, admin_headers)

    for _ in range(15):
        client.post(
            "/api/causes/{}/payouts".format(cause["id"]),
            json={"amount": 1, "phone_number": "254700000000"},
            headers=headers,
        )

    resp = client.get("/api/admin/payouts?per_page=10", headers=admin_headers)
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["payouts"]) == 10
    assert body["total"] == 15
    assert body["payouts"][0]["cause"]["title"] == cause["title"]


def test_b2c_callback_resolves_pending_payout(client, admin_headers, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "server.routes.payout_routes.MpesaService.initiate_b2c_payment",
        lambda phone, amount, remarks: {"ConversationID": "AG_20260916_cb1"},
    )
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 100, admin_headers)
    client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 40, "phone_number": "254700000000"},
        headers=headers,
    )

    callback_body = {
        "Result": {
            "ResultCode": 0,
            "ResultDesc": "The service request is processed successfully.",
            "ConversationID": "AG_20260916_cb1",
        }
    }
    resp = client.post("/api/mpesa/b2c/callback", json=callback_body)
    assert resp.status_code == 200

    payouts = client.get(f"/api/causes/{cause['id']}/payouts", headers=headers).get_json()
    assert payouts[0]["status"] == "completed"
    assert payouts[0]["processed_at"] is not None


def test_b2c_callback_marks_payout_failed_and_frees_balance(client, admin_headers, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "server.routes.payout_routes.MpesaService.initiate_b2c_payment",
        lambda phone, amount, remarks: {"ConversationID": "AG_20260916_cb2"},
    )
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    fund_cause(client, cause["id"], 100, admin_headers)
    client.post(
        "/api/causes/{}/payouts".format(cause["id"]),
        json={"amount": 40, "phone_number": "254700000000"},
        headers=headers,
    )

    callback_body = {
        "Result": {
            "ResultCode": 1,
            "ResultDesc": "Insufficient funds in the organization's account.",
            "ConversationID": "AG_20260916_cb2",
        }
    }
    resp = client.post("/api/mpesa/b2c/callback", json=callback_body)
    assert resp.status_code == 200

    updated_cause = client.get(f"/api/causes/{cause['id']}").get_json()
    assert updated_cause["available_balance"] == 100

    payouts = client.get(f"/api/causes/{cause['id']}/payouts", headers=headers).get_json()
    assert payouts[0]["status"] == "failed"
    assert "Insufficient funds" in payouts[0]["failure_reason"]


def test_b2c_callback_rejects_wrong_token_when_secret_configured(client, monkeypatch):
    monkeypatch.setattr("server.routes.mpesa_routes.Config.B2C_CALLBACK_SECRET", "supersecret")
    resp = client.post("/api/mpesa/b2c/callback?token=wrong", json={})
    assert resp.status_code == 403
