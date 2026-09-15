import io

PNG_HEADER = b"\x89PNG\r\n\x1a\n"


def test_upload_requires_auth(client):
    resp = client.post("/api/upload", data={"file": (io.BytesIO(PNG_HEADER + b"rest"), "photo.png")})
    assert resp.status_code == 401


def test_upload_rejects_disallowed_extension(client, auth_headers):
    headers, _ = auth_headers
    resp = client.post(
        "/api/upload",
        data={"file": (io.BytesIO(b"whatever"), "notes.txt")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400


def test_upload_rejects_content_that_does_not_match_extension(client, auth_headers):
    """A non-image file renamed with an image extension must be rejected."""
    headers, _ = auth_headers
    resp = client.post(
        "/api/upload",
        data={"file": (io.BytesIO(b"<html><script>alert(1)</script></html>"), "photo.png")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 400


def test_upload_accepts_valid_image_and_serves_it_with_nosniff(client, auth_headers):
    headers, _ = auth_headers
    resp = client.post(
        "/api/upload",
        data={"file": (io.BytesIO(PNG_HEADER + b"restofimage"), "photo.png")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201
    image_url = resp.get_json()["image_url"]
    filename = image_url.rsplit("/", 1)[1]

    fetched = client.get(f"/api/uploads/{filename}")
    assert fetched.status_code == 200
    assert fetched.headers.get("X-Content-Type-Options") == "nosniff"


def test_upload_rejects_file_over_size_limit(client, auth_headers):
    headers, _ = auth_headers
    oversized = PNG_HEADER + (b"0" * (6 * 1024 * 1024))
    resp = client.post(
        "/api/upload",
        data={"file": (io.BytesIO(oversized), "big.png")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 413
    assert "error" in resp.get_json()
