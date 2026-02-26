from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
LOG_DIR = ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def configure_logger(name: str = "ballistics-core") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    formatter = logging.Formatter(
        "%(asctime)s | %(name)s | %(levelname)s | %(message)s"
    )

    info_file = RotatingFileHandler(
        LOG_DIR / "ballistics-core.log", maxBytes=1_000_000, backupCount=3, encoding="utf-8"
    )
    info_file.setLevel(logging.INFO)
    info_file.setFormatter(formatter)

    error_file = RotatingFileHandler(
        LOG_DIR / "ballistics-core-errors.log", maxBytes=1_000_000, backupCount=3, encoding="utf-8"
    )
    error_file.setLevel(logging.ERROR)
    error_file.setFormatter(formatter)

    stream = logging.StreamHandler()
    stream.setLevel(logging.INFO)
    stream.setFormatter(formatter)

    logger.addHandler(info_file)
    logger.addHandler(error_file)
    logger.addHandler(stream)
    logger.propagate = False

    return logger
