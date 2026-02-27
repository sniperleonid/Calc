from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
BALLISTIC_TABLE_DIR = ROOT / "data" / "ballistic-tables"
GUN_PROFILE_DIR = ROOT / "data" / "gun-profiles"
TABLES_DIR = ROOT / "tables"

DEFAULT_PROJECTILE_BY_AMMO = {
    "HE": "M107_155MM_HE",
    "SMOKE": "M110_SMOKE",
}


def _load_json(path: Path, missing_message: str) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"{missing_message}: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_ballistic_table(ammo_type: str, charge: int, profile_id: str = "m777") -> dict[str, Any]:
    projectile_dir = DEFAULT_PROJECTILE_BY_AMMO.get(ammo_type.upper(), ammo_type.upper())
    nested_table_file = TABLES_DIR / profile_id.lower() / projectile_dir / f"charge-{charge}.json"
    if nested_table_file.exists():
        return _load_json(nested_table_file, "Ballistic table missing")

    table_file = BALLISTIC_TABLE_DIR / f"{ammo_type.lower()}-charge-{charge}.json"
    return _load_json(table_file, "Ballistic table missing")


def load_gun_profile(profile_id: str) -> dict[str, Any]:
    nested_profile_file = TABLES_DIR / profile_id.lower() / "profile.json"
    if nested_profile_file.exists():
        return _load_json(nested_profile_file, "Gun profile missing")

    profile_file = GUN_PROFILE_DIR / f"{profile_id}.json"
    return _load_json(profile_file, "Gun profile missing")
