from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class KBUserAdmin(UserAdmin):
    list_display = ("email", "first_name", "org_name", "role", "kind", "city", "is_staff")
    list_filter = ("role", "kind", "city")
    fieldsets = UserAdmin.fieldsets + (("KindBytes", {"fields": (
        "phone", "role", "kind", "org_type", "org_name", "reg_no", "daily_kg", "capacity",
        "city", "area", "vehicle", "slots", "verified", "fostac", "storage", "demo_key")}),)
