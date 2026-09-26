import json

from django.contrib.auth import login, logout
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from core import sim
from .constants import DEMO
from .models import User
from .serializers import user_json
from .validation import clean_phone, validate_signup

BACKEND = "django.contrib.auth.backends.ModelBackend"


def _body(request):
    try:
        return json.loads(request.body or b"{}")
    except ValueError:
        return {}


def _signed_in(request, user, keep=True, status=200, **extra):
    login(request, user, backend=BACKEND)
    if not keep:
        request.session.set_expiry(0)  # ends when the browser closes
    sim.on_login(user)
    return JsonResponse({"ok": True, "user": user_json(user), **extra}, status=status)


@require_POST
def signup(request):
    data = _body(request)
    cleaned, errs = validate_signup(data)
    if errs:
        return JsonResponse({"ok": False, "errors": errs}, status=400)
    with transaction.atomic():
        user = User(**cleaned)
        user.set_password(data["pw"])
        user.save()
    return _signed_in(request, user, status=201, created=True)


@require_POST
def login_view(request):
    data = _body(request)
    ident = str(data.get("ident") or "").strip().lower()
    pw = str(data.get("pw") or "")
    if not ident or not pw:
        return JsonResponse({"ok": False, "error": "Enter your email or mobile number and your password."}, status=400)
    user = User.objects.filter(email=ident).first() or User.objects.filter(phone=clean_phone(ident)).first()
    if not user or user.demo_key:
        return JsonResponse({"ok": False, "error": "No account uses that email or mobile number. Check it, or create an account."}, status=400)
    if not user.check_password(pw) or not user.is_active:
        return JsonResponse({"ok": False, "error": "That password is not right. Try again, or reset it."}, status=400)
    return _signed_in(request, user, keep=bool(data.get("keep", True)))


@require_POST
def demo_login(request):
    key = str(_body(request).get("key") or "")
    spec = DEMO.get(key)
    if not spec:
        return JsonResponse({"ok": False, "error": "Unknown demo account."}, status=400)
    user = User.objects.filter(demo_key=key).first()
    if not user:
        user = User(username=spec["email"], demo_key=key, **spec)
        user.set_unusable_password()
        user.save()
    return _signed_in(request, user)


@require_POST
def logout_view(request):
    sim.on_logout(request.user)
    logout(request)
    return JsonResponse({"ok": True})
