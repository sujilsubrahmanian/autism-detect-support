from django.conf import settings
from django.db import models

from apps.patients.models import Patient

from .ml.schema import IQ_TEST_TYPES


class Assessment(models.Model):
    """One clinical assessment session. Immutable once saved (audit trail):
    the API offers create / list / retrieve only - never update or delete."""

    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="assessments")
    administered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+")
    assessed_on = models.DateField()
    age_years = models.FloatField(help_text="Age at assessment, derived from date of birth.")
    age_group = models.CharField(max_length=8)
    iq_test_type = models.CharField(max_length=8, choices=IQ_TEST_TYPES, blank=True)
    notes = models.TextField(blank=True)

    # Test scores. NULL = not applicable / not administered.
    fiq = models.SmallIntegerField(null=True, blank=True)
    viq = models.SmallIntegerField(null=True, blank=True)
    piq = models.SmallIntegerField(null=True, blank=True)
    ados_total = models.SmallIntegerField(null=True, blank=True)
    ados_comm = models.SmallIntegerField(null=True, blank=True)
    ados_social = models.SmallIntegerField(null=True, blank=True)
    ados_stereo_behav = models.SmallIntegerField(null=True, blank=True)
    srs_raw_total = models.SmallIntegerField(null=True, blank=True)
    aq_total = models.SmallIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["patient", "-created_at"])]

    def __str__(self) -> str:
        return f"Assessment {self.pk} for {self.patient.public_id}"


class Prediction(models.Model):
    """The model's output for one assessment, stored with everything needed to
    reproduce it later: model version + the exact feature vector sent."""

    class Outcome(models.TextChoices):
        LIKELY = "likely_asd", "Higher likelihood of ASD"
        UNLIKELY = "unlikely_asd", "Lower likelihood of ASD"
        INCONCLUSIVE = "inconclusive", "Inconclusive"

    assessment = models.OneToOneField(Assessment, on_delete=models.CASCADE, related_name="prediction")
    predicted_code = models.PositiveSmallIntegerField(help_text="Dataset coding: 1 = autism, 2 = control")
    probability_autism = models.FloatField()
    probability_control = models.FloatField()
    outcome = models.CharField(max_length=16, choices=Outcome.choices)
    model_version = models.CharField(max_length=64)
    features = models.JSONField(help_text="Exact feature vector given to the model")
    warnings = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.outcome} ({self.probability_autism:.2f})"
