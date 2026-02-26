from __future__ import annotations

from .models import CorrectionRequest, FireMissionResult


def apply_correction(req: CorrectionRequest) -> FireMissionResult:
    azimuth_delta = req.observed_impact_offset_m.x * 0.05
    elevation_delta = -req.observed_impact_offset_m.y * 0.8

    return FireMissionResult(
        azimuth_deg=round(req.base_solution.azimuth_deg + azimuth_delta, 3),
        elevation_mils=round(req.base_solution.elevation_mils + elevation_delta, 3),
        flight_time_s=req.base_solution.flight_time_s,
        range_m=req.base_solution.range_m,
        drift_m=req.base_solution.drift_m,
    )
