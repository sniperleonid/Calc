from __future__ import annotations

import math

from .models import Coordinates, TriangulationRequest, TriangulationResult


def triangulate(req: TriangulationRequest) -> TriangulationResult:
    intersections: list[tuple[float, float]] = []

    for i, p1 in enumerate(req.points[:-1]):
        for p2 in req.points[i + 1 :]:
            a1 = math.radians(p1.bearing_deg)
            a2 = math.radians(p2.bearing_deg)

            v1x, v1y = math.sin(a1), math.cos(a1)
            v2x, v2y = math.sin(a2), math.cos(a2)

            det = v1x * (-v2y) - (-v2x) * v1y
            if abs(det) < 1e-6:
                continue

            dx = p2.observer.x - p1.observer.x
            dy = p2.observer.y - p1.observer.y
            t1 = (dx * (-v2y) - (-v2x) * dy) / det

            ix = p1.observer.x + v1x * t1
            iy = p1.observer.y + v1y * t1
            intersections.append((ix, iy))

    if not intersections:
        raise ValueError("Unable to triangulate with provided bearings")

    x = sum(p[0] for p in intersections) / len(intersections)
    y = sum(p[1] for p in intersections) / len(intersections)

    confidence_multiplier = 0.7 if req.method == "sound" else 0.85
    confidence = min(1.0, confidence_multiplier * len(intersections) / len(req.points))

    return TriangulationResult(
        estimated_position=Coordinates(x=round(x, 3), y=round(y, 3)),
        confidence=round(confidence, 3),
    )
