from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """A clinician who uses the system.

    A custom user model is created on day one because Django makes it painful
    to swap later. Patients are *records* owned by a doctor, not login users.
    """

    class Specialty(models.TextChoices):
        PEDIATRICIAN = "pediatrician", "Pediatrician"
        PSYCHOLOGIST = "psychologist", "Psychologist"
        PSYCHIATRIST = "psychiatrist", "Psychiatrist"
        OTHER = "other", "Other"

    specialty = models.CharField(max_length=20, choices=Specialty.choices, default=Specialty.OTHER)

    def __str__(self) -> str:
        return self.get_full_name() or self.username
