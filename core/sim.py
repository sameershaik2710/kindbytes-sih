"""KindBytes dispatch network: batch lifecycle and the live simulation.

Ported from the original browser prototype. Runs on the server so every user sees the
same live network. `tick()` is called by Celery beat every 2 s in production, and lazily
from /api/state/ when no worker is running (local development).
"""
import random
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from accounts.constants import ORG_TYPES
from .engine import clamp, compute_streams, eligible, jround, match_score, score_batch
from .models import Batch, BulkGenerator, City, Event, Receiver, Report, SimState, Volunteer

rng = random.SystemRandom()

CITIES = [  # code, name, weight, relief
    ("del", "Delhi", 1.3, False), ("mum", "Mumbai", 1.3, False), ("blr", "Bengaluru", 1.2, False),
    ("hyd", "Hyderabad", 1.1, False), ("che", "Chennai", 1.1, False), ("kol", "Kolkata", 1.1, False),
    ("pun", "Pune", .9, False), ("ahm", "Ahmedabad", .9, False), ("jai", "Jaipur", .8, False),
    ("lko", "Lucknow", .8, False), ("pat", "Patna", .7, True), ("gau", "Guwahati", .7, True),
    ("bbs", "Bhubaneswar", .6, True), ("koc", "Kochi", .6, False), ("ngp", "Nagpur", .6, False),
    ("ind", "Indore", .6, False), ("chd", "Chandigarh", .5, False), ("viz", "Visakhapatnam", .6, False),
]
FOODS = [
    ("Veg biryani", 1, []), ("Dal and jeera rice", 1, []), ("Chapati and aloo sabzi", 1, ["gluten"]),
    ("Paneer butter masala", 1, ["dairy"]), ("Idli and sambar", 1, []), ("Chicken curry and rice", 0, []),
    ("Rajma chawal", 1, []), ("Vegetable pulao", 1, []), ("Curd rice", 1, ["dairy"]), ("Bread loaves", 1, ["gluten"]),
    ("Poha", 1, ["peanuts"]), ("Mixed fruit crates", 1, []), ("Egg fried rice", 0, ["egg"]),
    ("Wedding buffet mix", 1, ["dairy", "nuts"]), ("Mithai boxes", 1, ["dairy", "nuts"]), ("Sambar rice", 1, []),
]
DONORS = ["Annapurna Caterers", "Royal Palms Banquets", "Green Leaf Restaurant", "Tech Park cafeteria", "Shubh Vivah Hall",
          "Hotel Meghdoot", "Spice Route Kitchen", "Sunrise Bakery", "University mess hall", "Saffron Events",
          "Metro Food Court", "Sai Krupa Tiffins"]
PEOPLE_RECV = ["Aasra Night Shelter", "Seva Sadan Kitchen", "Nanhi Kiran Children’s Home", "Sahara Elders’ Home",
               "Annadaan Community Kitchen", "Snehalaya Women’s Shelter", "Street Smile Foundation"]
FIRST = ["Aditya", "Pooja", "Suresh", "Kavya", "Manish", "Ritu", "Farhan", "Lakshmi", "Deepak", "Neha", "Harish", "Zoya"]
VOLS = [
    ("Priya Sharma", "del", 64, 1420, 18, ["Night owl", "Zero spoil"]), ("Arjun Rao", "hyd", 58, 1310, 12, ["Zero spoil"]),
    ("Fatima Khan", "mum", 55, 1265, 21, ["Streak keeper", "Night owl"]), ("Nikhil Bora", "gau", 49, 1190, 9, ["Monsoon hero"]),
    ("Meera Iyer", "blr", 47, 1102, 7, ["Zero spoil"]), ("Karthik Venkat", "che", 44, 1035, 14, ["Streak keeper"]),
    ("Ananya Das", "kol", 41, 980, 5, ["Monsoon hero"]), ("Rohan Mishra", "pat", 39, 944, 11, ["Monsoon hero"]),
    ("Sneha Patil", "pun", 36, 870, 6, ["Night owl"]), ("Imran Ali", "lko", 33, 812, 4, ["First mile"]),
    ("Divya Menon", "koc", 30, 760, 8, ["Zero spoil"]), ("Rahul Mehta", "ahm", 28, 705, 3, ["First mile"]),
    ("Vikram Singh", "jai", 25, 650, 2, ["First mile"]), ("Sana Qureshi", "hyd", 22, 598, 6, ["Night owl"]),
]
BWG_NAMES = [("Hotel Meghdoot", "Hotel"), ("Royal Palms Banquets", "Banquet hall"), ("University mess hall", "Hostel mess"),
             ("City General Hospital kitchen", "Hospital"), ("Tech Park cafeteria", "Corporate cafeteria"),
             ("Shubh Vivah Hall", "Banquet hall"), ("Annapurna Caterers", "Caterer"), ("Metro Food Court", "Food court"),
             ("Saffron Events", "Caterer")]
