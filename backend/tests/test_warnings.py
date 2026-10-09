from apps.assessments.ml.schema import age_group_for
from apps.assessments.ml.warnings import build_warnings


class TestWarnings:
    def test_toddler_gets_extrapolation_warning(self):
        w = build_warnings(2.0, age_group_for(2.0), {"ados_total": 10})
        assert any(x["code"] == "AGE_BELOW_TRAINING_RANGE" and x["severity"] == "high" for x in w)

    def test_school_age_in_range_has_no_warnings(self):
        scores = {"fiq": 100, "viq": 100, "piq": 100, "ados_total": 10, "ados_comm": 3, "ados_social": 7,
                  "ados_stereo_behav": 2, "srs_raw_total": 90, "aq_total": 20}
        assert build_warnings(9.0, age_group_for(9.0), scores) == []

    def test_out_of_training_range_score_is_flagged(self):
        scores = {"fiq": 175, "viq": 100, "piq": 100, "ados_total": 10, "ados_comm": 3, "ados_social": 7,
                  "ados_stereo_behav": 2, "srs_raw_total": 90, "aq_total": 20}
        w = build_warnings(9.0, age_group_for(9.0), scores)
        assert [x["field"] for x in w] == ["fiq"]
