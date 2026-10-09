from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .views import HealthView

api_v1 = [
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.assessments.urls")),
    path("health/", HealthView.as_view(), name="health"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
    # Patients router lives under the same prefix
    path("api/v1/", include("apps.patients.urls")),
    # OpenAPI contract + interactive docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