ACTIVE = ("listed", "matched", "picked")


def now():
    return timezone.now()


def ms(dt):
    return int(dt.timestamp() * 1000) if dt else None


def pick_w(pairs):
    total = sum(w for _, w in pairs)
    x = rng.uniform(0, total)
    for v, w in pairs:
        x -= w
        if x <= 0:
            return v
    return pairs[-1][0]


def state():
    st, _ = SimState.objects.get_or_create(pk=1)
    return st


def add_event(type_, text, city_code=""):
    Event.objects.create(type=type_, text=text[:300], city_code=city_code)


def add_streams(target, st):
    for k in ("people", "feed", "wet", "dry", "landfill"):
        target[k] = target.get(k, 0) + st.get(k, 0)
    return target


# ---------------------------------------------------------------- batches
def next_code():
    SimState.objects.filter(pk=1).update(seq=F("seq") + 1)
    return f"KB-{SimState.objects.values_list('seq', flat=True).get(pk=1)}"


def make_batch(city, age_ms=0, over=None, owner=None):
    name, veg, al = rng.choice(FOODS)
    t = now()
    d = dict(food=name, veg=bool(veg), allergens=al, donor=rng.choice(DONORS), kg=rng.randint(6, 58),
             hours=rng.uniform(.3, 5.2), temp_c=rng.choice([66, 63, 61, 58, 42, 31, 4, 3]),
             packaging=pick_w([("Sealed", .45), ("Covered", .4), ("Open", .15)]),
             checks=pick_w([(4, .6), (3, .28), (2, .12)]), cat="veg" if veg else "nonveg", servings=None)
    if over:
        d.update(over)
    d["servings"] = d["servings"] or jround(d["kg"] * 2.5)
    score, grade, factors = score_batch(d["hours"], d["temp_c"], d["packaging"], d["checks"], d["cat"])
    streams = compute_streams(d["kg"], d["packaging"], d["cat"], grade, d["veg"])
    shelf_min = rng.uniform(150, 290) if grade == "A" else rng.uniform(60, 140) if grade == "B" else rng.uniform(20, 55)
    created = t - timedelta(milliseconds=age_ms)
    shelf_ms = int(shelf_min * 60000)
    b = Batch.objects.create(
        code=next_code(), city=city, owner=owner, score=score, grade=grade, factors=factors, streams=streams,
        shelf_ms=shelf_ms, created_at=created, expires_at=created + timedelta(milliseconds=shelf_ms),
        log=[{"s": "listed", "t": ms(created)}, {"s": "graded", "t": ms(created) + 40000}], **d)
    st = state()
    st.grades[grade] = st.grades.get(grade, 0) + 1
    st.save(update_fields=["grades"])
    return b


def matches(b, receivers=None, surge=None):
    surge = state().surge if surge is None else surge
    recs = receivers if receivers is not None else list(b.city.receivers.all())
    out = []
    for r in recs:
        if not eligible(b.grade, b.veg, r.type, r.veg_only):
            continue
        m = match_score(b.grade, b.veg, b.servings, r.dist_km, r.urgency, r.capacity, r.veg_only, r.type, surge)
        m["r"] = r
        out.append(m)
    return sorted(out, key=lambda m: -m["score"])[:3]


def pick_volunteer(city_code, not_name=None):
    local = list(Volunteer.objects.filter(city_id=city_code, user__isnull=True).exclude(name=not_name or "").values_list("name", flat=True))
    if local and rng.random() < .55:
        return rng.choice(local)
    while True:
        n = f"{rng.choice(FIRST)} {chr(65 + rng.randint(0, 20))}."
        if n != not_name:
            return n


