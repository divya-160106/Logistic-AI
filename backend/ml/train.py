"""
Offline RL Training Script for LogisticAI
==========================================
Trains routing weights using a simplified Q-learning loop
on synthetically generated routing scenarios.

Run: python train.py

Takes ~30 seconds on CPU. Saves weights.json on completion.
"""

import json
import math
import random
import os

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "weights.json")

# Cities for synthetic data generation
CITY_COORDS = [
    (40.7128, -74.0060),   # New York
    (34.0522, -118.2437),  # Los Angeles
    (41.8781, -87.6298),   # Chicago
    (29.7604, -95.3698),   # Houston
    (33.4484, -112.0740),  # Phoenix
    (39.9526, -75.1652),   # Philadelphia
    (29.4241, -98.4936),   # San Antonio
    (32.7767, -96.7970),   # Dallas
    (30.3322, -81.6557),   # Jacksonville
    (30.2672, -97.7431),   # Austin
]


def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def generate_scenario(n_locs=5):
    """Generate a random routing scenario."""
    indices = random.sample(range(len(CITY_COORDS)), min(n_locs, len(CITY_COORDS)))
    locs = []
    for i, idx in enumerate(indices):
        lat, lng = CITY_COORDS[idx]
        lat += random.uniform(-0.5, 0.5)
        lng += random.uniform(-0.5, 0.5)
        locs.append({
            "id": str(i),
            "lat": lat,
            "lng": lng,
            "criticality": random.choice(["low", "medium", "high"]),
            "availability_windows": [],
            "is_available": True,
        })
    factors = {k: random.uniform(0, 0.5) for k in
               ["rain", "snow", "traffic", "construction", "fog", "wind", "road_closure"]}
    return locs, factors


def route_total_distance(route, start):
    pts = [start] + route
    return sum(
        haversine(pts[i]["lat"], pts[i]["lng"], pts[i + 1]["lat"], pts[i + 1]["lng"])
        for i in range(len(pts) - 1)
    )


def compute_reward(ordered, total_dist, weights):
    """Reward = criticality bonuses - distance penalty."""
    crit_map = {"high": weights["criticality_high_bonus"],
                "medium": weights["criticality_medium_bonus"],
                "low": weights["criticality_low_bonus"]}
    crit_bonus = sum(crit_map.get(l.get("criticality", "medium"), 4) for l in ordered)
    dist_cost = weights["distance_penalty"] * total_dist * 0.1
    return crit_bonus - dist_cost


def greedy_order(locs, start, weights, factors):
    """Greedy ordering by Q-score."""
    unvisited = list(locs)
    ordered = []
    current = start
    factor_mult = 1.0 + sum(
        float(factors.get(k, 0)) * weights.get(f"factor_{k}", 0.2)
        for k in factors
    )

    while unvisited:
        best_score = -float("inf")
        best_loc = None
        for loc in unvisited:
            dist = haversine(current["lat"], current["lng"], loc["lat"], loc["lng"])
            crit_map = {"high": weights["criticality_high_bonus"],
                        "medium": weights["criticality_medium_bonus"],
                        "low": weights["criticality_low_bonus"]}
            q = crit_map.get(loc.get("criticality", "medium"), 4) - weights["distance_penalty"] * dist * 0.05
            if q > best_score:
                best_score = q
                best_loc = loc
        if best_loc:
            ordered.append(best_loc)
            unvisited = [l for l in unvisited if l["id"] != best_loc["id"]]
            current = best_loc
    return ordered


def train(n_episodes=2000, lr=0.05):
    """Q-learning-inspired weight optimization."""
    weights = {
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

    best_reward = -float("inf")
    best_weights = weights.copy()
    epsilon = 0.3  # exploration rate

    print(f"Starting RL training for {n_episodes} episodes...")

    for episode in range(n_episodes):
        locs, factors = generate_scenario(random.randint(3, 8))
        start = locs[0]
        rest = locs[1:]

        # Epsilon-greedy: sometimes random order, sometimes greedy
        if random.random() < epsilon:
            random.shuffle(rest)
            ordered = rest
        else:
            ordered = greedy_order(rest, start, weights, factors)

        dist = route_total_distance(ordered, start)
        reward = compute_reward(ordered, dist, weights)

        # Update weights based on reward signal
        if reward > best_reward:
            best_reward = reward
            best_weights = weights.copy()

        # Perturb weights slightly (policy gradient-like)
        key = random.choice(list(weights.keys()))
        delta = random.gauss(0, 0.1)
        trial_weights = weights.copy()
        trial_weights[key] = max(0.01, trial_weights[key] + delta)

        trial_ordered = greedy_order(rest, start, trial_weights, factors)
        trial_dist = route_total_distance(trial_ordered, start)
        trial_reward = compute_reward(trial_ordered, trial_dist, trial_weights)

        if trial_reward > reward:
            weights = trial_weights

        # Decay exploration
        epsilon = max(0.05, epsilon * 0.9995)

        if (episode + 1) % 500 == 0:
            print(f"  Episode {episode+1}/{n_episodes} | Best reward: {best_reward:.2f} | ε={epsilon:.3f}")

    print(f"\nTraining complete. Best reward: {best_reward:.2f}")
    print(f"Final weights: {json.dumps(best_weights, indent=2)}")

    with open(WEIGHTS_PATH, "w") as f:
        json.dump(best_weights, f, indent=2)
    print(f"Weights saved to {WEIGHTS_PATH}")
    return best_weights


if __name__ == "__main__":
    train()
