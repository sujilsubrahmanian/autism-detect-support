from django.contrib import admin

from .models import BirthMilestones, Patient, PregnancyHistory

admin.site.register(PregnancyHistory)
admin.site.register(BirthMilestones)


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("public_id", "name", "sex", "date_of_birth", "created_by")
    search_fields = ("public_id", "name")
    readonly_fields = ("public_id",)
