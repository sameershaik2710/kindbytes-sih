from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .engine import compute_streams
from .models import Batch, BulkGenerator, Receiver, Report, SimState
from .serializers import state_json
from . import sim

TEMPS = {"hot": 63, "cold": 4, "room": 30}
REPORT_TYPES = ["Food dumped in the open", "Overflowing bin", "Unsegregated waste at an event", "Dirty community fridge"]


def err(msg, code=status.HTTP_400_BAD_REQUEST, **extra):
    return Response({"ok": False, "error": msg, **extra}, status=code)


class StateView(APIView):
    """Everything the dashboards render, in one poll (every ~2 s from the browser)."""
    permission_classes = [AllowAny]

    def get(self, request):
        sim.ensure_seeded()
        sim.maybe_tick()
        return Response(state_json(request.user))


class BatchCreateView(APIView):
    """A donor (restaurant, cafe, hotel, household...) lists surplus food."""

    def post(self, request):
        u, d = request.user, request.data
        if u.kind != "donor":
            return err("Only food donors can list surplus.", status.HTTP_403_FORBIDDEN)
        food = str(d.get("food") or "").strip()[:120]
        errors = {}
        try:
            kg = int(round(float(d.get("kg") or 0)))
        except (TypeError, ValueError):
            kg = 0
        if len(food) < 2:
            errors["food"] = "Say what the food is."
        if not 0 < kg <= 2000:
            errors["kg"] = "Enter the quantity in kg."
        if errors:
            return Response({"ok": False, "errors": errors}, status=400)
        cat = d.get("cat") if d.get("cat") in ("veg", "nonveg", "bakery", "raw", "sweets") else "veg"
        pack = d.get("packaging") if d.get("packaging") in ("Sealed", "Covered", "Open") else "Covered"
        try:
            hours = max(0.0, min(24.0, float(d.get("hours") or 1.5)))
            temp_c = int(d.get("tempC")) if d.get("tempC") is not None else TEMPS.get(d.get("temp"), 63)
            checks = max(0, min(4, int(d.get("checks") or 0)))
        except (TypeError, ValueError):
            return err("Invalid listing values.")
        with transaction.atomic():
            b = sim.make_batch(_city(u), over=dict(
                food=food, cat=cat, veg=cat != "nonveg", allergens=[], kg=kg, hours=hours, temp_c=temp_c,
                packaging=pack, checks=checks, donor=u.org_name or u.first_name), owner=u)
            sim.add_event("new", f"{b.donor} listed {food.lower()}, {kg} kg in {b.city.name}. Graded {b.grade}.", b.city_id)
        return Response({"ok": True, "id": b.code, "grade": b.grade, "score": b.score}, status=201)


def _city(u):
    from .models import City
    return City.objects.get(pk=u.city)


class BatchActionView(APIView):
    """assign | unsafe | advance | accept | pickup | deliver"""

    def post(self, request, code, action):
        u = request.user
        with transaction.atomic():
            b = get_object_or_404(Batch.objects.select_for_update(of=("self",)).select_related("city", "receiver"), code=code)
            if action == "assign":
                if b.status != "listed":
                    return err("This batch is already on its way.")
                rid = str(request.data.get("receiver") or "").lstrip("r")
                rec = get_object_or_404(Receiver, pk=rid, city=b.city) if rid.isdigit() else None
                if not rec:
                    return err("Choose a receiver.")
                sim.assign(b, rec)
                return Response({"ok": True, "volunteer": b.volunteer, "receiver": rec.name})
            if action == "unsafe":
                if b.status != "listed" or b.grade == "C":
                    return err("Only waiting batches can be marked unsafe.")
                sim.mark_unsafe(b)
                return Response({"ok": True})
            if action == "advance":
                if b.status == "matched":
                    sim.pickup(b)
                elif b.status == "picked":
                    sim.deliver(b)
                else:
                    return err("Nothing to advance.")
                return Response({"ok": True, "status": b.status})
            if action == "accept":
                if u.kind != "vol":
                    return err("Only volunteers can accept pickups.", status.HTTP_403_FORBIDDEN)
                if Batch.objects.filter(volunteer_user=u, status__in=("matched", "picked")).exists():
                    return err("Finish your current pickup first.")
                if b.status != "listed":
                    return err("Someone already took this pickup.")
                m = sim.matches(b)
                if not m:
                    return err("No receiver can take this batch right now.")
                sim.assign(b, m[0]["r"], vol_name=u.first_name, vol_user=u)
                return Response({"ok": True})
            if action == "pickup":
                if b.volunteer_user_id != u.pk or b.status != "matched":
                    return err("This is not your pickup.", status.HTTP_403_FORBIDDEN)
                checks, probe = request.data.get("checks") or [], request.data.get("probe")
                if len(checks) != 4 or not all(checks) or probe not in ("hot", "cold", "mid"):
                    return err("Tick all four hygiene checks and log the probe reading first.")
                rerouted = None
                if probe == "mid" and b.cat not in ("raw", "bakery") and b.grade != "C":
                    b.grade, b.score = "C", min(b.score, 44)
                    b.streams = compute_streams(b.kg, b.packaging, b.cat, "C", b.veg)
                    alt = (b.city.receivers.filter(type="animal" if b.veg else "compost").first()
                           or b.city.receivers.filter(type="compost").first())
                    b.receiver = alt
                    b.save()
                    rerouted = alt.name
                    sim.add_event("warn", f"{b.code} read between 5 and 60 °C at pickup. Rerouted to {alt.name} instead of people.", b.city_id)
                sim.pickup(b)
                return Response({"ok": True, "rerouted": rerouted, "receiver": b.receiver.name if b.receiver else None})
            if action == "deliver":
                mine = b.volunteer_user_id == u.pk or (b.receiver and b.receiver.owner_id == u.pk)
                if not mine or b.status != "picked":
                    return err("You can only confirm your own deliveries.", status.HTTP_403_FORBIDDEN)
                sim.deliver(b)
                return Response({"ok": True, "credits": 10 + round(b.kg / 2)})
        return err("Unknown action.", status.HTTP_404_NOT_FOUND)


