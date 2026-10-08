from datetime import date

from rest_framework import serializers

from .models import BirthMilestones, Patient, PregnancyHistory


class PatientSerializer(serializers.ModelSerializer):
    age_years = serializers.SerializerMethodField()
    # The real count arrives with the assessments app (via annotate in the view); 0 until then.
    assessment_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Patient
        fields = [
            "public_id", "name", "date_of_birth", "sex", "guardian_name",
            "age_years", "assessment_count", "created_at",
        ]
        read_only_fields = ["public_id", "created_at"]

    def get_age_years(self, obj: Patient) -> float:
        return obj.age_on(date.today())

    def validate_date_of_birth(self, value: date) -> date:
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        if (date.today() - value).days / 365.25 > 120:
            raise serializers.ValidationError("Date of birth is implausibly far in the past.")
        return value


class PregnancyHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PregnancyHistory
        exclude = ["id", "patient"]


class BirthMilestonesSerializer(serializers.ModelSerializer):
    class Meta:
        model = BirthMilestones
        exclude = ["id", "patient"]


class HistorySerializer(serializers.Serializer):
    """Both history sections in one payload so the UI can save them with one request."""

    pregnancy = PregnancyHistorySerializer(required=False)
    milestones = BirthMilestonesSerializer(required=False)

    def save(self, patient: Patient):
        # update_or_create makes PUT idempotent: send it twice, get the same result.
        if "pregnancy" in self.validated_data:
            PregnancyHistory.objects.update_or_create(patient=patient, defaults=self.validated_data["pregnancy"])
        if "milestones" in self.validated_data:
            BirthMilestones.objects.update_or_create(patient=patient, defaults=self.validated_data["milestones"])
        return patient
