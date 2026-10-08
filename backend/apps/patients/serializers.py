from datetime import date

from rest_framework import serializers

from .models import Patient


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
