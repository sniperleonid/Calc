from __future__ import annotations

try:
    from fastapi import FastAPI, HTTPException
except ModuleNotFoundError:  # pragma: no cover - fallback for constrained environments
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    class FastAPI:  # minimal fallback for local runtime without external deps
        def __init__(self, title: str):
            self.title = title

        def post(self, _path: str):
            def decorator(func):
                return func

            return decorator

from ballistics.corrections import apply_correction
from ballistics.logging_setup import configure_logger
from ballistics.models import CorrectionRequest, FireMissionRequest, TriangulationRequest
from ballistics.protocol import save_protocol
from ballistics.solver import solve_fire_mission
from ballistics.triangulation import triangulate

app = FastAPI(title="Ballistics Core API")
logger = configure_logger()


@app.post("/solve-fire-mission")
def solve_fire_mission_endpoint(req: FireMissionRequest):
    try:
        result = solve_fire_mission(req)
    except FileNotFoundError as exc:
        logger.error("Fire mission failed due to missing data: %s", exc)
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Unexpected error during fire mission solving")
        raise HTTPException(status_code=500, detail="internal server error") from exc

    protocol = save_protocol(
        mission_id=req.mission_id,
        operation="solve-fire-mission",
        input_data=req.model_dump(mode="json"),
        result_data=result.model_dump(mode="json"),
    )
    return {"solution": result, "protocol_id": protocol.protocol_id}


@app.post("/apply-correction")
def apply_correction_endpoint(req: CorrectionRequest):
    try:
        result = apply_correction(req)
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Unexpected error during correction applying")
        raise HTTPException(status_code=500, detail="internal server error") from exc
    protocol = save_protocol(
        mission_id=req.mission_id,
        operation="apply-correction",
        input_data=req.model_dump(mode="json"),
        result_data=result.model_dump(mode="json"),
    )
    return {"solution": result, "protocol_id": protocol.protocol_id}


@app.post("/triangulation/{method}")
def triangulation_endpoint(method: str, req: TriangulationRequest):
    if method not in {"sound", "crater"}:
        raise HTTPException(status_code=400, detail="method must be sound or crater")

    req = req.model_copy(update={"method": method})
    try:
        result = triangulate(req)
    except ValueError as exc:
        logger.error("Triangulation validation error: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Unexpected error during triangulation")
        raise HTTPException(status_code=500, detail="internal server error") from exc

    protocol = save_protocol(
        mission_id=req.mission_id,
        operation=f"triangulation-{method}",
        input_data=req.model_dump(mode="json"),
        result_data=result.model_dump(mode="json"),
    )
    return {"result": result, "protocol_id": protocol.protocol_id}
