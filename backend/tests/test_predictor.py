import json

import pytest
from django.conf import settings

from apps.assessments.ml.predictor import ModelUnavailable, Predictor, classify, get_predictor
from apps.assessments.ml.schema import MISSING_VALUE, MODEL_FEATURE_ORDER


def features(**over):
    """A full 11-column vector: everything 'not collected' unless overridden."""
    base = {name: MISSING_VALUE for name in MODEL_FEATURE_ORDER}
    base.update({"AGE_AT_SCAN": 10, "SEX": 1})
    base.update(over)
    return base


HIGH = dict(FIQ=100, VIQ=100, PIQ=100, ADOS_TOTAL=14, ADOS_COMM=4, ADOS_SOCIAL=9,
            ADOS_STEREO_BEHAV=3, SRS_RAW_TOTAL=110, AQ_TOTAL=30)
LOW = dict(FIQ=110, VIQ=110, PIQ=110, ADOS_TOTAL=0, ADOS_COMM=0, ADOS_SOCIAL=0,
           ADOS_STEREO_BEHAV=0, SRS_RAW_TOTAL=40, AQ_TOTAL=10)


class TestPredictor:
    def test_contract_matches_pickled_scaler(self):
        assert list(get_predictor()._scaler.feature_names_in_) == MODEL_FEATURE_ORDER

    def test_probabilities_are_valid(self):
        r = get_predictor().predict(features(**HIGH))
        assert r.probability_autism + r.probability_control == pytest.approx(1.0)
        assert 0 <= r.probability_autism <= 1

    def test_label_direction_is_correct(self):
        """Regression test for the original UI bug that showed class 1 as 'Not Autistic'.
        In the dataset DX_GROUP 1 = autism, so high symptom scores must give code 1."""
        p = get_predictor()
        assert p.predict(features(**HIGH)).code == 1
        assert p.predict(features(**LOW)).code == 2
        assert p.predict(features(**HIGH)).probability_autism > p.predict(features(**LOW)).probability_autism

    def test_tampered_artifact_is_rejected(self, tmp_path):
        for name in ("scaler.pkl", "voting_classifier_model.pkl", "MANIFEST.json"):
            (tmp_path / name).write_bytes((settings.ML_ARTIFACT_DIR / name).read_bytes())
        (tmp_path / "scaler.pkl").write_bytes(b"not the real file")
        with pytest.raises(ModelUnavailable, match="Integrity"):
            Predictor(tmp_path)

    def test_missing_manifest_is_reported(self, tmp_path):
        with pytest.raises(ModelUnavailable):
            Predictor(tmp_path)

    def test_manifest_lists_both_files(self):
        manifest = json.loads((settings.ML_ARTIFACT_DIR / "MANIFEST.json").read_text())
        assert set(manifest["sha256"]) == {"scaler.pkl", "voting_classifier_model.pkl"}


class TestClassify:
    @pytest.mark.parametrize(
        "p,expected",
        [(0.95, "likely_asd"), (0.60, "likely_asd"), (0.50, "inconclusive"), (0.41, "inconclusive"), (0.40, "unlikely_asd"), (0.05, "unlikely_asd")],
    )
    def test_thresholds(self, p, expected):
        assert classify(p, (0.40, 0.60)) == expected
