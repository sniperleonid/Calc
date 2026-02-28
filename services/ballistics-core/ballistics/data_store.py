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


def _find_directory_case_insensitive(root: Path, name: str) -> Path | None:
    if not root.exists() or not root.is_dir():
        return None
    direct = root / name
    if direct.exists() and direct.is_dir():
        return direct

    expected = name.lower()
    for child in root.iterdir():
        if child.is_dir() and child.name.lower() == expected:
            return child
    return None


def _find_projectile_dir(gun_dir: Path, ammo_type: str) -> Path | None:
    candidates = [
        DEFAULT_PROJECTILE_BY_AMMO.get(ammo_type.upper(), ""),
        ammo_type,
        ammo_type.upper(),
        ammo_type.lower(),
    ]
    for candidate in candidates:
        if not candidate:
            continue
        found = _find_directory_case_insensitive(gun_dir, candidate)
        if found:
            return found
    return None


def _load_muzzle_velocity_from_projectile_profile(projectile_dir: Path, charge: int) -> float | None:
    profile_path = projectile_dir / "profile.json"
    if not profile_path.exists():
        return None

    profile = _load_json(profile_path, "Projectile profile missing")
    per_charge = profile.get("muzzle_velocity_by_charge")
    if isinstance(per_charge, dict):
        value = per_charge.get(str(charge), per_charge.get(charge))
        if isinstance(value, (int, float)):
            return float(value)

    default_value = profile.get("muzzle_velocity_ms")
    if isinstance(default_value, (int, float)):
        return float(default_value)

    return None


def load_ballistic_table(ammo_type: str, charge: int, profile_id: str = "m777") -> dict[str, Any]:
    gun_dir = _find_directory_case_insensitive(TABLES_DIR, profile_id)
    if gun_dir:
        projectile_dir = _find_projectile_dir(gun_dir, ammo_type)
        if projectile_dir:
            nested_table_file = projectile_dir / f"charge-{charge}.json"
            if nested_table_file.exists():
                return _load_json(nested_table_file, "Ballistic table missing")

            npz_tables = sorted(projectile_dir.glob("*.npz"))
            if npz_tables:
                muzzle_velocity = _load_muzzle_velocity_from_projectile_profile(projectile_dir, charge)
                if muzzle_velocity is not None:
                    return {
                        "ammo_type": ammo_type.upper(),
                        "charge": charge,
                        "muzzle_velocity_ms": muzzle_velocity,
                        "table_npz": npz_tables[0].name,
                    }

    table_file = BALLISTIC_TABLE_DIR / f"{ammo_type.lower()}-charge-{charge}.json"
    return _load_json(table_file, "Ballistic table missing")


def load_gun_profile(profile_id: str) -> dict[str, Any]:
    gun_dir = _find_directory_case_insensitive(TABLES_DIR, profile_id)
    if gun_dir:
        nested_profile_file = gun_dir / "profile.json"
        if nested_profile_file.exists():
            return _load_json(nested_profile_file, "Gun profile missing")

    profile_file = GUN_PROFILE_DIR / f"{profile_id}.json"
    return _load_json(profile_file, "Gun profile missing")
