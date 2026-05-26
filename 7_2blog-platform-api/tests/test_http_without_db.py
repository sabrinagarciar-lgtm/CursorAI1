def test_health_via_web_client(web_client):
    r = web_client.get("/health")
    assert r.status_code == 200
    assert r.get_json().get("status") == "ok"


def test_unknown_route_returns_problem_json(web_client):
    r = web_client.get("/this-route-does-not-exist-xyz")
    assert r.status_code == 404
    body = r.get_json()
    assert body.get("code") == 404
