from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
BALLISTIC_TABLE_DIR = ROOT / "data" / "ballistic-tables"
GUN_PROFILE_DIR = ROOT / "data" / "gun-profiles"


def load_ballistic_table(ammo_type: str, charge: int) -> dict[str, Any]:
    table_file = BALLISTIC_TABLE_DIR / f"{ammo_type.lower()}-charge-{charge}.json"
    if not table_file.exists():
        raise FileNotFoundError(f"Ballistic table missing: {table_file}")
    return json.loads(table_file.read_text(encoding="utf-8"))


def load_gun_profile(profile_id: str) -> dict[str, Any]:
    profile_file = GUN_PROFILE_DIR / f"{profile_id}.json"
    if not profile_file.exists():
        raise FileNotFoundError(f"Gun profile missing: {profile_file}")
    return json.loads(profile_file.read_text(encoding="utf-8"))
