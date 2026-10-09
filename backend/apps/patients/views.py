from django.db.models import Count, Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Patient
from .serializers import (
    BirthMilestonesSerializer,
    HistorySerializer,
    PatientSerializer,
    PregnancyHistorySerializer,
)


class PatientViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Patients of the logged-in doctor.

    There is deliberately no DELETE: clinical records are retained for audit.
    """

    serializer_class = PatientSerializer
    lookup_field = "public_id"
    lookup_value_regex = r"ASD-\d+"

    def get_queryset(self):
        # Data isolation: a doctor can only ever see their own patients. Because the
        # *queryset* is filtered, another doctor's patient yields 404 (not 403), so
        # the existence of the record is not leaked either.
        qs = Patient.objects.filter(created_by=self.request.user).annotate(
            assessment_count=Count("assessments")
        ).order_by("-created_at", "-id")  # explicit: annotate() drops Meta.ordering
        query = self.request.query_params.get("q", "").strip()
        if query:
            qs = qs.filter(Q(name__icontains=query) | Q(public_id__icontains=query))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @extend_schema(parameters=[OpenApiParameter("q", str, description="Search by name or patient ID")])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(methods=["GET"], responses=HistorySerializer)
    @extend_schema(methods=["PUT"], request=HistorySerializer, responses=HistorySerializer)
    @action(detail=True, methods=["get", "put"], url_path="history")
    def history(self, request, public_id=None):
        patient = self.get_object()
        if request.method == "PUT":
            serializer = HistorySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(patient)
        return Response(self._history_payload(patient))

    @staticmethod
    def _history_payload(patient: Patient) -> dict:
        pregnancy = getattr(patient, "pregnancy", None)
        milestones = getattr(patient, "milestones", None)
        return {
            "pregnancy": PregnancyHistorySerializer(pregnancy).data if pregnancy else None,
            "milestones": BirthMilestonesSerializer(milestones).data if milestones else None,
        }