def assign(b, rec, auto=False, vol_name=None, vol_user=None):
    t = now()
    b.status, b.receiver = "matched", rec
    b.volunteer = vol_name or pick_volunteer(b.city_id)
    b.volunteer_user = vol_user
    b.eta = jround(rec.dist_km * 3 + 6)
    b.pick_at = None if vol_user else t + timedelta(seconds=rng.uniform(14, 24))
    b.no_resp = False if vol_user else rng.random() < .14
    b.log = [x for x in b.log if x["s"] in ("listed", "graded")] + [{"s": "matched", "t": ms(t)}]
    b.save()
    Receiver.objects.filter(pk=rec.pk).update(capacity=max(0, rec.capacity - b.servings))
    add_event("match", f"{b.code} matched to {rec.name}, {b.city.name}{' by auto-dispatch' if auto else ''}. {b.volunteer} is on the way.", b.city_id)


def pickup(b, manual=False):
    t = now()
    b.status, b.no_resp = "picked", False
    b.log = b.log + [{"s": "sanitised", "t": ms(t) - 40000}, {"s": "picked", "t": ms(t)}]
    b.drop_at = None if b.volunteer_user_id else t + timedelta(seconds=rng.uniform(16, 26))
    b.save()
    add_event("match", f"{b.volunteer} picked up {b.code} ({b.kg} kg) at {b.donor}. Probe reads {b.temp_c} °C.", b.city_id)


def deliver(b):
    t = now()
    city = b.city
    b.status, b.delivered_at, b.done_at = "delivered", t, t
    b.log = b.log + [{"s": "delivered", "t": ms(t)}]
    b.save()
    rec = b.receiver
    people = rec is not None and rec.type in ("people", "relief")
    st = SimState.objects.select_for_update().get(pk=1)
    if people:
        st.meals_total += b.servings
        City.objects.filter(pk=city.pk).update(meals=F("meals") + b.servings)
        city.refresh_from_db(fields=["need"])
        City.objects.filter(pk=city.pk).update(need=max(0, city.need - b.servings))
        add_event("deliver", f"{b.servings} meals delivered to {rec.name}, {city.name}.", city.pk)
    else:
        add_event("deliver", f"{b.kg} kg sent to {rec.name if rec else 'compost'}, {city.name}. Nothing went to landfill.", city.pk)
    st.kg_total += b.kg
    s2 = dict(b.streams)
    if rec and rec.type == "compost":
        s2["wet"] += s2["feed"]
        s2["feed"] = 0
    add_streams(st.streams, s2)
    st.save(update_fields=["meals_total", "kg_total", "streams"])
    v = Volunteer.objects.filter(user_id=b.volunteer_user_id).first() if b.volunteer_user_id else Volunteer.objects.filter(name=b.volunteer).first()
    if v:
        Volunteer.objects.filter(pk=v.pk).update(deliveries=F("deliveries") + 1, credits=F("credits") + 10 + jround(b.kg / 2))


def compost(b):
    t = now()
    b.status, b.done_at = "composted", t
    b.log = b.log + [{"s": "composted", "t": ms(t)}]
    b.save()
    add_event("warn", f"{b.code} passed its safe window. Sent to GreenCycle compost unit, {b.city.name}.", b.city_id)
    st = SimState.objects.select_for_update().get(pk=1)
    st.kg_total += b.kg
    add_streams(st.streams, {"wet": b.kg - b.streams.get("dry", 0), "dry": b.streams.get("dry", 0)})
    st.save(update_fields=["kg_total", "streams"])


def mark_unsafe(b):
    t = now()
    b.grade, b.score = "C", min(b.score, 42)
    b.streams = compute_streams(b.kg, b.packaging, b.cat, "C", b.veg)
    b.shelf_ms = min(b.shelf_ms, 45 * 60000)
    b.expires_at = min(b.expires_at, t + timedelta(minutes=45))
    b.save()
    add_event("warn", f"{b.code} marked unsafe by the coordinator. Rerouting to an animal shelter or compost.", b.city_id)


