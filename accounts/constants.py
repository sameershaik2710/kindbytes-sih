"""Sign-up categories and registration-number rules, shared by validation and the UI."""
import re

ORG_TYPES = {
    "restaurant": {"label": "Restaurant", "kind": "donor", "grp": "give"},
    "cafe": {"label": "Cafe or bakery", "kind": "donor", "grp": "give"},
    "hotel": {"label": "Hotel", "kind": "donor", "grp": "give"},
    "banquet": {"label": "Banquet hall or caterer", "kind": "donor", "grp": "give"},
    "mess": {"label": "Hostel, college or corporate mess", "kind": "donor", "grp": "give"},
    "hospital": {"label": "Hospital kitchen", "kind": "donor", "grp": "give"},
    "individual": {"label": "Individual or household", "kind": "donor", "grp": "people", "noReg": True},
    "event": {"label": "Wedding, party or event host", "kind": "donor", "grp": "people", "noReg": True},
    "processor": {"label": "Biogas, compost or recycling unit", "kind": "receiver", "grp": "proc", "rtype": "compost", "unit": "kg"},
    "ulb": {"label": "Urban local body", "kind": "ulb", "grp": "gov"},
    "ngo": {"label": "Shelter or community kitchen", "kind": "receiver", "grp": "ngo", "rtype": "people", "unit": "servings"},
    "home": {"label": "Children’s or elders’ home", "kind": "receiver", "grp": "ngo", "rtype": "people", "unit": "servings"},
    "relief": {"label": "Disaster relief organization", "kind": "receiver", "grp": "ngo", "rtype": "relief", "unit": "servings"},
    "animal": {"label": "Animal shelter or gaushala", "kind": "receiver", "grp": "ngo", "rtype": "animal", "unit": "kg"},
}

REG_RULES = {
    "donor": (re.compile(r"^\d{14}$"), "Enter the 14-digit FSSAI number."),
    "ngo": (re.compile(r"^[A-Za-z]{2}/\d{4}/\d{7}$"), "Use the format DL/2019/0234567."),
    "animal": (re.compile(r"^.{4,}$"), "Enter your registration number."),
    "processor": (re.compile(r"^.{4,}$"), "Enter your authorisation number."),
    "ulb": (re.compile(r"^.{3,}$"), "Enter your ULB code."),
}


def reg_key(org_type):
    if ORG_TYPES[org_type]["kind"] == "donor":
        return "donor"
    return "ngo" if org_type in ("ngo", "home", "relief") else org_type


VEHICLES = ["On foot", "Bicycle", "Two-wheeler", "E-rickshaw", "Car or van"]
SLOTS = ["Mornings", "Afternoons", "Evenings", "Late nights"]
CITY_CODES = ["del", "mum", "blr", "hyd", "che", "kol", "pun", "ahm", "jai", "lko", "pat", "gau", "bbs", "koc", "ngp", "ind", "chd", "viz"]

# One-click demo accounts shown on the login card.
DEMO = {
    "org": dict(role="org", kind="donor", org_type="hotel", org_name="Hotel Meghdoot", first_name="Rakesh Malhotra",
                email="kitchen@meghdoot.example", phone="9810012345", city="del", area="Connaught Place",
                reg_no="13322011000457", daily_kg=140),
    "vol": dict(role="vol", kind="vol", first_name="Priya Sharma", email="priya@example.com", phone="9811123456",
                city="del", area="Karol Bagh", vehicle="Two-wheeler", slots=["Evenings", "Late nights"],
                verified=True, fostac=True),
    "ngo": dict(role="org", kind="receiver", org_type="ngo", org_name="Annadaan Community Kitchen", first_name="Farah Siddiqui",
                email="hello@annadaan.example", phone="9813345678", city="del", area="Daryaganj",
                reg_no="DL/2019/0234567", capacity=260),
    "ulb": dict(role="org", kind="ulb", org_type="ulb", org_name="Municipal corporation, Delhi (demo)", first_name="Rajiv Bansal",
                email="swm@ulb.example", phone="9814456789", city="del", area="Civic Centre", reg_no="ULB-DEL-01"),
}