class ReportCreateView(APIView):
    def post(self, request):
        u, d = request.user, request.data
        where = str(d.get("where") or "").strip()[:160]
        type_ = d.get("type") if d.get("type") in REPORT_TYPES else REPORT_TYPES[0]
        if len(where) < 3:
            return Response({"ok": False, "errors": {"where": "Add a landmark or street so the team can find it."}}, status=400)
        r = Report.objects.create(code=sim.next_report_code(), type=type_, where=where, city_id=u.city, by=u,
                                  created_at=sim.now(), has_photo=bool(d.get("photo")))
        who = f"Volunteer {u.first_name.split(' ')[0]}" if u.kind == "vol" else "Citizen"
        sim.add_event("warn", f"{who} reported {type_.lower()} at {where}, {r.city.name}. Sent to the ward sanitation team.", u.city)
        return Response({"ok": True, "id": r.code}, status=201)


class ReportStatusView(APIView):
    def post(self, request, code):
        u = request.user
        if u.kind != "ulb":
            return err("Only municipal accounts can update hotspots.", status.HTTP_403_FORBIDDEN)
        r = get_object_or_404(Report, code=code, city_id=u.city)
        new = request.data.get("status")
        if new not in ("assigned", "cleared"):
            return err("Unknown status.")
        r.status, r.t2, r.manual = new, sim.now(), True
        r.save()
        if new == "assigned":
            sim.add_event("info", f"Ward sanitation team assigned to {r.type.lower()} at {r.where}.", r.city_id)
        else:
            sim.add_event("deliver", f"Hotspot cleared: {r.type.lower()} at {r.where}.", r.city_id)
        return Response({"ok": True})


class CapacityView(APIView):
    def post(self, request):
        u = request.user
        rec = getattr(u, "receiver", None)
        if u.kind != "receiver" or rec is None:
            return err("Only receiving organizations have a capacity.", status.HTTP_403_FORBIDDEN)
        try:
            cap = int(request.data.get("cap"))
            assert cap > 0
        except Exception:
            return err("Enter how much you can take.")
        rec.capacity, rec.veg_only = cap, bool(request.data.get("veg"))
        rec.urgency = .97 if request.data.get("urgent") else .7
        rec.save()
        sim.add_event("info", f"{rec.name} updated capacity to {cap} {rec.unit or 'servings'}.", rec.city_id)
        return Response({"ok": True})


class SimControlView(APIView):
    """Surge mode (disaster relief priority) and auto-dispatch switches."""

    def post(self, request):
        st = SimState.objects.get(pk=1)
        msg = None
        if "surge" in request.data:
            st.surge = bool(request.data["surge"])
            if st.surge:
                from .models import City
                for c in City.objects.filter(relief=True):
                    c.need += 320
                    c.save(update_fields=["need"])
                sim.add_event("surge", "Surge declared for flood relief in Guwahati, Patna and Bhubaneswar. Grade A food now goes to relief camps first.")
            else:
                sim.add_event("info", "Surge mode off. Normal routing resumed.")
        if "auto" in request.data:
            st.auto = bool(request.data["auto"])
        st.save(update_fields=["surge", "auto"])
        return Response({"ok": True, "surge": st.surge, "auto": st.auto, "message": msg})


class BroadcastView(APIView):
    def post(self, request):
        if request.user.kind == "vol":
            return err("Volunteers cannot send shift requests.", status.HTTP_403_FORBIDDEN)
        n = sim.rng.randint(48, 86)
        return Response({"ok": True, "sent": n, "slot": str(request.data.get("slot") or "")[:40]})


class BulkNoticeView(APIView):
    def post(self, request, pk):
        u = request.user
        if u.kind != "ulb":
            return err("Only municipal accounts can send notices.", status.HTTP_403_FORBIDDEN)
        g = get_object_or_404(BulkGenerator, pk=pk, city_id=u.city)
        was = g.status
        g.status = "sent"
        g.save(update_fields=["status"])
        return Response({"ok": True, "was": was, "name": g.name})
