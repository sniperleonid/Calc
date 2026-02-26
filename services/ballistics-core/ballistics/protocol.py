from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from .models import ProtocolRecord


ROOT = Path(__file__).resolve().parents[3]
PROTOCOL_DIR = ROOT / "data" / "protocols"
PROTOCOL_DIR.mkdir(parents=True, exist_ok=True)


def save_protocol(mission_id: str, operation: str, input_data: dict, result_data: dict) -> ProtocolRecord:
    record = ProtocolRecord(
        protocol_id=str(uuid4()),
        mission_id=mission_id,
        created_at=datetime.now(tz=timezone.utc),
        operation=operation,
        input_data=input_data,
        result_data=result_data,
    )

    serialized = asdict(record)
    serialized["created_at"] = serialized["created_at"].isoformat()
    output_path = PROTOCOL_DIR / f"{record.protocol_id}.json"
    output_path.write_text(json.dumps(serialized, indent=2), encoding="utf-8")
    return record
