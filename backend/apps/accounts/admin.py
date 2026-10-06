from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class DoctorAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Clinical", {"fields": ("specialty",)}),)
    list_display = ("username", "email", "specialty", "is_staff")
