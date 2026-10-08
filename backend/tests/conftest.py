from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.patients.models import Patient

PASSWORD = "Str0ng-Pass!word"


def dob_for_age(years: float) -> date:
    return date.today() - timedelta(days=int(years * 365.25) + 1)


@pytest.fixture
def doctor(db) -> User:
    return User.objects.create_user("dr_one", "one@example.com", PASSWORD, specialty="psychologist")


@pytest.fixture
def other_doctor(db) -> User:
    return User.objects.create_user("dr_two", "two@example.com", PASSWORD)


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.fixture
def auth_client(doctor) -> APIClient:
    c = APIClient()
    c.force_authenticate(doctor)
    return c


@pytest.fixture
def other_client(other_doctor) -> APIClient:
    c = APIClient()
    c.force_authenticate(other_doctor)
    return c


@pytest.fixture
def make_patient(db):
    def _make(doctor, years=10, sex="M", name="Test Child") -> Patient:
        return Patient.objects.create(name=name, sex=sex, date_of_birth=dob_for_age(years), created_by=doctor)

    return _make


@pytest.fixture
def child(make_patient, doctor) -> Patient:
    return make_patient(doctor, years=10)


SCHOOL_AGE_SCORES = dict(
    fiq=98, viq=95, piq=102, ados_total=12, ados_comm=4, ados_social=8,
    ados_stereo_behav=3, srs_raw_total=105, aq_total=29,
)
