from django.conf import settings
from django.db import models

STATUS = [("listed", "Waiting for a match"), ("matched", "Volunteer on the way"), ("picked", "In transit"),
          ("delivered", "Delivered"), ("composted", "Sent to compost")]
RECEIVER_TYPES = [("people", "Shelter or kitchen"), ("relief", "Relief camp"), ("animal", "Animal shelter"), ("compost", "Compost unit")]


class SimState(models.Model):
    """Singleton (pk=1): global counters and switches for the live dispatch network."""
    surge = models.BooleanField(default=False)
    auto = models.BooleanField(default=True)
    meals_total = models.IntegerField(default=0)
    kg_total = models.FloatField(default=0)
    pickup_median = models.IntegerField(default=23)
    streams = models.JSONField(default=dict)
    grades = models.JSONField(default=dict)
    seq = models.IntegerField(default=2400)
    report_seq = models.IntegerField(default=310)
    last_tick = models.DateTimeField(null=True, blank=True)
    last_spawn = models.DateTimeField(null=True, blank=True)
    last_periodic = models.DateTimeField(null=True, blank=True)


class City(models.Model):
    code = models.CharField(max_length=4, primary_key=True)
    name = models.CharField(max_length=40)
    weight = models.FloatField(default=1)
    relief = models.BooleanField(default=False)
    meals = models.IntegerField(default=0)
    need = models.IntegerField(default=0)
    vols = models.IntegerField(default=0)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        verbose_name_plural = "cities"

    def __str__(self):
        return self.name


class Receiver(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="receivers")
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=10, choices=RECEIVER_TYPES)
    dist_km = models.FloatField()
    urgency = models.FloatField()
    capacity = models.IntegerField()
    veg_only = models.BooleanField(default=False)
    unit = models.CharField(max_length=10, blank=True)
    slot = models.CharField(max_length=20, blank=True)
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="receiver")

    def __str__(self):
        return f"{self.name} ({self.city_id})"


class Volunteer(models.Model):
    name = models.CharField(max_length=80)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="volunteers")
    deliveries = models.IntegerField(default=0)
    credits = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    badges = models.JSONField(default=list, blank=True)
    online = models.BooleanField(default=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="volunteer")

    class Meta:
        ordering = ["-credits"]

    def __str__(self):
        return self.name


class Batch(models.Model):
    code = models.CharField(max_length=12, unique=True)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="batches")
    donor = models.CharField(max_length=120)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="listings")
    food = models.CharField(max_length=120)
    cat = models.CharField(max_length=10, default="veg")
    veg = models.BooleanField(default=True)
    allergens = models.JSONField(default=list, blank=True)
    kg = models.IntegerField()
    servings = models.IntegerField()
    hours = models.FloatField()
    temp_c = models.IntegerField()
    packaging = models.CharField(max_length=10)
    checks = models.IntegerField()
    score = models.IntegerField()
    grade = models.CharField(max_length=1)
    factors = models.JSONField(default=dict)
    streams = models.JSONField(default=dict)
    shelf_ms = models.BigIntegerField()
    created_at = models.DateTimeField(db_index=True)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS, default="listed", db_index=True)
    receiver = models.ForeignKey(Receiver, null=True, blank=True, on_delete=models.SET_NULL, related_name="batches")
    volunteer = models.CharField(max_length=80, blank=True)
    volunteer_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="pickups")
    pick_at = models.DateTimeField(null=True, blank=True)
    drop_at = models.DateTimeField(null=True, blank=True)
    done_at = models.DateTimeField(null=True, blank=True, db_index=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    eta = models.IntegerField(null=True, blank=True)
    rating = models.FloatField(null=True, blank=True)
    no_resp = models.BooleanField(default=False)
    log = models.JSONField(default=list)
    dist_for = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "batches"

    def __str__(self):
        return f"{self.code} {self.food} ({self.status})"


class Event(models.Model):
    type = models.CharField(max_length=10)
    text = models.CharField(max_length=300)
    city_code = models.CharField(max_length=4, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class Report(models.Model):
    STATUS = [("new", "Sent to ward team"), ("assigned", "Team on the way"), ("cleared", "Cleared")]
    code = models.CharField(max_length=10, unique=True)
    type = models.CharField(max_length=60)
    where = models.CharField(max_length=160)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="reports")
    status = models.CharField(max_length=10, choices=STATUS, default="new")
    created_at = models.DateTimeField()
    t2 = models.DateTimeField(null=True, blank=True)
    by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reports")
    has_photo = models.BooleanField(default=False)
    manual = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]


class BulkGenerator(models.Model):
    """Bulk waste generators (>=100 kg/day) tracked for SWM Rules 2026 compliance."""
    STATUS = [("valid", "Valid"), ("due", "Due in 3 days"), ("missing", "Missing"), ("sent", "Notice sent")]
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="bulk_generators")
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=40)
    kg_per_day = models.IntegerField()
    diverted = models.IntegerField()
    status = models.CharField(max_length=10, choices=STATUS, default="valid")
    reg = models.CharField(max_length=20)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["city", "order"]
