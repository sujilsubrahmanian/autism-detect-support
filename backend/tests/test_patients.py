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
