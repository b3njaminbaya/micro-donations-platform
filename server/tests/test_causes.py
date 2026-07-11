def create_cause(client, headers, **overrides):
    payload = {
        "title": "Clean Water for Villages",
        "description": "Providing safe drinking water.",
        "goal_amount": 1000,
        "category": "Health",
        "country": "Kenya",
    }
    payload.update(overrides)
    return client.post("/api/causes", json=payload, headers=headers)


def test_create_cause_requires_auth(client):
    resp = client.post("/api/causes", json={"title": "x"})
    assert resp.status_code == 401


def test_create_cause_requires_fields(client, auth_headers):
    headers, _ = auth_headers
    resp = client.post("/api/causes", json={"title": "Missing stuff"}, headers=headers)
    assert resp.status_code == 400


def test_create_cause_rejects_non_positive_goal(client, auth_headers):
    headers, _ = auth_headers
    resp = create_cause(client, headers, goal_amount=0)
    assert resp.status_code == 400


def test_create_and_fetch_cause(client, auth_headers):
    headers, user = auth_headers
    resp = create_cause(client, headers)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["user_id"] == user["id"]
    assert body["raised_amount"] == 0
    assert body["creator_name"] == user["name"]

    fetched = client.get(f"/api/causes/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.get_json()["title"] == "Clean Water for Villages"


def test_list_causes_includes_creator_name_for_moderation(client, auth_headers):
    headers, user = auth_headers
    create_cause(client, headers)

    resp = client.get("/api/causes")
    causes = resp.get_json()["causes"]
    assert causes[0]["creator_name"] == user["name"]


def test_list_causes_is_paginated(client, auth_headers):
    headers, _ = auth_headers
    for i in range(15):
        create_cause(client, headers, title=f"Cause {i}")

    resp = client.get("/api/causes?per_page=10")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["causes"]) == 10
    assert body["total"] == 15
    assert body["pages"] == 2

    page2 = client.get("/api/causes?per_page=10&page=2")
    assert len(page2.get_json()["causes"]) == 5


def test_list_causes_filters_by_category_and_search(client, auth_headers):
    headers, _ = auth_headers
    create_cause(client, headers, title="Save the Forest", category="Environment")
    create_cause(client, headers, title="School Books", category="Education")

    resp = client.get("/api/causes?category=Education")
    titles = [c["title"] for c in resp.get_json()["causes"]]
    assert titles == ["School Books"]

    resp = client.get("/api/causes?search=forest")
    titles = [c["title"] for c in resp.get_json()["causes"]]
    assert titles == ["Save the Forest"]


def test_owner_can_update_cause(client, auth_headers):
    headers, _ = auth_headers
    created = create_cause(client, headers).get_json()

    resp = client.patch(f"/api/causes/{created['id']}", json={"title": "Updated Title"}, headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["title"] == "Updated Title"


def test_non_owner_cannot_update_or_delete_cause(client, auth_headers, make_user):
    headers, _ = auth_headers
    created = create_cause(client, headers).get_json()

    other_headers, _ = make_user(email="other@example.com")
    resp = client.patch(f"/api/causes/{created['id']}", json={"title": "Hijacked"}, headers=other_headers)
    assert resp.status_code == 403

    resp = client.delete(f"/api/causes/{created['id']}", headers=other_headers)
    assert resp.status_code == 403


def test_admin_can_update_and_delete_any_cause(client, auth_headers, admin_headers):
    headers, _ = auth_headers
    created = create_cause(client, headers).get_json()

    resp = client.patch(f"/api/causes/{created['id']}", json={"title": "Moderated"}, headers=admin_headers)
    assert resp.status_code == 200

    resp = client.delete(f"/api/causes/{created['id']}", headers=admin_headers)
    assert resp.status_code == 200


def test_owner_can_delete_own_cause(client, auth_headers):
    headers, _ = auth_headers
    created = create_cause(client, headers).get_json()

    resp = client.delete(f"/api/causes/{created['id']}", headers=headers)
    assert resp.status_code == 200
    assert client.get(f"/api/causes/{created['id']}").status_code == 404
