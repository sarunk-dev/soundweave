from __future__ import annotations

import json
from pathlib import Path

from ..models.schemas import AudioPlan, SceneState
from ..clients.granite import granite_chat

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "planner.txt"
SYSTEM_PROMPT = PROMPT_PATH.read_text(encoding="utf-8")


def planner_agent(state: dict) -> dict:
    """
    Scene Planner Agent — reasons about voice casting, ambience selection,
    and 3D spatial positioning using IBM Granite.
    """
    parsed_script = state.get("parsed_script")

    if not parsed_script:
        return {**state, "errors": state.get("errors", []) + ["Planner: no parsed script"], "status": "failed"}

    raw = granite_chat(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f"Scene data:\n{json.dumps(parsed_script, indent=2)}\n\nRespond with valid JSON only.",
    )
    raw = _extract_json(raw)

    try:
        data = json.loads(raw)
        plan = AudioPlan(**data)
    except Exception as e:
        return {**state, "errors": state.get("errors", []) + [f"Planner error: {e}"], "status": "failed"}

    return {
        **state,
        "audio_plan": plan.model_dump(),
        "status": "generating",
    }


def _extract_json(text: str) -> str:
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in LLM response")
    return text[start:end]
