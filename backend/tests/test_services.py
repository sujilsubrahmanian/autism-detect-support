from apps.assessments.ml.schema import MISSING_VALUE, MODEL_FEATURE_ORDER
from apps.assessments.services import build_feature_vector


class TestFeatureVector:
    def test_order_independent_dict_covers_all_model_columns(self):
        vec = build_feature_vector(age_years=9.5, sex="F", scores={"ados_total": 10})
        assert set(vec) == set(MODEL_FEATURE_ORDER)
        assert vec["SEX"] == 2 and vec["AGE_AT_SCAN"] == 9.5

    def test_tests_not_administered_are_encoded_as_training_missing_code(self):
        vec = build_feature_vector(age_years=2, sex="M", scores={"ados_total": 10})
        assert vec["FIQ"] == MISSING_VALUE and vec["AQ_TOTAL"] == MISSING_VALUE
        assert vec["ADOS_TOTAL"] == 10
