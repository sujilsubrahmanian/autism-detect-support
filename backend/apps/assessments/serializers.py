from datetime import date

from rest_framework import serializers

from .ml.schema import FIELDS, GROUPS_BY_KEY, IQ_TEST_TYPES, age_group_for
from .models import Assessment, Prediction


class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = [
            "outcome", "predicted_code", "probability_autism", "probability_control",
            "model_version", "warnings", "features", "created_at",
        ]


class AssessmentSerializer(serializers.ModelSerializer):
    """Read representation: assessment + its prediction."""

    prediction = PredictionSerializer(read_only=True)
    patient_id = serializers.CharField(source="patient.public_id", read_only=True)
    scores = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id", "patient_id", "assessed_on", "age_years", "age_group", "iq_test_type",
            "notes", "scores", "prediction", "created_at",
        ]

    def get_scores(self, obj: Assessment) -> dict:
        group = GROUPS_BY_KEY[obj.age_group]
        return {key: getattr(obj, key) for key in group.fields}


class AssessmentCreateSerializer(serializers.Serializer):
    """Write representation. Validation is *schema driven*: which score fields are
    required depends on the patient's age at the time of assessment."""

    assessed_on = serializers.DateField(required=False)
    iq_test_type = serializers.ChoiceField(choices=[c for c, _ in IQ_TEST_TYPES], required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Declare one optional integer field per known test; validate() enforces
        # which of them are required / forbidden for the specific age band.
        for key, spec in FIELDS.items():
            self.fields[key] = serializers.IntegerField(
                required=False, allow_null=True, min_value=spec.minimum, max_value=spec.maximum
            )

    def validate(self, attrs):
        patient = self.context["patient"]
        assessed_on = attrs.get("assessed_on") or date.today()
        if assessed_on > date.today():
            raise serializers.ValidationError({"assessed_on": "Assessment date cannot be in the future."})
        if assessed_on < patient.date_of_birth:
            raise serializers.ValidationError({"assessed_on": "Assessment date is before the date of birth."})

        age = patient.age_on(assessed_on)
        group = age_group_for(age)

        errors: dict[str, str] = {}
        for key in FIELDS:
            provided = attrs.get(key) is not None
            if key in group.fields and not provided:
                errors[key] = f"{FIELDS[key].label} is required for this age group ({group.key})."
            elif key not in group.fields and provided:
                errors[key] = f"{FIELDS[key].label} is not collected for this age group."
        if errors:
            raise serializers.ValidationError(errors)

        attrs["assessed_on"] = assessed_on
        attrs["age_years"] = age
        attrs["age_group"] = group.key
        return attrs
