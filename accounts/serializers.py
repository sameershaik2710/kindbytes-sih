def user_json(u):
    """Shape expected by the frontend (same keys the original single-file prototype used)."""
    if not u or not u.is_authenticated:
        return None
    return {
        "id": u.pk, "role": u.role, "kind": u.kind, "orgType": u.org_type or None,
        "org": u.org_name, "name": u.first_name, "email": u.email, "phone": u.phone,
        "city": u.city, "area": u.area, "reg": u.reg_no, "daily": u.daily_kg, "cap": u.capacity,
        "vehicle": u.vehicle, "slots": u.slots, "verified": u.verified, "fostac": u.fostac,
        "demo": bool(u.demo_key), "demoKey": u.demo_key or None,
    }
