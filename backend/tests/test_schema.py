import pytest

from apps.assessments.ml.schema import AGE_GROUPS, FIELDS, age_group_for


class TestAgeGroups:
    @pytest.mark.parametrize(
        "age,expected",
        [(0.0, "0-3"), (2.99, "0-3"), (3.0, "3-5"), (5.9, "3-5"), (6.0, "6-12"), (12.9, "6-12"), (13.0, "13+"), (60, "13+")],
    )
    def test_boundaries_are_half_open(self, age, expected):
        assert age_group_for(age).key == expected

    def test_negative_age_rejected(self):
        with pytest.raises(ValueError):
            age_group_for(-1)

    def test_every_group_field_is_defined_and_has_training_range(self):
        for group in AGE_GROUPS:
            for key in group.fields:
                assert key in FIELDS
                assert key in group.training_ranges
