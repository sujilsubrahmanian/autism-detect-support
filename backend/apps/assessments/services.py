"""Business logic for running an assessment.

Views stay thin (HTTP in/out); the rules live here and are easy to unit test.
"""
from django.conf import settings
from django.db import transaction

from apps.patients.models import Patient

from .ml.predictor import classify, get_predictor
from .ml.schema import FIELDS, GROUPS_BY_KEY, MISSING_VALUE
from .ml.warnings import build_warnings
from .models import Assessment, Prediction

SEX_CODE = {"M": 1, "F": 2}  # coding used by the ABIDE training data


def build_feature_vector(*, age_years: float, sex: str, scores: dict[str, int | None]) -> dict[str, float | int]:
    """Assemble the 11-column vector in the model's vocabulary.

    Tests that do not apply to the age group are sent as MISSING_VALUE (-9999),
    exactly how missing data looked at training time.
    """
    vector: dict[str, float | int] = {"AGE_AT_SCAN": age_years, "SEX": SEX_CODE[sex]}
    for key, spec in FIELDS.items():
        value = scores.get(key)
        vector[spec.model_feature] = MISSING_VALUE if value is None else value
    return vector


@transaction.atomic
def run_assessment(*, patient: Patient, doctor, data: dict) -> Assessment:
    """Validate-already-done -> predict -> persist assessment + prediction atomically."""
    group = GROUPS_BY_KEY[data["age_group"]]
    scores = {key: data.get(key) for key in group.fields}

    features = build_feature_vector(age_years=data["age_years"], sex=patient.sex, scores=scores)
    result = get_predictor().predict(features)  # may raise ModelUnavailable -> 503

    assessment = Assessment.objects.create(
        patient=patient,
        administered_by=doctor,
        assessed_on=data["assessed_on"],
        age_years=data["age_years"],
        age_group=group.key,
        iq_test_type=data.get("iq_test_type", ""),
        notes=data.get("notes", ""),
        **scores,
    )
    Prediction.objects.create(
        assessment=assessment,
        predicted_code=result.code,
        probability_autism=result.probability_autism,
        probability_control=result.probability_control,
        outcome=classify(result.probability_autism, settings.PREDICTION_INCONCLUSIVE_BAND),
        model_version=get_predictor().version,
        features=features,
        warnings=build_warnings(data["age_years"], group, scores),
    )
    return assessment
