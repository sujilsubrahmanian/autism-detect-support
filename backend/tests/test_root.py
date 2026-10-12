import pytest


@pytest.mark.django_db
class TestRoot:
    def test_root_redirects_to_api_docs_instead_of_404(self, client):
        r = client.get("/")
        assert r.status_code == 302 and r["Location"] == "/api/docs/"

    def test_favicon_request_is_quietly_answered(self, client):
        assert client.get("/favicon.ico").status_code == 204