def active_user_cities(minutes=120):
    from accounts.models import User
    since = now() - timedelta(minutes=minutes)
    return list(User.objects.filter(last_login__gte=since).values_list("city", flat=True).distinct())


def spawn():
    hot = active_user_cities()
    code = rng.choice(hot) if hot and rng.random() < .3 else pick_w([(c, w) for c, _, w, _ in CITIES])
    city = City.objects.get(pk=code)
    b = make_batch(city)
    add_event("new", f"{b.donor} listed {b.food.lower()}, {b.kg} kg in {city.name}. Graded {b.grade}.", city.pk)
    return b


# ---------------------------------------------------------------- the clock
def tick(force=False):
    """Advance the network once. Safe to call from many processes: the SimState row lock
    serialises ticks, and the 1.5 s guard makes extra calls no-ops."""
    with transaction.atomic():
        st = SimState.objects.select_for_update().get(pk=1)
        t = now()
        if not force and st.last_tick and (t - st.last_tick).total_seconds() < 1.5:
            return False
        st.last_tick = t
        st.save(update_fields=["last_tick"])
        auto = st.auto

        for b in Batch.objects.select_related("city", "receiver").filter(status__in=ACTIVE):
            if b.volunteer_user_id and b.status in ("matched", "picked"):
                continue  # a real volunteer controls this pickup
            if b.status == "listed":
                if t >= b.expires_at:
                    compost(b)
                elif auto and (t - b.created_at).total_seconds() > (6 if b.owner_id else 22):
                    m = matches(b)
                    if m:
                        assign(b, m[0]["r"], auto=True)
            elif b.status == "matched" and b.pick_at and t >= b.pick_at:
                if b.no_resp:
                    old = b.volunteer
                    b.volunteer, b.no_resp = pick_volunteer(b.city_id, old), False
                    b.pick_at = t + timedelta(seconds=rng.uniform(10, 16))
                    b.save()
                    add_event("fail", f"No response from {old} in 6 min. Reassigned {b.code} to {b.volunteer}.", b.city_id)
                else:
                    pickup(b)
            elif b.status == "picked" and b.drop_at and t >= b.drop_at:
                deliver(b)

        for b in Batch.objects.filter(status="delivered", rating__isnull=True, delivered_at__lt=t - timedelta(seconds=6)):
            b.rating = rng.choice([4, 4.5, 5, 5, 5])
            b.log = b.log + [{"s": "rated", "t": ms(t)}]
            b.save(update_fields=["rating", "log"])

        # keep the live feed short; users' own batches stay for their history
        Batch.objects.filter(status__in=("delivered", "composted"), done_at__lt=t - timedelta(seconds=50),
                             owner__isnull=True, volunteer_user__isnull=True, receiver__owner__isnull=True).delete()
        Event.objects.filter(pk__in=Event.objects.order_by("-created_at", "-id").values_list("pk", flat=True)[200:]).delete()

        # ward teams act on citizen reports unless a municipal officer is handling that city
        from accounts.models import User
        busy = set(active_user_cities(30)) & set(User.objects.filter(kind="ulb").values_list("city", flat=True))
        for r in Report.objects.filter(manual=False, status__in=("new", "assigned")).exclude(city_id__in=busy):
            if r.status == "new" and (t - r.created_at).total_seconds() > 25:
                r.status, r.t2 = "assigned", t
                r.save(update_fields=["status", "t2"])
            elif r.status == "assigned" and (t - (r.t2 or r.created_at)).total_seconds() > 40:
                r.status = "cleared"
                r.save(update_fields=["status"])

        active = Batch.objects.filter(status__in=ACTIVE).count()
        if active < 34 and (not st.last_spawn or (t - st.last_spawn).total_seconds() >= 4):
            spawn()
            st.last_spawn = t
        if not st.last_periodic or (t - st.last_periodic).total_seconds() >= 9:
            st.pickup_median = clamp(st.pickup_median + rng.randint(-1, 1), 18, 28)
            for c in City.objects.all():
                if rng.random() < .35:
                    c.need += rng.randint(4, 40 if c.relief and st.surge else 18)
                c.vols = clamp(c.vols + rng.randint(-1, 1), 6, 70)
                c.save(update_fields=["need", "vols"])
            st.last_periodic = t
        st.save(update_fields=["last_spawn", "last_periodic", "pickup_median"])
    return True


