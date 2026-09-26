import json

from django.test import TestCase, override_settings

from accounts.models import User
from core import sim
from core.engine import compute_streams, jround, match_score, score_batch
from core.models import Batch, City, Receiver, Report, SimState


class EngineTests(TestCase):
    def test_grades(self):
        # fresh, hot, sealed, all checks -> A with a perfect score
        self.assertEqual(score_batch(0, 63, "Sealed", 4, "veg")[:2], (100, "A"))
        # 5.5 h in the danger zone, open, 2 checks -> C
        self.assertEqual(score_batch(5.5, 31, "Open", 2, "veg")[1], "C")
        # bakery is shelf-stable: room temperature is not penalised
        self.assertEqual(score_batch(1.5, 30, "Covered", 4, "bakery")[1], "A")

    def test_weights_sum(self):
        score, grade, f = score_batch(1, 63, "Covered", 3, "veg")
        self.assertEqual(score, f["fresh"] + f["temp"] + f["pack"] + f["hand"])

    def test_streams_never_landfill(self):
        for grade in "ABC":
            st = compute_streams(40, "Sealed", "veg", grade, True)
            self.assertEqual(st["landfill"], 0)
            self.assertAlmostEqual(sum(st.values()), 40)
        self.assertEqual(compute_streams(40, "Open", "nonveg", "C", False)["feed"], 0)  # no non-veg animal feed

    def test_match_score_bounds_and_js_rounding(self):
        m = match_score("A", True, 50, 0, 1, 1000, False, "relief", True)
        self.assertEqual(m["score"], 99)
        self.assertEqual(jround(2.5), 3)  # JS Math.round, not banker's rounding


class FlowTests(TestCase):
    def setUp(self):
        sim.seed()

    def post(self, url, data):
        return self.client.post(url, json.dumps(data), content_type="application/json")

    def signup(self, **kw):
        data = dict(role="org", orgType="restaurant", org="Spice Hub", reg="13622011000999", daily="150",
                    name="Asha Rao", phone="9876500011", email="asha@spicehub.in", city="hyd", area="Madhapur",
                    pw="secret123x", agree=True)
        data.update(kw)
        return self.post("/api/auth/signup/", data)

    def test_seeded_network(self):
        self.assertEqual(City.objects.count(), 18)
        self.assertEqual(Batch.objects.count(), 24)
        r = self.client.get("/api/state/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()["cities"]), 18)
        self.assertIsNone(r.json()["user"])

    def test_signup_validation(self):
        r = self.signup(reg="123", phone="123", email="bad", pw="short", agree=False)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(set(r.json()["errors"]) >= {"reg", "phone", "email", "pw", "agree"}, True)

    def test_individual_needs_no_fssai(self):
        r = self.signup(orgType="individual", reg="", daily="")
        self.assertEqual(r.status_code, 201, r.content)

    def test_donor_lists_and_network_dispatches(self):
        self.assertEqual(self.signup().status_code, 201)
        r = self.post("/api/batches/", dict(food="Veg pulao", cat="veg", kg=30, hours=1, tempC=63, packaging="Sealed", checks=4))
        self.assertEqual(r.status_code, 201)
        b = Batch.objects.get(code=r.json()["id"])
        self.assertEqual((b.grade, b.city_id, b.owner.email), ("A", "hyd", "asha@spicehub.in"))
        self.assertTrue(r.json()["id"] in [x["id"] for x in self.client.get("/api/state/").json()["batches"]])

    def test_duplicate_email_rejected(self):
        self.signup()
        self.client.post("/api/auth/logout/")
        r = self.signup(phone="9876500099")
        self.assertIn("email", r.json()["errors"])

    def test_login_and_logout(self):
        self.signup()
        self.client.post("/api/auth/logout/")
        self.assertEqual(self.post("/api/auth/login/", {"ident": "asha@spicehub.in", "pw": "nope1234"}).status_code, 400)
        self.assertEqual(self.post("/api/auth/login/", {"ident": "98765 00011", "pw": "secret123x"}).status_code, 200)
        self.assertEqual(self.client.get("/api/state/").json()["user"]["org"], "Spice Hub")

    def test_volunteer_pickup_with_hygiene_gate(self):
        self.post("/api/auth/demo/", {"key": "vol"})
        b = sim.make_batch(City.objects.get(pk="del"), over=dict(hours=.5, temp_c=63, packaging="Sealed", checks=4, cat="veg", veg=True))
        self.assertEqual(self.post(f"/api/batches/{b.code}/accept/", {}).status_code, 200)
        # pickup refused until all four checks and a probe reading are logged
        self.assertEqual(self.post(f"/api/batches/{b.code}/pickup/", {"checks": [1, 1, 0, 1], "probe": "hot"}).status_code, 400)
        self.assertEqual(self.post(f"/api/batches/{b.code}/pickup/", {"checks": [1, 1, 1, 1], "probe": "hot"}).status_code, 200)
        r = self.post(f"/api/batches/{b.code}/deliver/", {})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(Batch.objects.get(pk=b.pk).status, "delivered")

    def test_danger_zone_probe_reroutes_away_from_people(self):
        self.post("/api/auth/demo/", {"key": "vol"})
        b = sim.make_batch(City.objects.get(pk="del"), over=dict(hours=.5, temp_c=63, packaging="Sealed", checks=4, cat="veg", veg=True))
        self.post(f"/api/batches/{b.code}/accept/", {})
        r = self.post(f"/api/batches/{b.code}/pickup/", {"checks": [1, 1, 1, 1], "probe": "mid"})
        b.refresh_from_db()
        self.assertEqual(b.grade, "C")
        self.assertIn(b.receiver.type, ("animal", "compost"))
        self.assertTrue(r.json()["rerouted"])

    def test_only_ulb_updates_hotspots(self):
        self.post("/api/auth/demo/", {"key": "ulb"})
        rep = Report.objects.filter(city_id="del", status="new").first()
        self.assertEqual(self.post(f"/api/reports/{rep.code}/status/", {"status": "assigned"}).status_code, 200)
        self.client.post("/api/auth/logout/")
        self.post("/api/auth/demo/", {"key": "vol"})
        self.assertEqual(self.post(f"/api/reports/{rep.code}/status/", {"status": "cleared"}).status_code, 403)

    def test_ngo_gets_receiver_and_incoming(self):
        self.post("/api/auth/demo/", {"key": "ngo"})
        rec = Receiver.objects.get(owner__demo_key="ngo")
        self.assertEqual(Batch.objects.filter(receiver=rec).count(), 2)
        self.assertEqual(self.client.get("/api/state/").json()["myRec"]["name"], "Annadaan Community Kitchen")

    def test_tick_is_idempotent_within_window(self):
        sim.tick(force=True)
        self.assertFalse(sim.tick())  # second call within 1.5 s is a no-op

    def test_unauthenticated_actions_blocked(self):
        b = Batch.objects.first()
        self.assertIn(self.post(f"/api/batches/{b.code}/advance/", {}).status_code, (401, 403))

    def test_health_endpoints(self):
        self.assertEqual(self.client.get("/healthz").status_code, 200)
        self.assertEqual(self.client.get("/readyz").json(), {"ok": True})
