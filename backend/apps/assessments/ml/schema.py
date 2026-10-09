"""
Single source of truth for *what* we ask clinicians and *what* the model needs.

Everything else derives from this module:
  * API validation (serializers.py)
  * the dynamic form in the React frontend (served by GET /api/v1/ml/schema/)
  * out-of-range warnings (warnings.py)

So adding a test or changing an age band is a one-file change on the backend and
needs no frontend edit.
"""
from __future__ import annotations

from dataclasses import dataclass

# ABIDE (the training dataset) encodes "not collected" as -9999. This was verified
# from the fitted scaler: a StandardScaler mean of about -203 for FIQ is only
# possible if a few percent of rows hold a large negative sentinel.
# The model therefore learned to treat -9999 as "missing". We must send -9999 for
# tests that were not administered - NOT 0 and NOT a mean-imputed value.
MISSING_VALUE = -9999

# Column order the scaler/model were fitted with. The predictor refuses to start
# if the pickled scaler disagrees with this list.
MODEL_FEATURE_ORDER = [
    "AGE_AT_SCAN", "SEX", "FIQ", "VIQ", "PIQ",
    "ADOS_TOTAL", "ADOS_COMM", "ADOS_SOCIAL", "ADOS_STEREO_BEHAV",
    "SRS_RAW_TOTAL", "AQ_TOTAL",
]

# The youngest participants in ABIDE are school-age. Predictions below this age
# are extrapolation. Re-check with: df["AGE_AT_SCAN"].min() on your training CSV.
MIN_TRAINING_AGE = 5.0


@dataclass(frozen=True)
class FieldSpec:
    key: str            # API key (snake_case); model feature = key.upper()
    label: str
    minimum: int        # hard plausibility bound -> HTTP 400 if violated
    maximum: int
    help_text: str

    @property
    def model_feature(self) -> str:
        return self.key.upper()


FIELDS: dict[str, FieldSpec] = {
    f.key: f
    for f in [
        FieldSpec("fiq", "Full-scale IQ (FIQ)", 30, 180, "Overall IQ from a Wechsler scale."),
        FieldSpec("viq", "Verbal IQ (VIQ)", 30, 180, "Verbal comprehension / communication ability."),
        FieldSpec("piq", "Performance IQ (PIQ)", 30, 180, "Non-verbal reasoning and problem solving."),
        FieldSpec("ados_total", "ADOS total", 0, 30, "Autism Diagnostic Observation Schedule total score."),
        FieldSpec("ados_comm", "ADOS communication", 0, 12, "Communication sub-score."),
        FieldSpec("ados_social", "ADOS social interaction", 0, 18, "Reciprocal social interaction sub-score."),
        FieldSpec("ados_stereo_behav", "ADOS stereotyped behaviours", 0, 10, "Repetitive / restricted behaviour sub-score."),
        FieldSpec("srs_raw_total", "SRS raw total", 0, 195, "Social Responsiveness Scale raw total (65 items x 0-3)."),
        FieldSpec("aq_total", "Autism Quotient (AQ)", 0, 50, "AQ questionnaire total (50 items)."),
    ]
}

IQ_TEST_TYPES = [
    ("WASI", "WASI - Wechsler Abbreviated Scale of Intelligence"),
    ("WAIS", "WAIS - Wechsler Adult Intelligence Scale"),
    ("WISC", "WISC - Wechsler Intelligence Scale for Children"),
    ("OTHER", "Other instrument"),
]


@dataclass(frozen=True)
class AgeGroup:
    key: str
    label: str
    min_age: float                      # inclusive
    max_age: float | None               # exclusive; None = open-ended
    fields: tuple[str, ...]             # tests applicable to this age band
    # Observed (min, max) per field in the training data for this band. Used only
    # to *warn* about extrapolation; hard validation uses FIELDS above.
    training_ranges: dict[str, tuple[int, int]]


_ADOS = ("ados_total", "ados_comm", "ados_social", "ados_stereo_behav")

AGE_GROUPS: tuple[AgeGroup, ...] = (
    AgeGroup(
        "0-3", "Infant / toddler (0-3 years)", 0, 3,
        fields=(*_ADOS, "srs_raw_total"),
        training_ranges={
            "ados_total": (0, 24), "ados_comm": (0, 8), "ados_social": (0, 14),
            "ados_stereo_behav": (0, 4), "srs_raw_total": (29, 186),
        },
    ),
    AgeGroup(
        "3-5", "Preschool (3-5 years)", 3, 6,
        fields=("fiq", "viq", *_ADOS, "srs_raw_total"),
        training_ranges={
            "fiq": (54, 131), "viq": (49, 135), "ados_total": (0, 24), "ados_comm": (0, 8),
            "ados_social": (0, 14), "ados_stereo_behav": (0, 8), "srs_raw_total": (29, 186),
        },
    ),
    AgeGroup(
        "6-12", "School age (6-12 years)", 6, 13,
        fields=("fiq", "viq", "piq", *_ADOS, "srs_raw_total", "aq_total"),
        training_ranges={
            "fiq": (51, 140), "viq": (48, 141), "piq": (56, 149), "ados_total": (0, 24),
            "ados_comm": (0, 8), "ados_social": (0, 14), "ados_stereo_behav": (0, 8),
            "srs_raw_total": (27, 187), "aq_total": (3, 48),
        },
    ),
    AgeGroup(
        "13+", "Adolescent / adult (13+ years)", 13, None,
        fields=("fiq", "viq", "piq", *_ADOS, "srs_raw_total", "aq_total"),
        training_ranges={
            "fiq": (52, 135), "viq": (48, 138), "piq": (58, 145), "ados_total": (0, 24),
            "ados_comm": (0, 8), "ados_social": (0, 14), "ados_stereo_behav": (0, 6),
            "srs_raw_total": (26, 175), "aq_total": (2, 48),
        },
    ),
)

GROUPS_BY_KEY = {g.key: g for g in AGE_GROUPS}


def age_group_for(age_years: float) -> AgeGroup:
    """Pick the band for an age in years. Bands are [min, max): 3.0 -> '3-5'."""
    if age_years < 0:
        raise ValueError("Age cannot be negative.")
    for group in AGE_GROUPS:
        if age_years >= group.min_age and (group.max_age is None or age_years < group.max_age):
            return group
    raise ValueError(f"No age group for {age_years}")  # unreachable: last band is open-ended


def serialize_schema(band: tuple[float, float]) -> dict:
    """JSON description of the assessment form, consumed by the React frontend."""
    return {
        "missing_value_note": "Tests not applicable to an age group are sent to the model as -9999 (training-data missing code).",
        "min_training_age": MIN_TRAINING_AGE,
        "inconclusive_band": {"lower": band[0], "upper": band[1]},
        "iq_test_types": [{"value": v, "label": label} for v, label in IQ_TEST_TYPES],
        "age_groups": [
            {
                "key": g.key,
                "label": g.label,
                "min_age": g.min_age,
                "max_age": g.max_age,
                "fields": [
                    {
                        "key": k,
                        "label": FIELDS[k].label,
                        "min": FIELDS[k].minimum,
                        "max": FIELDS[k].maximum,
                        "help_text": FIELDS[k].help_text,
                        "training_range": list(g.training_ranges[k]),
                    }
                    for k in g.fields
                ],
            }
            for g in AGE_GROUPS
        ],
    }
