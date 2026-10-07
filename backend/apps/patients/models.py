from datetime import date

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction


class Patient(models.Model):
    """A child/individual being assessed. Owned by the doctor who created it.

    Privacy by design: we store only what the workflow needs (name, date of
    birth, sex, guardian). No phone, address or national ID.
    """

    class Sex(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"

    # Human-friendly ID shown in the UI (e.g. ASD-000042). Generated server-side:
    # the original app generated IDs in the browser with Math.random(), which can
    # collide and can be forged.
    public_id = models.CharField(max_length=16, unique=True, null=True, blank=True, editable=False)
    name = models.CharField(max_length=120)
    date_of_birth = models.DateField()
    sex = models.CharField(
        max_length=1,
        choices=Sex.choices,
        help_text="Sex as recorded in the training data (the model uses a binary SEX feature).",
    )
    guardian_name = models.CharField(max_length=120, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="patients"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["created_by", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.public_id or '(new)'} - {self.name}"

    def save(self, *args, **kwargs):
        creating = self.pk is None
        with transaction.atomic():
            super().save(*args, **kwargs)
            if creating and not self.public_id:
                # The primary key is unique by construction, so an ID derived from it
                # can never collide (no retry loop needed).
                self.public_id = f"ASD-{self.pk:06d}"
                super().save(update_fields=["public_id"])

    def age_on(self, when: date) -> float:
        """Age in years (decimal) on a given date."""
        return round((when - self.date_of_birth).days / 365.25, 2)


class PregnancyHistory(models.Model):
    """Maternal history during pregnancy (clinical context; not a model input yet)."""

    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name="pregnancy")
    blood_sugar_mg_dl = models.FloatField(null=True, blank=True, validators=[MinValueValidator(20), MaxValueValidator(600)])
    previous_abortions = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(20)])
    bmi = models.FloatField(null=True, blank=True, validators=[MinValueValidator(10), MaxValueValidator(80)])
    systolic_bp = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(50), MaxValueValidator(260)])
    diastolic_bp = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(30), MaxValueValidator(160)])

    def __str__(self) -> str:
        return f"Pregnancy history for {self.patient_id}"


class BirthMilestones(models.Model):
    """Birth details and age (in months) at which motor milestones were reached."""

    _month = [MaxValueValidator(60)]

    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name="milestones")
    birth_weight_kg = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0.3), MaxValueValidator(7)])
    premature_birth = models.BooleanField(default=False)
    lifting_head_month = models.PositiveSmallIntegerField(null=True, blank=True, validators=_month)
    rolling_over_month = models.PositiveSmallIntegerField(null=True, blank=True, validators=_month)
    sitting_up_month = models.PositiveSmallIntegerField(null=True, blank=True, validators=_month)
    crawling_month = models.PositiveSmallIntegerField(null=True, blank=True, validators=_month)
    standing_with_support_month = models.PositiveSmallIntegerField(null=True, blank=True, validators=_month)
    standing_individually_month = models.PositiveSmallIntegerField(null=True, blank=True, validators=_month)

    def __str__(self) -> str:
        return f"Birth milestones for {self.patient_id}"
