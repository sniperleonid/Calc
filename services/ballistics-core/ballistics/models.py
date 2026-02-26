from __future__ import annotations

from dataclasses import asdict, dataclass, field, replace
from datetime import datetime
from enum import Enum
from typing import Literal


class AmmoType(str, Enum):
    HE = "HE"
    SMOKE = "SMOKE"
    ILLUM = "ILLUM"


def _normalize(value):
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {k: _normalize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize(v) for v in value]
    return value


@dataclass
class WeatherInput:
    temperature_c: float = 15.0
    pressure_hpa: float = 1013.25
    humidity_pct: float = 50
    wind_speed_ms: float = 0
    wind_direction_deg: float = 0


@dataclass
class Coordinates:
    x: float
    y: float


@dataclass
class FireMissionRequest:
    mission_id: str
    shooter: Coordinates
    target: Coordinates
    shooter_alt_m: float
    target_alt_m: float
    weather: WeatherInput
    ammo_type: AmmoType
    charge: int
    barrel_profile_id: str

    def model_dump(self, mode: str = "json") -> dict:
        return _normalize(asdict(self))


@dataclass
class FireMissionResult:
    azimuth_deg: float
    elevation_mils: float
    flight_time_s: float
    range_m: float
    drift_m: float

    def model_dump(self, mode: str = "json") -> dict:
        return _normalize(asdict(self))


@dataclass
class CorrectionRequest:
    mission_id: str
    base_solution: FireMissionResult
    observed_impact_offset_m: Coordinates

    def model_dump(self, mode: str = "json") -> dict:
        return _normalize(asdict(self))


@dataclass
class TriangulationPoint:
    observer: Coordinates
    bearing_deg: float


@dataclass
class TriangulationRequest:
    mission_id: str
    method: Literal["sound", "crater"]
    points: list[TriangulationPoint] = field(default_factory=list)

    def model_dump(self, mode: str = "json") -> dict:
        return _normalize(asdict(self))

    def model_copy(self, update: dict) -> "TriangulationRequest":
        return replace(self, **update)


@dataclass
class TriangulationResult:
    estimated_position: Coordinates
    confidence: float

    def model_dump(self, mode: str = "json") -> dict:
        return _normalize(asdict(self))


@dataclass
class ProtocolRecord:
    protocol_id: str
    mission_id: str
    created_at: datetime
    operation: str
    input_data: dict
    result_data: dict
