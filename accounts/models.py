from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """One account type for everyone. `kind` decides which workspace the user gets."""

    ROLE_CHOICES = [("org", "Organization"), ("vol", "Volunteer")]
    KIND_CHOICES = [("donor", "Food donor"), ("receiver", "Receiver"), ("ulb", "Urban local body"), ("vol", "Volunteer")]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=10, unique=True, null=True, blank=True)
    role = models.CharField(max_length=8, choices=ROLE_CHOICES, default="org")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="donor")
    org_type = models.CharField(max_length=20, blank=True)
    org_name = models.CharField(max_length=120, blank=True)
    reg_no = models.CharField(max_length=40, blank=True)
    daily_kg = models.PositiveIntegerField(null=True, blank=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    city = models.CharField(max_length=4, default="del")
    area = models.CharField(max_length=80, blank=True)
    vehicle = models.CharField(max_length=20, blank=True)
    slots = models.JSONField(default=list, blank=True)
    verified = models.BooleanField(default=False)
    fostac = models.BooleanField(default=False)
    storage = models.BooleanField(default=False)
    demo_key = models.CharField(max_length=10, blank=True)

    @property
    def display_name(self):
        return self.org_name if self.role == "org" else self.first_name

    def __str__(self):
        return f"{self.display_name} <{self.email}>"
