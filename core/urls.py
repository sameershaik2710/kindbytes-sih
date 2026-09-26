from django.urls import path

from . import api

urlpatterns = [
    path("state/", api.StateView.as_view(), name="state"),
    path("batches/", api.BatchCreateView.as_view(), name="batch-create"),
    path("batches/<str:code>/<str:action>/", api.BatchActionView.as_view(), name="batch-action"),
    path("reports/", api.ReportCreateView.as_view(), name="report-create"),
    path("reports/<str:code>/status/", api.ReportStatusView.as_view(), name="report-status"),
    path("me/capacity/", api.CapacityView.as_view(), name="capacity"),
    path("sim/", api.SimControlView.as_view(), name="sim-control"),
    path("volunteers/broadcast/", api.BroadcastView.as_view(), name="broadcast"),
    path("bwg/<int:pk>/notice/", api.BulkNoticeView.as_view(), name="bwg-notice"),
]
