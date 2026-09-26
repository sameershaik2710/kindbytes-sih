from django.db import connection
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

from accounts.serializers import user_json


@ensure_csrf_cookie
def index(request):
    return render(request, "index.html", {"boot": {"user": user_json(request.user)}})


def healthz(request):
    """Liveness: the process is up (no DB call, so a DB blip does not restart pods)."""
    return HttpResponse("ok\n", content_type="text/plain")


def readyz(request):
    """Readiness: the database answers."""
    try:
        with connection.cursor() as c:
            c.execute("SELECT 1")
        return JsonResponse({"ok": True})
    except Exception as e:  # pragma: no cover
        return JsonResponse({"ok": False, "error": str(e)}, status=503)
