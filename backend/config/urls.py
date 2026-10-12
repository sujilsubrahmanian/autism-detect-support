from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .views import HealthView

api_v1 = [
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.assessments.urls")),
    path("health/", HealthView.as_view(), name="health"),
]

urlpatterns = [
    # The API has no home page: send visitors to the docs instead of a 404.
    path("", RedirectView.as_view(url="/api/docs/", permanent=False)),
    path("favicon.ico", lambda request: HttpResponse(status=204)),  # browsers always ask for this
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
    # Patients router lives under the same prefix
    path("api/v1/", include("apps.patients.urls")),
    # OpenAPI contract + interactive docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
