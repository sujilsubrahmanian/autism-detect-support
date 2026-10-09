from django.contrib import admin

from .models import Assessment, Prediction


class PredictionInline(admin.StackedInline):
    model = Prediction
    extra = 0
    can_delete = False


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "age_group", "assessed_on", "administered_by")
    inlines = [PredictionInline]
