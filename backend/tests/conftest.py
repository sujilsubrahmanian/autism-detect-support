import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User

PASSWORD = "Str0ng-Pass!word"


@pytest.fixture
def doctor(db) -> User:
    return User.objects.create_user("dr_one", "one@example.com", PASSWORD, specialty="psychologist")


@pytest.fixture
def client() -> APIClient:
    return APIClient()