def maybe_tick():
    if settings.KB_LAZY_TICK:
        tick()


# ---------------------------------------------------------------- seeding
def seed(reset=False):
    """Create the 18-city network. Idempotent unless reset=True."""
    with transaction.atomic():
        if reset:
            for m in (Batch, Event, Report, BulkGenerator):
                m.objects.all().delete()
            Volunteer.objects.filter(user__isnull=True).delete()
            Receiver.objects.filter(owner__isnull=True).delete()
            SimState.objects.all().delete()
        if City.objects.filter(receivers__owner__isnull=True).exists():
            return False
        st = state()
        for i, (code, name, w, relief) in enumerate(CITIES):
            c, _ = City.objects.update_or_create(code=code, defaults=dict(
                name=name, weight=w, relief=relief, order=i, meals=jround(w * rng.uniform(255, 330)),
                need=jround(rng.uniform(520, 880) if relief else rng.uniform(60, 420)), vols=jround(w * rng.uniform(18, 42))))
            for n in rng.sample(PEOPLE_RECV, 4):
                Receiver.objects.create(city=c, name=n, type="people", dist_km=rng.uniform(1.4, 13.5), urgency=rng.uniform(.3, .95),
                                        capacity=rng.randint(60, 380), veg_only=rng.random() < .3,
                                        slot=rng.choice(["12:30 to 2 pm", "1 to 3 pm", "7 to 9 pm", "8 to 10 pm"]))
            if relief:
                Receiver.objects.create(city=c, name=f"Flood relief camp, Ward {rng.randint(3, 19)}", type="relief",
                                        dist_km=rng.uniform(6, 16), urgency=rng.uniform(.8, .95), capacity=rng.randint(400, 900))
            Receiver.objects.create(city=c, name="Karuna Animal Shelter", type="animal", dist_km=rng.uniform(3, 12),
                                    urgency=rng.uniform(.4, .7), capacity=rng.randint(80, 200))
            Receiver.objects.create(city=c, name="GreenCycle compost unit", type="compost", dist_km=rng.uniform(5, 15),
                                    urgency=.3, capacity=999)
            r = random.Random(sum(ord(ch) * 31 ** k for k, ch in enumerate(code)))
            for j, (bn, bt) in enumerate(BWG_NAMES):
                status = "missing" if j == 3 else "due" if j == 6 else "valid"
                BulkGenerator.objects.create(city=c, name=bn, type=bt, kg_per_day=jround(100 + r.random() * 320), order=j,
                                             diverted=jround(55 + r.random() * 20) if status == "missing" else jround(94 + r.random() * 6),
                                             status=status, reg=str(13300000000000 + int(r.random() * 99999999999)))
        for n, c, d, cr, s, badges in VOLS:
            if not Volunteer.objects.filter(name=n, city_id=c).exists():
                Volunteer.objects.create(name=n, city_id=c, deliveries=d, credits=cr, streak=s, badges=badges, online=rng.random() < .62)
        st.meals_total = sum(City.objects.values_list("meals", flat=True))
        st.kg_total = st.meals_total * .4
        kg = st.kg_total
        st.streams = {"people": kg * .84, "feed": kg * .05, "wet": kg * .08, "dry": kg * .03, "landfill": 0}
        st.grades = {"A": 0, "B": 0, "C": 0}
        st.save()
        cities = list(City.objects.all())
        for _ in range(24):
            c = pick_w([(x, x.weight) for x in cities])
            b = make_batch(c, age_ms=rng.uniform(5000, 300000))
            roll = rng.random()
            if roll > .45:
                m = matches(b)
                if m:
                    rec = m[0]["r"]
                    b.status, b.receiver, b.volunteer = "matched", rec, pick_volunteer(c.code)
                    b.eta = jround(rec.dist_km * 3 + 6)
                    b.log = b.log + [{"s": "matched", "t": ms(b.created_at) + 90000}]
                    b.pick_at = now() + timedelta(seconds=rng.uniform(4, 30))
                    if roll > .72:
                        b.status = "picked"
                        b.log = b.log + [{"s": "sanitised", "t": ms(b.created_at) + 560000}, {"s": "picked", "t": ms(b.created_at) + 600000}]
                        b.drop_at = now() + timedelta(seconds=rng.uniform(5, 40))
                    b.save()
        for i, (ty, text) in enumerate(reversed([
            ("deliver", "180 meals delivered to Aasra Night Shelter, Delhi."),
            ("fail", "No response from Deepak K. in 6 min. Reassigned to Priya Sharma."),
            ("new", "Royal Palms Banquets listed wedding buffet mix, 44 kg in Mumbai. Graded A."),
            ("match", "KB-2391 matched to Flood relief camp, Guwahati. Nikhil Bora is on the way."),
            ("warn", "KB-2388 passed its safe window. Sent to GreenCycle compost unit, Pune."),
            ("deliver", "96 meals delivered to Seva Sadan Kitchen, Hyderabad."),
            ("new", "Sunrise Bakery listed bread loaves, 12 kg in Bengaluru. Graded A."),
        ])):
            add_event(ty, text)
    return True


