from django.urls import path

from .views import AssessmentDetailView, AssessmentSchemaView, PatientAssessmentListCreateView

urlpatterns = [
    path("ml/schema/", AssessmentSchemaView.as_view(), name="ml-schema"),
    path(
        "patients/<str:public_id>/assessments/",
        PatientAssessmentListCreateView.as_view(),
        name="patient-assessments",
    ),
    path("assessments/<int:pk>/", AssessmentDetailView.as_view(), name="assessment-detail"),
]
