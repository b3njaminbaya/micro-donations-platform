def test_register_requires_all_fields(client):
    resp = client.post("/api/register", json={"name": "No Email"})
    assert resp.status_code == 400


def test_register_and_login_roundtrip(client):
    resp = client.post("/api/register", json={
        "name": "Ada Lovelace", "email": "ada@example.com", "password": "password123",
    })
    assert resp.status_code == 200
    assert resp.get_json()["success"] is True

    resp = client.post("/api/login", json={"email": "ada@example.com", "password": "password123"})
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["access_token"]
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["role"] == "user"


def test_register_rejects_duplicate_email(client):
    client.post("/api/register", json={"name": "A", "email": "dup@example.com", "password": "password123"})
    resp = client.post("/api/register", json={"name": "B", "email": "dup@example.com", "password": "password123"})
    assert resp.status_code == 400


def test_login_rejects_wrong_password(client):
    client.post("/api/register", json={"name": "A", "email": "a@example.com", "password": "password123"})
    resp = client.post("/api/login", json={"email": "a@example.com", "password": "wrong"})
    assert resp.status_code == 401


def test_register_rejects_invalid_email_format(client):
    resp = client.post("/api/register", json={
        "name": "Bad Email", "email": "not-an-email", "password": "password123",
    })
    assert resp.status_code == 400


def test_register_rejects_short_password(client):
    resp = client.post("/api/register", json={
        "name": "Short Pass", "email": "shortpass@example.com", "password": "abc",
    })
    assert resp.status_code == 400


def test_register_rejects_short_name(client):
    resp = client.post("/api/register", json={
        "name": "A", "email": "shortname@example.com", "password": "password123",
    })
    assert resp.status_code == 400


def test_login_is_case_insensitive_on_email(client):
    client.post("/api/register", json={
        "name": "Case Test", "email": "CaseTest@Example.com", "password": "password123",
    })
    resp = client.post("/api/login", json={"email": "casetest@example.com", "password": "password123"})
    assert resp.status_code == 200


def test_register_ignores_client_supplied_role(client):
    """A client should never be able to self-assign admin at signup."""
    resp = client.post("/api/register", json={
        "name": "Sneaky", "email": "sneaky@example.com", "password": "password123", "role": "admin",
    })
    assert resp.status_code == 200

    login = client.post("/api/login", json={"email": "sneaky@example.com", "password": "password123"})
    assert login.get_json()["user"]["role"] == "user"
