from django.contrib import admin

from .models import Batch, BulkGenerator, City, Event, Receiver, Report, SimState, Volunteer


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ("code", "food", "city", "kg", "grade", "score", "status", "receiver", "volunteer", "created_at")
    list_filter = ("status", "grade", "city")
    search_fields = ("code", "food", "donor")


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "meals", "need", "vols", "relief")


@admin.register(Receiver)
class ReceiverAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "type", "capacity", "dist_km", "owner")
    list_filter = ("type", "city")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("code", "type", "where", "city", "status", "created_at")
    list_filter = ("status", "city")


admin.site.register([Volunteer, Event, BulkGenerator, SimState])
admin.site.site_header = "KindBytes administration"
