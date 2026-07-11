def test_list_users_requires_admin(client, auth_headers):
    headers, _ = auth_headers
    resp = client.get("/api/admin/users", headers=headers)
    assert resp.status_code == 403


def test_admin_can_list_users(client, auth_headers, admin_headers):
    headers, user = auth_headers
    resp = client.get("/api/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    emails = [u["email"] for u in body["users"]]
    assert user["email"] in emails
    assert "admin@example.com" in emails


def test_admin_can_search_users(client, auth_headers, admin_headers):
    headers, user = auth_headers
    resp = client.get(f"/api/admin/users?search={user['name'][:4]}", headers=admin_headers)
    body = resp.get_json()
    assert any(u["id"] == user["id"] for u in body["users"])
    assert all("admin" not in u["email"].lower() for u in body["users"] if u["id"] != user["id"])


def test_non_admin_cannot_change_roles(client, auth_headers, make_user):
    headers, _ = auth_headers
    other_headers, other_user = make_user(email="other@example.com")

    resp = client.patch(f"/api/admin/users/{other_user['id']}/role", json={"role": "admin"}, headers=headers)
    assert resp.status_code == 403


def test_admin_can_promote_and_demote_another_user(client, auth_headers, admin_headers):
    headers, user = auth_headers

    resp = client.patch(f"/api/admin/users/{user['id']}/role", json={"role": "admin"}, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.get_json()["role"] == "admin"

    resp = client.patch(f"/api/admin/users/{user['id']}/role", json={"role": "user"}, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.get_json()["role"] == "user"


def test_rejects_invalid_role(client, auth_headers, admin_headers):
    headers, user = auth_headers
    resp = client.patch(f"/api/admin/users/{user['id']}/role", json={"role": "superuser"}, headers=admin_headers)
    assert resp.status_code == 400


def test_admin_cannot_demote_self(client, auth_headers, admin_headers, app):
    from server.models import User

    with app.app_context():
        admin_id = User.query.filter_by(email="admin@example.com").first().id

    resp = client.patch(f"/api/admin/users/{admin_id}/role", json={"role": "user"}, headers=admin_headers)
    assert resp.status_code == 400
    assert "own admin role" in resp.get_json()["error"]

    # The block is unconditional — it holds even with a second admin around,
    # since self-demotion alone is what the guard exists to prevent.
    headers, user = auth_headers
    client.patch(f"/api/admin/users/{user['id']}/role", json={"role": "admin"}, headers=admin_headers)
    resp = client.patch(f"/api/admin/users/{admin_id}/role", json={"role": "user"}, headers=admin_headers)
    assert resp.status_code == 400
