"""Pure, side-effect-free KindBytes rules. Unit-tested in core/tests.py and mirrored in the
browser (frontend/src/js/app.js) only for the live preview while a donor fills in a listing."""
import math


def jround(x):
    """JavaScript Math.round semantics (half up), so server and browser agree exactly."""
    return int(math.floor(x + 0.5))


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


PACK_POINTS = {"Sealed": 15, "Covered": 10, "Open": 3}


def score_batch(hours, temp_c, packaging, checks, cat):
    """Safety score 0-100 = freshness 40 + temperature 30 + packaging 15 + hygiene 15."""
    stable = cat in ("raw", "bakery")
    safe_temp = stable or temp_c >= 60 or temp_c <= 5
    fresh = max(0, 40 - min(40, hours * (3 if stable else 8)))
    temp = 30 if safe_temp else (5 if hours > 2 else 15)
    pack = PACK_POINTS.get(packaging, 10)
    hand = jround(checks / 4 * 15)
    score = jround(fresh + temp + pack + hand)
    grade = "A" if score >= 75 else "B" if score >= 50 else "C"
    return score, grade, {"fresh": jround(fresh), "temp": temp, "pack": pack, "hand": hand}


def compute_streams(kg, packaging, cat, grade, veg):
    """Four-stream segregation at source (SWM Rules 2026). Landfill is always zero."""
    dry = kg * (0.02 if packaging == "Open" else 0.06 if packaging == "Sealed" else 0.045)
    trim = kg * (0.14 if cat == "raw" else 0.02 if cat == "bakery" else 0.04)
    rest = max(0, kg - dry - trim)
    if grade == "C":
        feed = rest * 0.6 if veg else 0
        return {"people": 0, "feed": feed, "wet": rest - feed + trim, "dry": dry, "landfill": 0}
    return {"people": rest, "feed": 0, "wet": trim, "dry": dry, "landfill": 0}


def eligible(grade, veg, rtype, veg_only):
    if grade == "C":
        return rtype == "compost" if not veg else rtype in ("animal", "compost")
    if rtype not in ("people", "relief"):
        return False
    return veg or not veg_only


def match_score(grade, veg, servings, dist_km, urgency, capacity, veg_only, rtype, surge):
    """Match score = distance 35% + need 30% + capacity 20% + diet fit 15% (+8 for relief in surge)."""
    dist = clamp(1 - dist_km / (12 if grade == "B" else 16), 0, 1)
    need = min(1, urgency + 0.35) if surge and rtype == "relief" else urgency
    cap = clamp(capacity / max(servings, 1), 0, 1)
    diet = 1 if grade == "C" else (1 if veg_only else (1 if veg else 0.8))
    score = jround(100 * (0.35 * dist + 0.30 * need + 0.20 * cap + 0.15 * diet)) + (8 if surge and rtype == "relief" else 0)
    return {"dist": dist, "need": need, "cap": cap, "diet": diet, "score": min(99, score)}
