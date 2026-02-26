from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ControlPoint:
    map_x: float
    map_y: float
    game_x: float
    game_y: float


@dataclass
class CalibrationModel:
    scale_x: float
    scale_y: float
    offset_x: float
    offset_y: float

    def to_game(self, map_x: float, map_y: float) -> tuple[float, float]:
        return (map_x * self.scale_x + self.offset_x, map_y * self.scale_y + self.offset_y)


def calibrate_from_points(points: list[ControlPoint]) -> CalibrationModel:
    if len(points) < 2:
        raise ValueError("At least two control points are required")

    p1, p2 = points[0], points[1]
    map_dx = p2.map_x - p1.map_x
    map_dy = p2.map_y - p1.map_y
    if map_dx == 0 or map_dy == 0:
        raise ValueError("Control points cannot align on zero delta axis")

    scale_x = (p2.game_x - p1.game_x) / map_dx
    scale_y = (p2.game_y - p1.game_y) / map_dy
    offset_x = p1.game_x - p1.map_x * scale_x
    offset_y = p1.game_y - p1.map_y * scale_y

    return CalibrationModel(scale_x=scale_x, scale_y=scale_y, offset_x=offset_x, offset_y=offset_y)
