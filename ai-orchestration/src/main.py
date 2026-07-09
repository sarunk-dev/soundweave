from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from .workflow import run_generation
from .clients.granite import granite_chat

load_dotenv()

app = FastAPI(title="SoundWeave AI Orchestration", version="0.1.0")


# ── Request/Response models ───────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    scene_id: str
    script:   str

class RefineRequest(BaseModel):
    scene_id:      str
    refinement_id: str
    command:       str
    current_state: dict = {}   # layers, volumes, positions from DB


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "soundweave-ai-orchestration"}


@app.post("/orchestrate/generate")
def orchestrate_generate(req: GenerateRequest):
    """
    Main generation pipeline endpoint called by the Node.js worker.
    Runs the full parser → planner → generator → mixer LangGraph workflow.
    """
    result = run_generation(req.scene_id, req.script)

    if result.get("status") == "failed":
        errors = result.get("errors", ["Unknown error"])
        raise HTTPException(status_code=500, detail="; ".join(errors))

    return {
        "scene_id":    req.scene_id,
        "audio_url":   result.get("final_mix_url"),
        "duration":    result.get("duration"),
        "parsed_data": result.get("parsed_script"),
        "layers":      result.get("generated_files", []),
        "status":      "complete",
    }


@app.post("/orchestrate/refine")
def orchestrate_refine(req: RefineRequest):
    """
    Refinement endpoint — interprets a natural language command using Granite,
    returns the parameter delta. Actual selective regeneration handled by the worker.
    """
    REFINER_PROMPT_PATH = Path(__file__).parent / "prompts" / "refiner.txt"
    system_prompt = REFINER_PROMPT_PATH.read_text(encoding="utf-8")

    raw = granite_chat(
        system_prompt=system_prompt,
        user_prompt=(
            f"Current scene state:\n{json.dumps(req.current_state, indent=2)}\n\n"
            f"User command: {req.command}\n\nRespond with valid JSON only."
        ),
    )

    # Extract JSON block
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise HTTPException(status_code=500, detail="Granite returned no JSON for refinement")

    try:
        changes = json.loads(raw[start:end])
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from Granite: {e}")

    return {
        "refinement_id": req.refinement_id,
        "changes":       changes,
        "status":        "complete",
    }
