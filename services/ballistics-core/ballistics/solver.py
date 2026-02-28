from __future__ import annotations

import math

from .data_store import load_ballistic_table, load_gun_profile
from .models import FireMissionRequest, FireMissionResult


def _distance(shooter_x: float, shooter_y: float, target_x: float, target_y: float) -> float:
    return math.hypot(target_x - shooter_x, target_y - shooter_y)


def solve_fire_mission(req: FireMissionRequest) -> FireMissionResult:
    ammo_type = req.ammo_type.value if hasattr(req.ammo_type, "value") else str(req.ammo_type)
    ballistic = load_ballistic_table(ammo_type, req.charge, req.barrel_profile_id)
    profile = load_gun_profile(req.barrel_profile_id)

    dx = req.target.x - req.shooter.x
    dy = req.target.y - req.shooter.y
    range_m = _distance(req.shooter.x, req.shooter.y, req.target.x, req.target.y)
    azimuth_deg = (math.degrees(math.atan2(dx, dy)) + 360.0) % 360.0

    density_factor = 1.0 + ((req.weather.pressure_hpa - 1013.25) / 1013.25) * 0.1
    temperature_factor = 1.0 - ((req.weather.temperature_c - 15.0) / 100.0)
    barrel_wear_factor = profile.get("wear_factor", 1.0)
    altitude_delta = req.target_alt_m - req.shooter_alt_m

    base_velocity = ballistic["muzzle_velocity_ms"] * barrel_wear_factor
    effective_velocity = max(40.0, base_velocity * temperature_factor / density_factor)

    elevation_rad = math.atan2(altitude_delta, max(1.0, range_m)) + (range_m / effective_velocity) / 120.0
    elevation_mils = elevation_rad * 1000

    wind_cross = req.weather.wind_speed_ms * math.sin(math.radians(req.weather.wind_direction_deg - azimuth_deg))
    drift_m = wind_cross * range_m / effective_velocity
    flight_time_s = range_m / effective_velocity

    return FireMissionResult(
        azimuth_deg=round(azimuth_deg, 3),
        elevation_mils=round(elevation_mils, 3),
        flight_time_s=round(flight_time_s, 3),
        range_m=round(range_m, 3),
        drift_m=round(drift_m, 3),
    )
