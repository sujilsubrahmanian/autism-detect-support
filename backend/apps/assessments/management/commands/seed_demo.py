"""Create a demo doctor and a few patients with assessments.

    python manage.py seed_demo
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.assessments.serializers import AssessmentCreateSerializer
from apps.assessments.services import run_assessment
from apps.patients.models import Patient

DEMO_PASSWORD = "DemoPass!234"

DEMO_PATIENTS = [
    # (name, years old, sex, scores)
    ("Aarav Menon", 9, "M", dict(fiq=98, viq=95, piq=102, ados_total=12, ados_comm=4, ados_social=8,
                                  ados_stereo_behav=3, srs_raw_total=105, aq_total=29)),
    ("Meera Nair", 11, "F", dict(fiq=112, viq=110, piq=113, ados_total=1, ados_comm=0, ados_social=1,
                                  ados_stereo_behav=0, srs_raw_total=42, aq_total=11)),
    ("Kiran Das", 15, "M", dict(fiq=101, viq=99, piq=104, ados_total=7, ados_comm=2, ados_social=5,
                                 ados_stereo_behav=1, srs_raw_total=78, aq_total=22)),
]


class Command(BaseCommand):
    help = "Create a demo doctor (demo_doctor) and sample patients with predictions."

    def handle(self, *args, **options):
        doctor, created = User.objects.get_or_create(
            username="demo_doctor",
            defaults={"email": "demo@example.com", "first_name": "Demo", "last_name": "Doctor",
                      "specialty": User.Specialty.PSYCHOLOGIST},
        )
        if created:
            doctor.set_password(DEMO_PASSWORD)
            doctor.save()

        for name, years, sex, scores in DEMO_PATIENTS:
            if Patient.objects.filter(created_by=doctor, name=name).exists():
                continue
            patient = Patient.objects.create(
                name=name, sex=sex, created_by=doctor,
                date_of_birth=date.today() - timedelta(days=int(years * 365.25) + 30),
            )
            serializer = AssessmentCreateSerializer(data=scores, context={"patient": patient})
            serializer.is_valid(raise_exception=True)
            run_assessment(patient=patient, doctor=doctor, data=serializer.validated_data)
            self.stdout.write(f"  created {patient}")

        self.stdout.write(self.style.SUCCESS(f"Demo ready. Login: demo_doctor / {DEMO_PASSWORD}"))
