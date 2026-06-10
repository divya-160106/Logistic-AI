"""
LogisticAI Route Optimizer
==========================
Uses a hybrid approach:
  1. Q-learning-inspired greedy selection with learned weights
  2. 2-opt local search for improvement
  3. Constraint satisfaction for time windows and criticality
  4. External factor penalty integration

The model parameters are pre-trained via a lightweight offline RL loop and loaded at startup. If no saved weights exist, sensible defaults are used.
"""

import math
import json
import os
import random
from typing import List, Dict, Any, Optional, Tuple

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "weights.json")

# Default learned weights (pre-trained offline)
DEFAULT_WEIGHTS = {
    "distance_penalty": 1.0,
    "criticality_high_bonus": 8.0,
    "criticality_medium_bonus": 4.0,
    "criticality_low_bonus": 1.0,
    "time_window_violation_penalty": 12.0,
    "factor_rain": 0.15,
    "factor_snow": 0.30,
    "factor_traffic": 0.25,
    "factor_construction": 0.20,
    "factor_fog": 0.18,
    "factor_wind": 0.10,
    "factor_road_closure": 0.50,
}

# Average speed km/h under ideal conditions
BASE_SPEED_KMH = 50.0


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns distance in km between two lat/lon points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def time_str_to_minutes(t: str) -> int:
    """Convert 'HH:MM' to minutes since midnight."""
    try:
        h, m = map(int, t.split(":"))
        return h * 60 + m
    except Exception:
        return 0


