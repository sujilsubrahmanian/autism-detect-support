import pytest

from apps.assessments.models import Assessment, Prediction
from tests.conftest import SCHOOL_AGE_SCORES


def url(patient):
    return f"/api/v1/patients/{patient.public_id}/assessments/"


@pytest.mark.django_db
class TestCreateAssessment:
    def test_happy_path_returns_prediction_and_persists_both_rows(self, auth_client, child):
        r = auth_client.post(url(child), SCHOOL_AGE_SCORES | {"iq_test_type": "WISC"}, format="json")
        assert r.status_code == 201, r.data
        pred = r.data["prediction"]
        assert pred["outcome"] == "likely_asd" and pred["predicted_code"] == 1
        assert pred["probability_autism"] + pred["probability_control"] == pytest.approx(1)
        assert pred["model_version"].startswith("voting-rf-gb@")
        assert r.data["age_group"] == "6-12"
        assert Assessment.objects.count() == 1 and Prediction.objects.count() == 1

    def test_stored_feature_vector_is_reproducible_and_uses_missing_code(self, auth_client, make_patient, doctor):
        toddler = make_patient(doctor, years=2)
        scores = dict(ados_total=10, ados_comm=3, ados_social=7, ados_stereo_behav=2, srs_raw_total=90)
        r = auth_client.post(url(toddler), scores, format="json")
        assert r.status_code == 201, r.data
        feats = r.data["prediction"]["features"]
        assert feats["FIQ"] == -9999 and feats["AQ_TOTAL"] == -9999 and feats["ADOS_TOTAL"] == 10

    def test_toddler_prediction_carries_high_severity_warning(self, auth_client, make_patient, doctor):
        toddler = make_patient(doctor, years=2)
        scores = dict(ados_total=10, ados_comm=3, ados_social=7, ados_stereo_behav=2, srs_raw_total=90)
        r = auth_client.post(url(toddler), scores, format="json")
        assert "AGE_BELOW_TRAINING_RANGE" in [w["code"] for w in r.data["prediction"]["warnings"]]

    def test_missing_required_field_rejected(self, auth_client, child):
        bad = {k: v for k, v in SCHOOL_AGE_SCORES.items() if k != "ados_total"}
        r = auth_client.post(url(child), bad, format="json")
        assert r.status_code == 400 and "ados_total" in r.data
        assert Assessment.objects.count() == 0

    def test_field_not_applicable_to_age_group_rejected(self, auth_client, make_patient, doctor):
        toddler = make_patient(doctor, years=2)
        r = auth_client.post(url(toddler), dict(ados_total=10, ados_comm=3, ados_social=7, ados_stereo_behav=2,
                                                srs_raw_total=90, fiq=100), format="json")
        assert r.status_code == 400 and "fiq" in r.data

    @pytest.mark.parametrize("field,value", [("fiq", 5), ("fiq", 400), ("ados_total", -1), ("aq_total", 99), ("srs_raw_total", 500)])
    def test_out_of_bounds_values_rejected(self, auth_client, child, field, value):
        r = auth_client.post(url(child), SCHOOL_AGE_SCORES | {field: value}, format="json")
        assert r.status_code == 400 and field in r.data

    def test_non_numeric_value_rejected(self, auth_client, child):
        assert auth_client.post(url(child), SCHOOL_AGE_SCORES | {"fiq": "high"}, format="json").status_code == 400

    def test_future_assessment_date_rejected(self, auth_client, child):
        r = auth_client.post(url(child), SCHOOL_AGE_SCORES | {"assessed_on": "2999-01-01"}, format="json")
        assert r.status_code == 400

    def test_cannot_assess_other_doctors_patient(self, other_client, child):
        assert other_client.post(url(child), SCHOOL_AGE_SCORES, format="json").status_code == 404

    def test_anonymous_rejected(self, client, child):
        assert client.post(url(child), SCHOOL_AGE_SCORES, format="json").status_code == 401

    def test_model_failure_returns_503_and_saves_nothing(self, auth_client, child, monkeypatch):
        from apps.assessments import services
        from apps.assessments.ml.predictor import ModelUnavailable

        def boom():
            raise ModelUnavailable("down")

        monkeypatch.setattr(services, "get_predictor", boom)
        r = auth_client.post(url(child), SCHOOL_AGE_SCORES, format="json")
        assert r.status_code == 503
        assert Assessment.objects.count() == 0  # transaction rolled back / never started


@pytest.mark.django_db
class TestReadAssessments:
    def test_history_lists_newest_first_with_predictions(self, auth_client, child):
        auth_client.post(url(child), SCHOOL_AGE_SCORES, format="json")
        auth_client.post(url(child), SCHOOL_AGE_SCORES | {"ados_total": 1, "ados_comm": 0, "ados_social": 1,
                         "ados_stereo_behav": 0, "srs_raw_total": 40, "aq_total": 10}, format="json")
        r = auth_client.get(url(child))
        assert r.status_code == 200 and r.data["count"] == 2
        assert all("prediction" in a for a in r.data["results"])
        assert r.data["results"][0]["scores"]["ados_total"] == 1

    def test_assessments_are_immutable_over_the_api(self, auth_client, child):
        aid = auth_client.post(url(child), SCHOOL_AGE_SCORES, format="json").data["id"]
        assert auth_client.delete(f"/api/v1/assessments/{aid}/").status_code == 405
        assert auth_client.patch(f"/api/v1/assessments/{aid}/", {"fiq": 50}, format="json").status_code == 405

    def test_detail_isolated_between_doctors(self, auth_client, other_client, child):
        aid = auth_client.post(url(child), SCHOOL_AGE_SCORES, format="json").data["id"]
        assert auth_client.get(f"/api/v1/assessments/{aid}/").status_code == 200
        assert other_client.get(f"/api/v1/assessments/{aid}/").status_code == 404


@pytest.mark.django_db
class TestSchemaAndHealth:
    def test_schema_describes_four_age_groups_with_correct_fields(self, auth_client):
        r = auth_client.get("/api/v1/ml/schema/")
        groups = {g["key"]: [f["key"] for f in g["fields"]] for g in r.data["age_groups"]}
        assert list(groups) == ["0-3", "3-5", "6-12", "13+"]
        assert groups["0-3"] == ["ados_total", "ados_comm", "ados_social", "ados_stereo_behav", "srs_raw_total"]
        assert "aq_total" in groups["13+"] and "fiq" not in groups["0-3"]
        assert "DX_GROUP" not in str(r.data)  # the target must never be a form input

    def test_health_is_public_and_reports_model(self, client):
        r = client.get("/api/v1/health/")
        assert r.status_code == 200
        assert r.data["checks"] == {"database": "ok", "model": "ok"}
        assert r.data["model_version"].startswith("voting-rf-gb@")

    def test_openapi_schema_generates(self, client):
        r = client.get("/api/schema/")
        assert r.status_code == 200
