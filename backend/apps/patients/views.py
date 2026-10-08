from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, viewsets

from .models import Patient
from .serializers import PatientSerializer


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
        qs = Patient.objects.filter(created_by=self.request.user).order_by("-created_at", "-id")
        query = self.request.query_params.get("q", "").strip()
        if query:
            qs = qs.filter(Q(name__icontains=query) | Q(public_id__icontains=query))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @extend_schema(parameters=[OpenApiParameter("q", str, description="Search by name or patient ID")])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
