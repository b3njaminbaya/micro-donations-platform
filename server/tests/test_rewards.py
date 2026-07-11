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


def test_only_admin_can_create_reward(client, auth_headers, admin_headers):
    headers, _ = auth_headers
    resp = client.post(
        "/api/rewards",
        json={"title": "Tote Bag", "description": "A branded tote bag.", "points_required": 100},
        headers=headers,
    )
    assert resp.status_code == 403

    resp = client.post(
        "/api/rewards",
        json={"title": "Tote Bag", "description": "A branded tote bag.", "points_required": 100},
        headers=admin_headers,
    )
    assert resp.status_code == 201


def test_list_rewards_is_public(client, admin_headers):
    client.post(
        "/api/rewards",
        json={"title": "Sticker Pack", "description": "Stickers.", "points_required": 10},
        headers=admin_headers,
    )
    resp = client.get("/api/rewards")
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1


def test_redeem_fails_without_enough_points(client, auth_headers, admin_headers):
    headers, _ = auth_headers
    reward = client.post(
        "/api/rewards",
        json={"title": "T-Shirt", "description": "A shirt.", "points_required": 1000},
        headers=admin_headers,
    ).get_json()

    resp = client.post(f"/api/rewards/{reward['id']}/redeem", json={}, headers=headers)
    assert resp.status_code == 400


def test_points_accrue_from_completed_donations_and_redemption_spends_them(
    client, auth_headers, make_user, admin_headers
):
    headers, _ = auth_headers
    cause = create_cause(client, headers)

    donor_headers, _ = make_user(email="donor@example.com")
    # 10 points per dollar donated (see models.POINTS_PER_DOLLAR).
    client.post("/api/donations", json={"cause_id": cause["id"], "amount": 50}, headers=donor_headers)

    reward = client.post(
        "/api/rewards",
        json={"title": "Certificate", "description": "A thank-you certificate.", "points_required": 200},
        headers=admin_headers,
    ).get_json()

    mine = client.get("/api/rewards/mine", headers=donor_headers).get_json()
    assert mine["points_earned"] == 500
    assert mine["points_balance"] == 500

    resp = client.post(f"/api/rewards/{reward['id']}/redeem", json={}, headers=donor_headers)
    assert resp.status_code == 201

    mine_after = client.get("/api/rewards/mine", headers=donor_headers).get_json()
    assert mine_after["points_redeemed"] == 200
    assert mine_after["points_balance"] == 300
    assert len(mine_after["redemptions"]) == 1
    assert mine_after["redemptions"][0]["reward"]["title"] == "Certificate"


def test_only_admin_can_delete_reward(client, auth_headers, admin_headers):
    headers, _ = auth_headers
    reward = client.post(
        "/api/rewards",
        json={"title": "Mug", "description": "A mug.", "points_required": 50},
        headers=admin_headers,
    ).get_json()

    resp = client.delete(f"/api/rewards/{reward['id']}", headers=headers)
    assert resp.status_code == 403

    resp = client.delete(f"/api/rewards/{reward['id']}", headers=admin_headers)
    assert resp.status_code == 200