def ensure_seeded():
    if not City.objects.exists():
        seed()


# ---------------------------------------------------------------- per-user hooks
def next_report_code():
    SimState.objects.filter(pk=1).update(report_seq=F("report_seq") + 1)
    return f"HS-{SimState.objects.values_list('report_seq', flat=True).get(pk=1)}"


def seed_reports(city_code):
    if Report.objects.filter(city_id=city_code).exists():
        return
    t = now()
    for type_, where, status, ago in [("Food dumped in the open", "Behind the vegetable market", "new", 9),
                                      ("Overflowing bin", "Near the bus depot", "assigned", 34),
                                      ("Unsegregated waste at an event", "Community hall, Sector 4", "new", 17),
                                      ("Dirty community fridge", "Outside the metro station", "cleared", 120)]:
        Report.objects.create(code=next_report_code(), type=type_, where=where, city_id=city_code, status=status,
                              created_at=t - timedelta(minutes=ago), t2=t - timedelta(minutes=ago / 2))


def seed_incoming(user, rec):
    people = rec.type in ("people", "relief")
    good = dict(hours=.8, temp_c=63, packaging="Sealed", checks=4, cat="veg", veg=True)
    poor = dict(hours=5.5, temp_c=31, packaging="Open", checks=2, cat="veg", veg=True)
    for i in range(2):
        b = make_batch(rec.city, age_ms=rng.uniform(60000, 240000), over=good if people else poor)
        assign(b, rec, auto=True)
        if i == 0:
            pickup(b)
            b.drop_at = now() + timedelta(seconds=45)
            b.save(update_fields=["drop_at"])


def on_login(user):
    ensure_seeded()
    with transaction.atomic():
        if user.kind == "receiver":
            o = ORG_TYPES.get(user.org_type, {})
            rec, created = Receiver.objects.get_or_create(owner=user, defaults=dict(
                city_id=user.city, name=user.org_name, type=o.get("rtype", "people"), dist_km=2.3, urgency=.96,
                capacity=user.capacity or 200, unit=o.get("unit", "servings")))
            if not Batch.objects.filter(receiver=rec, status__in=("matched", "picked")).exists():
                seed_incoming(user, rec)
        elif user.kind == "vol":
            if not Volunteer.objects.filter(user=user).exists():
                v = Volunteer.objects.filter(name=user.first_name, city_id=user.city, user__isnull=True).first()
                if v:
                    v.user = user
                    v.save(update_fields=["user"])
                else:
                    Volunteer.objects.create(name=user.first_name, city_id=user.city, user=user, online=True)
        elif user.kind == "ulb":
            seed_reports(user.city)


def on_logout(user):
    """Hand a signed-out volunteer's open pickups back to the network."""
    if not getattr(user, "is_authenticated", False):
        return
    t = now()
    for b in Batch.objects.filter(volunteer_user=user, status__in=("matched", "picked")):
        b.volunteer_user = None
        if b.status == "matched":
            b.pick_at = t + timedelta(seconds=6)
        else:
            b.drop_at = t + timedelta(seconds=9)
        b.save()
