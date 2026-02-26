from pathlib import Path
import sys

sys.path.append("services/ballistics-core")

from app import apply_correction_endpoint, solve_fire_mission_endpoint, triangulation_endpoint  # noqa: E402
from ballistics.models import (  # noqa: E402
    AmmoType,
    Coordinates,
    CorrectionRequest,
    FireMissionRequest,
    FireMissionResult,
    TriangulationPoint,
    TriangulationRequest,
    WeatherInput,
)


def test_solve_fire_mission_and_protocol_saved():
    req = FireMissionRequest(
        mission_id="mission-1",
        shooter=Coordinates(x=100, y=100),
        target=Coordinates(x=500, y=800),
        shooter_alt_m=120,
        target_alt_m=132,
        weather=WeatherInput(
            temperature_c=20,
            pressure_hpa=1009,
            humidity_pct=55,
            wind_speed_ms=3,
            wind_direction_deg=135,
        ),
        ammo_type=AmmoType.HE,
        charge=3,
        barrel_profile_id="mortar-120-standard",
    )
    response = solve_fire_mission_endpoint(req)

    assert "solution" in response
    protocol_file = Path("data/protocols") / f"{response['protocol_id']}.json"
    assert protocol_file.exists()


def test_apply_correction_and_triangulation():
    correction_req = CorrectionRequest(
        mission_id="mission-2",
        base_solution=FireMissionResult(azimuth_deg=120, elevation_mils=400, flight_time_s=8, range_m=900, drift_m=12),
        observed_impact_offset_m=Coordinates(x=20, y=-15),
    )
    correction_response = apply_correction_endpoint(correction_req)
    assert correction_response["solution"].azimuth_deg != 120

    triangulation_req = TriangulationRequest(
        mission_id="mission-3",
        method="sound",
        points=[
            TriangulationPoint(observer=Coordinates(x=0, y=0), bearing_deg=45),
            TriangulationPoint(observer=Coordinates(x=1000, y=0), bearing_deg=315),
        ],
    )
    triangulation_response = triangulation_endpoint("sound", triangulation_req)
    assert triangulation_response["result"].confidence > 0
