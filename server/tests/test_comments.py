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


def test_comment_requires_auth(client, auth_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    resp = client.post(f"/api/causes/{cause['id']}/comments", json={"content": "hi"})
    assert resp.status_code == 401


def test_comment_requires_content(client, auth_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    resp = client.post(f"/api/causes/{cause['id']}/comments", json={"content": "  "}, headers=headers)
    assert resp.status_code == 400


def test_create_and_list_comments(client, auth_headers):
    headers, user = auth_headers
    cause = create_cause(client, headers)

    resp = client.post(f"/api/causes/{cause['id']}/comments", json={"content": "Great cause!"}, headers=headers)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["author"]["id"] == user["id"]

    listed = client.get(f"/api/causes/{cause['id']}/comments").get_json()
    assert len(listed) == 1
    assert listed[0]["content"] == "Great cause!"


def test_non_owner_cannot_delete_comment(client, auth_headers, make_user):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    comment = client.post(
        f"/api/causes/{cause['id']}/comments", json={"content": "hi"}, headers=headers
    ).get_json()

    other_headers, _ = make_user(email="other@example.com")
    resp = client.delete(f"/api/comments/{comment['id']}", headers=other_headers)
    assert resp.status_code == 403


def test_owner_and_admin_can_delete_comment(client, auth_headers, admin_headers):
    headers, _ = auth_headers
    cause = create_cause(client, headers)
    comment = client.post(
        f"/api/causes/{cause['id']}/comments", json={"content": "hi"}, headers=headers
    ).get_json()

    resp = client.delete(f"/api/comments/{comment['id']}", headers=headers)
    assert resp.status_code == 200

    comment2 = client.post(
        f"/api/causes/{cause['id']}/comments", json={"content": "hi again"}, headers=headers
    ).get_json()
    resp = client.delete(f"/api/comments/{comment2['id']}", headers=admin_headers)
    assert resp.status_code == 200
