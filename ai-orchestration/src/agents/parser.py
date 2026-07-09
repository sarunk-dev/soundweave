from __future__ import annotations

import json
import os
from pathlib import Path

from ..models.schemas import ParsedScript, SceneState
from ..clients.granite import get_granite_llm

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "parser.txt"
SYSTEM_PROMPT = PROMPT_PATH.read_text(encoding="utf-8")


def parser_agent(state: dict) -> dict:
    """
    Script Parser Agent — uses Granite to transform raw script text
    into a structured ParsedScript JSON object.
    """
    llm   = get_granite_llm()
    script = state["script"]

    prompt = f"{SYSTEM_PROMPT}\n\n{script}\n\nRespond with valid JSON only."
    raw    = llm.invoke(prompt)

    # Extract JSON block (Granite sometimes adds preamble)
    raw = _extract_json(raw)

    try:
        data   = json.loads(raw)
        parsed = ParsedScript(**data)
    except Exception as e:
        return {**state, "errors": state.get("errors", []) + [f"Parser error: {e}"], "status": "failed"}

    return {
        **state,
        "parsed_script": parsed.model_dump(),
        "status": "planning",
    }


def _extract_json(text: str) -> str:
    """Strip any non-JSON preamble/postamble from LLM output."""
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in LLM response")
    return text[start:end]
