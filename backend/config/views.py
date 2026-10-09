from django.db import connection
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assessments.ml.predictor import ModelUnavailable, get_predictor


class HealthView(APIView):
    """Liveness/readiness probe for Docker, Kubernetes/OpenShift and CI smoke tests."""

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []

    def get(self, request):
        checks = {"database": "ok", "model": "ok"}
        model_version = None
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            checks["database"] = "error"
        try:
            model_version = get_predictor().version
        except ModelUnavailable:
            checks["model"] = "error"
        healthy = all(v == "ok" for v in checks.values())
        return Response(
            {"status": "ok" if healthy else "degraded", "checks": checks, "model_version": model_version},
            status=200 if healthy else 503,
        )
