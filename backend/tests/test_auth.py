import pytest
from django.test import override_settings

from tests.conftest import PASSWORD

REGISTER = "/api/v1/auth/register/"
LOGIN = "/api/v1/auth/login/"


def payload(**over):
    base = {"username": "dr_new", "email": "new@example.com", "password": PASSWORD,
            "first_name": "New", "last_name": "Doctor", "specialty": "pediatrician"}
    return {**base, **over}


@pytest.mark.django_db
class TestAuth:
    def test_register_returns_profile_without_password(self, client):
        r = client.post(REGISTER, payload(), format="json")
        assert r.status_code == 201
        assert r.data["username"] == "dr_new" and "password" not in r.data

    def test_password_is_hashed_in_db(self, client):
        from apps.accounts.models import User
        client.post(REGISTER, payload(), format="json")
        assert User.objects.get(username="dr_new").password != PASSWORD

    def test_weak_password_rejected(self, client):
        r = client.post(REGISTER, payload(password="12345678"), format="json")
        assert r.status_code == 400 and "password" in str(r.data).lower()

    def test_duplicate_email_rejected_case_insensitively(self, client, doctor):
        r = client.post(REGISTER, payload(email="ONE@example.com"), format="json")
        assert r.status_code == 400 and "email" in r.data

    @override_settings(ALLOW_DOCTOR_SELF_REGISTRATION=False)
    def test_self_registration_can_be_disabled(self, client):
        assert client.post(REGISTER, payload(), format="json").status_code == 403

    def test_login_returns_tokens_and_user(self, client, doctor):
        r = client.post(LOGIN, {"username": "dr_one", "password": PASSWORD}, format="json")
        assert r.status_code == 200
        assert {"access", "refresh", "user"} <= set(r.data)
        assert r.data["user"]["username"] == "dr_one"

    def test_login_wrong_password(self, client, doctor):
        assert client.post(LOGIN, {"username": "dr_one", "password": "nope"}, format="json").status_code == 401

    def test_me_requires_token_then_works(self, client, doctor):
        assert client.get("/api/v1/auth/me/").status_code == 401
        token = client.post(LOGIN, {"username": "dr_one", "password": PASSWORD}, format="json").data["access"]
        r = client.get("/api/v1/auth/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        assert r.status_code == 200 and r.data["username"] == "dr_one"

    def test_refresh_issues_new_access_token(self, client, doctor):
        refresh = client.post(LOGIN, {"username": "dr_one", "password": PASSWORD}, format="json").data["refresh"]
        r = client.post("/api/v1/auth/refresh/", {"refresh": refresh}, format="json")
        assert r.status_code == 200 and "access" in r.data

    def test_protected_endpoints_reject_anonymous(self, client):
        for url in ["/api/v1/auth/me/"]:
            assert client.get(url).status_code == 401, url
