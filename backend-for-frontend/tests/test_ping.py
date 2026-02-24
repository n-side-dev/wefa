def test_ping_endpoint(client):
    # Simple health check to verify the app is alive.
    res = client.get("/ping")
    assert res.status_code == 200
    assert res.get_json() == {"message": "pong"}
