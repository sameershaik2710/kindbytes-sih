import re

from .constants import CITY_CODES, ORG_TYPES, REG_RULES, SLOTS, VEHICLES, reg_key
from .models import User

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def clean_phone(p):
    p = re.sub(r"[\s-]", "", str(p or ""))
    return re.sub(r"^(\+91|91|0)(?=\d{10}$)", "", p)


def validate_signup(data):
    """Server-side mirror of the sign-up form rules. Returns (cleaned, errors keyed by field)."""
    g = lambda k: str(data.get(k) or "").strip()
    role = g("role")
    errs, u = {}, {}
    if role not in ("org", "ngo", "vol"):
        return None, {"_": "Choose an account type."}
    email, phone, pw = g("email").lower(), clean_phone(g("phone")), str(data.get("pw") or "")
    u.update(email=email, username=email, phone=phone, first_name=g("name"), area=g("area"),
             city=g("city") if g("city") in CITY_CODES else "del")
    is_org = role in ("org", "ngo")
    no_reg = False
    if is_org:
        t = g("orgType")
        o = ORG_TYPES.get(t)
        if not o or (role == "ngo" and o["grp"] != "ngo") or (role == "org" and o["grp"] == "ngo"):
            errs["orgType"] = "Choose a valid type."
            o = None
        if o:
            no_reg = bool(o.get("noReg"))
            if len(g("org")) < 2:
                errs["org"] = "Enter the NGO’s name." if role == "ngo" else ("Enter a name NGOs will see." if no_reg else "Enter the business name.")
            reg = re.sub(r"\s", "", g("reg"))
            rx, msg = REG_RULES[reg_key(t)]
            if not no_reg and not rx.match(reg):
                errs["reg"] = msg
            u.update(role="org", kind=o["kind"], org_type=t, org_name=g("org"), reg_no="" if no_reg else reg.upper(),
                     storage=bool(data.get("storage")))
            if o["kind"] == "donor" and not no_reg:
                try:
                    u["daily_kg"] = int(float(g("daily")))
                    assert u["daily_kg"] > 0
                except Exception:
                    errs["daily"] = "Enter an estimate in kg."
            if o["kind"] == "receiver":
                try:
                    u["capacity"] = int(float(g("cap")))
                    assert u["capacity"] > 0
                except Exception:
                    errs["cap"] = "Enter how much you can take."
    else:
        u.update(role="vol", kind="vol", vehicle=g("vehicle"), slots=[s for s in (data.get("slots") or []) if s in SLOTS],
                 fostac=bool(data.get("fostac")), verified=bool(data.get("verified")))
        if u["vehicle"] not in VEHICLES:
            errs["vehicle"] = "Pick how you will travel."
        if not u["slots"]:
            errs["slots"] = "Pick at least one time slot."
        if not data.get("hyg"):
            errs["hyg"] = "Volunteers must agree to the hygiene checklist."
    if len(u["first_name"]) < 2:
        errs["name"] = "Enter the contact person’s name." if is_org and not no_reg else "Enter your full name."
    if not re.match(r"^[6-9]\d{9}$", phone):
        errs["phone"] = "Enter a 10-digit Indian mobile number."
    if not EMAIL_RE.match(email):
        errs["email"] = "Enter a valid email address."
    if len(u["area"]) < 2:
        errs["area"] = "Enter your area or PIN code."
    if len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        errs["pw"] = "Use 8 or more characters with a letter and a number."
    if not data.get("agree"):
        errs["agree"] = "Please confirm to continue."
    if "email" not in errs and User.objects.filter(email=email).exists():
        errs["email"] = "An account with this email already exists. Log in instead."
    if "phone" not in errs and User.objects.filter(phone=phone).exists():
        errs["phone"] = "This mobile number is already registered."
    return u, errs
