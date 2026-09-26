"""JSON shapes consumed by the frontend. Keys match the original prototype so its
render functions work unchanged."""
from datetime import timedelta

from django.db.models import Q, Sum
from django.utils import timezone

from accounts.serializers import user_json
from .models import Batch, BulkGenerator, City, Event, Report, Volunteer
from .sim import ACTIVE, matches, ms, state


def rec_json(r, user=None):
    if r is None:
        return None
    return {"id": f"r{r.pk}", "name": r.name, "type": r.type, "distKm": r.dist_km, "urgency": r.urgency,
            "capacity": r.capacity, "vegOnly": r.veg_only, "unit": r.unit or None, "slot": r.slot or None,
            "mine": bool(user and user.is_authenticated and r.owner_id == user.pk)}


def batch_json(b, user=None, recs=None, surge=False):
    t = timezone.now()
    d = {
        "id": b.code, "cityId": b.city_id, "food": b.food, "donor": b.donor, "kg": b.kg, "servings": b.servings,
        "veg": b.veg, "al": b.allergens, "hours": b.hours, "tempC": b.temp_c, "packaging": b.packaging,
        "checks": b.checks, "cat": b.cat, "score": b.score, "grade": b.grade, "factors": b.factors,
        "streams": b.streams, "shelf": b.shelf_ms, "created": ms(b.created_at), "expiresAt": ms(b.expires_at),
        "status": b.status, "log": b.log, "eta": b.eta, "rating": b.rating, "volunteer": b.volunteer,
        "fresh": (t - b.created_at).total_seconds() < 2, "doneAt": ms(b.done_at), "distFor": b.dist_for,
        "owner": b.owner_id, "mineVol": bool(user and user.is_authenticated and b.volunteer_user_id == user.pk),
        "receiver": rec_json(b.receiver, user),
    }
    if b.status == "listed":
        d["matches"] = [{"r": rec_json(m["r"], user), **{k: m[k] for k in ("dist", "need", "cap", "diet", "score")}}
                        for m in matches(b, receivers=recs, surge=surge)]
    return d


def me_json(user):
    if not user or not user.is_authenticated:
        return None
    day = timezone.localtime().replace(hour=0, minute=0, second=0, microsecond=0)
    me = {"listedKg": 0, "st": {}, "handovers": 0, "meals": 0, "received": 0, "deliveries": 0,
          "reports": Report.objects.filter(by=user).count(), "credits": 0}
    if user.kind == "donor":
        mine = Batch.objects.filter(owner=user, created_at__gte=day).select_related("receiver")
        me["listedKg"] = mine.aggregate(s=Sum("kg"))["s"] or 0
        for b in mine.filter(status="delivered"):
            s2 = dict(b.streams)
            if b.receiver and b.receiver.type == "compost":
                s2["wet"] += s2["feed"]
                s2["feed"] = 0
            for k, v in s2.items():
                me["st"][k] = me["st"].get(k, 0) + v
            me["handovers"] += 1
            if b.receiver and b.receiver.type in ("people", "relief"):
                me["meals"] += b.servings
    elif user.kind == "receiver" and hasattr(user, "receiver"):
        rec = user.receiver
        got = Batch.objects.filter(receiver=rec, status="delivered", delivered_at__gte=day)
        me["received"] = (got.aggregate(s=Sum("servings"))["s"] if rec.type in ("people", "relief") else got.aggregate(s=Sum("kg"))["s"]) or 0
    elif user.kind == "vol" and hasattr(user, "volunteer"):
        me["deliveries"], me["credits"] = user.volunteer.deliveries, user.volunteer.credits
    return me


def report_json(r):
    return {"id": r.code, "type": r.type, "where": r.where, "cityId": r.city_id, "t": ms(r.created_at), "t2": ms(r.t2),
            "status": r.status, "by": r.by_id, "photo": r.has_photo, "manual": r.manual}


def state_json(user):
    st = state()
    t = timezone.now()
    authed = bool(user and user.is_authenticated)
    cities = list(City.objects.prefetch_related("receivers"))
    recs = {c.code: list(c.receivers.all()) for c in cities}
    q = Q(status__in=ACTIVE) | Q(done_at__gte=t - timedelta(seconds=50))
    if authed:
        q |= Q(owner=user) | Q(volunteer_user=user) | Q(receiver__owner=user)
    batches = Batch.objects.select_related("receiver").filter(q).order_by("-created_at")[:90]
    data = {
        "now": ms(t),
        "sim": {"surge": st.surge, "auto": st.auto, "grades": st.grades, "streams": st.streams,
                "totals": {"meals": st.meals_total, "kg": st.kg_total, "pickup": st.pickup_median}},
        "cities": [{"id": c.code, "meals": c.meals, "need": c.need, "vols": c.vols, "relief": c.relief,
                    "receivers": [rec_json(r, user) for r in recs[c.code]]} for c in cities],
        "vols": [{"n": v.name, "c": v.city_id, "d": v.deliveries, "cr": v.credits, "s": v.streak, "b": v.badges,
                  "on": v.online, "me": bool(authed and v.user_id == user.pk)} for v in Volunteer.objects.all()],
        "batches": [batch_json(b, user, recs[b.city_id], st.surge) for b in batches],
        "events": [{"type": e.type, "text": e.text, "t": ms(e.created_at), "city": e.city_code}
                   for e in Event.objects.all()[:40]],
        "user": user_json(user),
        "me": me_json(user),
        "myRec": rec_json(getattr(user, "receiver", None), user) if authed and user.kind == "receiver" else None,
        "reports": [], "bwg": {},
    }
    if authed:
        rq = Report.objects.filter(Q(city_id=user.city) | Q(by=user))
        data["reports"] = [report_json(r) for r in rq[:60]]
        bwg = {}
        for g in BulkGenerator.objects.all():
            bwg.setdefault(g.city_id, []).append({"id": g.pk, "n": g.name, "type": g.type, "kg": g.kg_per_day,
                                                  "div": g.diverted, "status": g.status, "reg": g.reg})
        data["bwg"] = bwg
    return data
