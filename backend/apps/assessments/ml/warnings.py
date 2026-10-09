"""Clinical-safety warnings attached to every prediction.

A model should say when it is being asked something it was not trained for.
"""
from __future__ import annotations

from .schema import FIELDS, MIN_TRAINING_AGE, AgeGroup


def build_warnings(age_years: float, group: AgeGroup, scores: dict[str, int | None]) -> list[dict]:
    warnings: list[dict] = []

    if age_years < MIN_TRAINING_AGE:
        warnings.append(
            {
                "code": "AGE_BELOW_TRAINING_RANGE",
                "severity": "high",
                "message": (
                    f"Age {age_years:.1f} is below the youngest participants in the training data "
                    f"(about {MIN_TRAINING_AGE:.0f} years). This prediction is an extrapolation and "
                    "should be treated with extra caution."
                ),
            }
        )

    for key, value in scores.items():
        if value is None or key not in group.training_ranges:
            continue
        low, high = group.training_ranges[key]
        if not low <= value <= high:
            warnings.append(
                {
                    "code": "SCORE_OUTSIDE_TRAINING_RANGE",
                    "severity": "moderate",
                    "field": key,
                    "message": (
                        f"{FIELDS[key].label} = {value} is outside the range seen in training "
                        f"for this age group ({low}-{high})."
                    ),
                }
            )
    return warnings
