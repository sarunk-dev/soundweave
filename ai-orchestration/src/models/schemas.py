from __future__ import annotations

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


# ── Parsed Script ─────────────────────────────────────────────────────────────

class DialogueLine(BaseModel):
    id: str
    character: str
    text: str
    emotion: str = "neutral"
    volume: str = "normal"
    position_hint: str = "near"

class SoundEffect(BaseModel):
    id: str
    type: str
    timing: str
    description: str = ""

class Atmosphere(BaseModel):
    description: str
    mood: str = "neutral"
    environment: str = "indoor_room"
    ambience_cues: list[str] = Field(default_factory=list)

class ParsedScene(BaseModel):
    id: str
    title: str
    atmosphere: Atmosphere
    dialogue: list[DialogueLine] = Field(default_factory=list)
    sound_effects: list[SoundEffect] = Field(default_factory=list)

class ParsedScript(BaseModel):
    scenes: list[ParsedScene]
    characters: list[str]
    warnings: list[str] = Field(default_factory=list)


# ── Audio Plan ────────────────────────────────────────────────────────────────

class SpatialPosition(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = -1.0
    distance: float = 2.0

class VoiceLayer(BaseModel):
    character: str
    voice_id: str
    voice_name: str
    rationale: str
    emotion_settings: dict[str, float] = Field(default_factory=dict)
    style_prompt: str = ""

class AmbienceLayer(BaseModel):
    id: str
    sound_query: str
    fallback_queries: list[str] = Field(default_factory=list)
    position: SpatialPosition = Field(default_factory=SpatialPosition)
    volume: float = -18.0
    loop: bool = True
    rationale: str = ""

class EffectLayer(BaseModel):
    id: str
    sound_query: str
    fallback_queries: list[str] = Field(default_factory=list)
    position: SpatialPosition = Field(default_factory=SpatialPosition)
    volume: float = -10.0
    loop: bool = False
    timing_ref: str = ""

class CharacterPositions(BaseModel):
    default: Optional[SpatialPosition] = None
    by_line: dict[str, SpatialPosition] = Field(default_factory=dict)

class SpatialSetup(BaseModel):
    listener_position: str = "origin"
    room_size: str = "medium"
    reverb_preset: str = "none"
    character_positions: dict[str, CharacterPositions] = Field(default_factory=dict)

class AudioPlan(BaseModel):
    voices: list[VoiceLayer] = Field(default_factory=list)
    ambience: list[AmbienceLayer] = Field(default_factory=list)
    effects: list[EffectLayer] = Field(default_factory=list)
    spatial_setup: SpatialSetup = Field(default_factory=SpatialSetup)
    mixing_notes: str = ""


# ── LangGraph State ───────────────────────────────────────────────────────────

class SceneState(BaseModel):
    scene_id: str
    script: str
    parsed_script: Optional[ParsedScript] = None
    audio_plan: Optional[AudioPlan] = None
    generated_files: list[dict[str, Any]] = Field(default_factory=list)
    final_mix_url: Optional[str] = None
    duration: Optional[float] = None
    status: str = "parsing"
    errors: list[str] = Field(default_factory=list)


# ── Refinement ────────────────────────────────────────────────────────────────

class RefinementChange(BaseModel):
    type: str  # volume | position | voice_style | add_layer | remove_layer
    character: Optional[str] = None
    layer_id: Optional[str] = None
    field: str
    from_value: Any = None
    to_value: Any
    rationale: str = ""

class RefinementPlan(BaseModel):
    changes: list[RefinementChange] = Field(default_factory=list)
    layers_to_regenerate: list[str] = Field(default_factory=list)
    layers_to_remix: list[str] = Field(default_factory=list)
    estimated_time: int = 30
    error: Optional[str] = None
