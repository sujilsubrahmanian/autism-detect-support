import pytest

from tests.conftest import dob_for_age

URL = "/api/v1/patients/"


def body(**over):
    return {"name": "Ria Thomas", "date_of_birth": str(dob_for_age(8)), "sex": "F", **over}


@pytest.mark.django_db
class TestPatients:
    def test_server_generates_public_id(self, auth_client):
        r = auth_client.post(URL, body(), format="json")
        assert r.status_code == 201
        assert r.data["public_id"].startswith("ASD-") and len(r.data["public_id"]) == 10

    def test_client_cannot_choose_public_id(self, auth_client):
        r = auth_client.post(URL, body(public_id="ASD-999999"), format="json")
        assert r.data["public_id"] != "ASD-999999"

    def test_ids_are_unique_across_many_creates(self, auth_client):
        ids = {auth_client.post(URL, body(name=f"Kid {i}"), format="json").data["public_id"] for i in range(15)}
        assert len(ids) == 15

    def test_future_dob_rejected(self, auth_client):
        r = auth_client.post(URL, body(date_of_birth="2999-01-01"), format="json")
        assert r.status_code == 400 and "date_of_birth" in r.data

    def test_invalid_sex_rejected(self, auth_client):
        assert auth_client.post(URL, body(sex="X"), format="json").status_code == 400

    def test_list_only_shows_own_patients(self, auth_client, other_client):
        auth_client.post(URL, body(name="Mine"), format="json")
        other_client.post(URL, body(name="Theirs"), format="json")
        names = [p["name"] for p in auth_client.get(URL).data["results"]]
        assert names == ["Mine"]

    def test_other_doctors_patient_is_404_not_403(self, auth_client, other_client):
        pid = other_client.post(URL, body(), format="json").data["public_id"]
        assert auth_client.get(f"{URL}{pid}/").status_code == 404
        assert auth_client.patch(f"{URL}{pid}/", {"name": "Hacked"}, format="json").status_code == 404

    def test_search_by_name_and_id(self, auth_client):
        auth_client.post(URL, body(name="Alpha Child"), format="json")
        pid = auth_client.post(URL, body(name="Beta Child"), format="json").data["public_id"]
        assert [p["name"] for p in auth_client.get(URL, {"q": "alpha"}).data["results"]] == ["Alpha Child"]
        assert [p["name"] for p in auth_client.get(URL, {"q": pid}).data["results"]] == ["Beta Child"]

    def test_delete_is_not_allowed(self, auth_client):
        pid = auth_client.post(URL, body(), format="json").data["public_id"]
        assert auth_client.delete(f"{URL}{pid}/").status_code == 405

    def test_list_query_count_is_constant(self, auth_client, django_assert_max_num_queries):
        for i in range(10):
            auth_client.post(URL, body(name=f"K{i}"), format="json")
        with django_assert_max_num_queries(4):  # count + page query (+ session/auth), never N+1
            auth_client.get(URL)


@pytest.mark.django_db
class TestHistory:
    def test_put_then_get_roundtrip_and_idempotent(self, auth_client, child):
        url = f"{URL}{child.public_id}/history/"
        data = {
            "pregnancy": {"blood_sugar_mg_dl": 95, "previous_abortions": 1, "bmi": 24.5, "systolic_bp": 118, "diastolic_bp": 76},
            "milestones": {"birth_weight_kg": 3.1, "premature_birth": False, "lifting_head_month": 3, "sitting_up_month": 7},
        }
        assert auth_client.put(url, data, format="json").status_code == 200
        assert auth_client.put(url, data, format="json").status_code == 200  # idempotent
        r = auth_client.get(url)
        assert r.data["pregnancy"]["bmi"] == 24.5
        assert r.data["milestones"]["sitting_up_month"] == 7
        from apps.patients.models import PregnancyHistory
        assert PregnancyHistory.objects.filter(patient=child).count() == 1

    def test_empty_history_returns_nulls(self, auth_client, child):
        r = auth_client.get(f"{URL}{child.public_id}/history/")
        assert r.data == {"pregnancy": None, "milestones": None}

    def test_validation_errors(self, auth_client, child):
        r = auth_client.put(f"{URL}{child.public_id}/history/", {"milestones": {"sitting_up_month": 500}}, format="json")
        assert r.status_code == 400

    def test_cannot_write_other_doctors_history(self, other_client, child):
        assert other_client.put(f"{URL}{child.public_id}/history/", {"pregnancy": {"bmi": 22}}, format="json").status_code == 404