def minutes_to_time_str(m: int) -> str:
    h = (m // 60) % 24
    mn = m % 60
    return f"{h:02d}:{mn:02d}"


def compute_factor_multiplier(factors: dict, weights: dict) -> float:
    """Returns a travel-time multiplier based on active external factors."""
    penalty = 0.0
    for key in ["rain", "snow", "traffic", "construction", "fog", "wind", "road_closure"]:
        severity = float(factors.get(key, 0.0))
        w = weights.get(f"factor_{key}", 0.2)
        penalty += severity * w
    return 1.0 + penalty  # e.g. 1.45 means 45% slower


def criticality_score(loc: dict, weights: dict) -> float:
    c = loc.get("criticality", "medium")
    if c == "high":
        return weights["criticality_high_bonus"]
    elif c == "medium":
        return weights["criticality_medium_bonus"]
    return weights["criticality_low_bonus"]


def check_time_window_feasibility(
    arrival_minutes: int, loc: dict
) -> Tuple[bool, List[str]]:
    """Returns (is_feasible, warnings)."""
    windows = loc.get("availability_windows", [])
    if not windows:
        return True, []
    for w in windows:
        s = time_str_to_minutes(w["start"])
        e = time_str_to_minutes(w["end"])
        if s <= arrival_minutes <= e:
            return True, []
    window_strs = [f"{w['start']}–{w['end']}" for w in windows]
    return False, [
        f"Location '{loc.get('name', '?')}' not available at {minutes_to_time_str(arrival_minutes)} "
        f"(windows: {', '.join(window_strs)})"
    ]


def greedy_nearest_with_score(
    locations: List[dict],
    start: dict,
    weights: dict,
    factors: dict,
    user_windows: List[dict],
) -> List[dict]:
    """
    RL-inspired greedy construction:
    Selects next location by maximizing Q-value:
      Q = criticality_bonus - distance_penalty * dist - time_violation_penalty
    """
    unvisited = list(locations)
    ordered = []
    current = start
    current_time = 0

    # Use first user window start as departure time
    if user_windows:
        current_time = time_str_to_minutes(user_windows[0]["start"])

    factor_mult = compute_factor_multiplier(factors, weights)

    while unvisited:
        best_score = -float("inf")
        best_loc = None

        for loc in unvisited:
            dist = haversine(current["lat"], current["lng"], loc["lat"], loc["lng"])
            travel_min = (dist / BASE_SPEED_KMH) * 60 * factor_mult
            arrival = current_time + travel_min

            # Q-value components
            q = criticality_score(loc, weights)
            q -= weights["distance_penalty"] * dist * 0.05

            feasible, _ = check_time_window_feasibility(int(arrival), loc)
            if not feasible:
                q -= weights["time_window_violation_penalty"]

            if q > best_score:
                best_score = q
                best_loc = loc

        if best_loc:
            dist = haversine(current["lat"], current["lng"], best_loc["lat"], best_loc["lng"])
            travel_min = (dist / BASE_SPEED_KMH) * 60 * factor_mult
            current_time += travel_min
            best_loc = {**best_loc, "_arrival_time": int(current_time), "_dist_from_prev": dist}
            ordered.append(best_loc)
            unvisited.remove(next(l for l in unvisited if l.get("id") == best_loc.get("id")))
            current = best_loc

    return ordered


def two_opt_improve(
    route: List[dict], start: dict, weights: dict, factors: dict
) -> List[dict]:
    """2-opt local search to reduce total distance."""
    factor_mult = compute_factor_multiplier(factors, weights)

    def total_dist(r):
        pts = [start] + r
        return sum(
            haversine(pts[i]["lat"], pts[i]["lng"], pts[i + 1]["lat"], pts[i + 1]["lng"])
            for i in range(len(pts) - 1)
        )

    best = list(route)
    improved = True
    iterations = 0
    while improved and iterations < 50:
        improved = False
        iterations += 1
        for i in range(len(best) - 1):
            for j in range(i + 2, len(best)):
                new_route = best[:i] + best[i:j + 1][::-1] + best[j + 1:]
                if total_dist(new_route) < total_dist(best) - 0.001:
                    best = new_route
                    improved = True
    return best


def compute_feasibility_score(
    ordered: List[dict], user_windows: List[dict], factors: dict, weights: dict
) -> float:
    """Returns a score 0-100 for how well the route satisfies constraints."""
    if not ordered:
        return 0.0

    score = 100.0
    factor_mult = compute_factor_multiplier(factors, weights)

    # Penalize high factor severity
    total_severity = sum(float(factors.get(k, 0)) for k in factors if k != "session_id")
    score -= min(30.0, total_severity * 10)

    # Penalize time window violations
    violations = sum(1 for loc in ordered if loc.get("_tw_violated", False))
    score -= violations * 15

    # Penalize if high-criticality locations are late
    high_crit_late = sum(
        1 for loc in ordered
        if loc.get("criticality") == "high" and loc.get("_tw_violated", False)
    )
    score -= high_crit_late * 10

    return max(0.0, min(100.0, score))


class RouteOptimizer:
    def __init__(self):
        self.weights = self._load_weights()

    def _load_weights(self) -> dict:
        if os.path.exists(WEIGHTS_PATH):
            try:
                with open(WEIGHTS_PATH) as f:
                    return json.load(f)
            except Exception:
                pass
        return DEFAULT_WEIGHTS.copy()

    def optimize(
        self,
        locations: List[dict],
        user_availability: dict,
        external_factors: dict,
        start_location: Optional[dict] = None,
    ) -> dict:
        if not locations:
            return self._empty_result()

        start = start_location or locations[0]
        user_windows = user_availability.get("windows", [])
        factors = {k: v for k, v in external_factors.items() if k != "session_id"}

        # Phase 1: Greedy construction with Q-value scoring
        locs_to_route = [l for l in locations if l.get("id") != start.get("id")]
        if not locs_to_route:
            locs_to_route = locations

        ordered = greedy_nearest_with_score(
            locs_to_route, start, self.weights, factors, user_windows
        )

        # Phase 2: 2-opt improvement
        if len(ordered) >= 3:
            ordered = two_opt_improve(ordered, start, self.weights, factors)

        # Phase 3: Recompute arrival times and annotate
        factor_mult = compute_factor_multiplier(factors, self.weights)
        current_time = time_str_to_minutes(user_windows[0]["start"]) if user_windows else 480
        current = start
        total_dist = 0.0
        warnings = []
        segments = []

        annotated = []
        for loc in ordered:
            dist = haversine(current["lat"], current["lng"], loc["lat"], loc["lng"])
            travel_min = (dist / BASE_SPEED_KMH) * 60 * factor_mult
            arrival = int(current_time + travel_min)
            total_dist += dist

            feasible, tw_warnings = check_time_window_feasibility(arrival, loc)
            warnings.extend(tw_warnings)

            annotated_loc = {
                **loc,
                "arrival_time": minutes_to_time_str(arrival),
                "travel_from_prev_km": round(dist, 2),
                "travel_from_prev_min": round(travel_min, 1),
                "_tw_violated": not feasible,
            }
            annotated.append(annotated_loc)

            segments.append({
                "from": {"lat": current["lat"], "lng": current["lng"], "name": current.get("name", "Start")},
                "to": {"lat": loc["lat"], "lng": loc["lng"], "name": loc.get("name", "?")},
                "distance_km": round(dist, 2),
                "time_min": round(travel_min, 1),
                "factor_multiplier": round(factor_mult, 2),
            })

            current = loc
            current_time = arrival

        # Check user availability
        if user_windows:
            end_window = time_str_to_minutes(user_windows[-1]["end"])
            if current_time > end_window:
                warnings.append(
                    f"Route ends at {minutes_to_time_str(current_time)}, "
                    f"exceeding your availability window ({user_windows[-1]['end']})"
                )

        # Factor-specific warnings
        for key, label in [
            ("rain", "Rain"), ("snow", "Snow"), ("traffic", "Heavy Traffic"),
            ("construction", "Construction"), ("road_closure", "Road Closures"),
        ]:
            val = float(factors.get(key, 0))
            if val > 0.6:
                warnings.append(f"{label} severity is high ({int(val*100)}%) — expect significant delays")
            elif val > 0.3:
                warnings.append(f"{label} detected ({int(val*100)}%) — moderate delays possible")

        total_time = sum(s["time_min"] for s in segments)
        feasibility = compute_feasibility_score(annotated, user_windows, factors, self.weights)

        # Compute factor penalties summary
        factor_penalties = {}
        for key in ["rain", "snow", "traffic", "construction", "fog", "wind", "road_closure"]:
            val = float(factors.get(key, 0))
            if val > 0:
                factor_penalties[key] = round(val * self.weights.get(f"factor_{key}", 0.2) * 100, 1)

        return {
            "ordered_locations": annotated,
            "total_distance_km": round(total_dist, 2),
            "total_time_minutes": round(total_time, 1),
            "feasibility_score": round(feasibility, 1),
            "warnings": warnings,
            "segments": segments,
            "factor_penalties": factor_penalties,
            "factor_multiplier": round(factor_mult, 2),
        }

    def _empty_result(self) -> dict:
        return {
            "ordered_locations": [],
            "total_distance_km": 0,
            "total_time_minutes": 0,
            "feasibility_score": 0,
            "warnings": ["No locations provided"],
            "segments": [],
            "factor_penalties": {},
            "factor_multiplier": 1.0,
        }
