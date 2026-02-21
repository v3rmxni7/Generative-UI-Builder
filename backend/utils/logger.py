"""Structured JSON logger for agent observability."""
from __future__ import annotations

import json
import logging
import sys
import time
from contextlib import contextmanager
from typing import Any, Generator

_handler = logging.StreamHandler(sys.stdout)
_handler.setFormatter(logging.Formatter("%(message)s"))

logger = logging.getLogger("guib")
logger.addHandler(_handler)
logger.setLevel(logging.INFO)


def log_agent(
    agent: str,
    *,
    status: str,
    duration_ms: int | None = None,
    tokens: int | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    entry: dict[str, Any] = {"agent": agent, "status": status}
    if duration_ms is not None:
        entry["duration_ms"] = duration_ms
    if tokens is not None:
        entry["tokens"] = tokens
    if extra:
        entry.update(extra)
    logger.info(json.dumps(entry))


@contextmanager
def timed(agent_name: str) -> Generator[dict[str, Any], None, None]:
    """Context manager that tracks elapsed time for an agent step."""
    ctx: dict[str, Any] = {"start": time.perf_counter()}
    yield ctx
    ctx["duration_ms"] = int((time.perf_counter() - ctx["start"]) * 1000)
