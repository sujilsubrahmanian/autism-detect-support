from django.conf import settings
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.patients.models import Patient

from .ml.predictor import ModelUnavailable
from .ml.schema import serialize_schema
from .models import Assessment
from .serializers import AssessmentCreateSerializer, AssessmentSerializer
from .services import run_assessment


class ModelUnavailableError(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "The prediction model is temporarily unavailable."
    default_code = "model_unavailable"


class AssessmentSchemaView(APIView):
    """Describes the assessment form (fields, ranges, age bands). The frontend
    builds its form from this, so field definitions live in exactly one place."""

    @extend_schema(responses={200: dict})
    def get(self, request):
        return Response(serialize_schema(settings.PREDICTION_INCONCLUSIVE_BAND))


class PatientAssessmentListCreateView(generics.ListCreateAPIView):
    """List a patient's assessments, or record a new one and get a prediction."""

    def get_patient(self) -> Patient:
        # Ownership enforced here too: another doctor's patient -> 404.
        return get_object_or_404(Patient, public_id=self.kwargs["public_id"], created_by=self.request.user)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):  # schema generation has no URL kwargs
            return Assessment.objects.none()
        return (
            Assessment.objects.filter(patient=self.get_patient())
            .select_related("prediction", "patient")
        )

    def get_serializer_class(self):
        return AssessmentCreateSerializer if self.request.method == "POST" else AssessmentSerializer

    @extend_schema(request=AssessmentCreateSerializer, responses={201: AssessmentSerializer})
    def post(self, request, *args, **kwargs):
        patient = self.get_patient()
        serializer = AssessmentCreateSerializer(data=request.data, context={"patient": patient})
        serializer.is_valid(raise_exception=True)
        try:
            assessment = run_assessment(patient=patient, doctor=request.user, data=serializer.validated_data)
        except ModelUnavailable as exc:
            raise ModelUnavailableError() from exc
        return Response(AssessmentSerializer(assessment).data, status=status.HTTP_201_CREATED)


class AssessmentDetailView(generics.RetrieveAPIView):
    serializer_class = AssessmentSerializer

    def get_queryset(self):
        return Assessment.objects.filter(patient__created_by=self.request.user).select_related(
            "prediction", "patient"
        )
