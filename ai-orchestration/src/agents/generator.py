from __future__ import annotations

import asyncio
import io
import os
from typing import Any

import httpx
import boto3

from ..models.schemas import SceneState


ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
FREESOUND_API_KEY  = os.environ.get("FREESOUND_API_KEY", "")
S3_BUCKET          = os.environ.get("S3_BUCKET", "")
S3_PUBLIC_URL      = os.environ.get("S3_PUBLIC_URL", "")

s3_client = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    endpoint_url=os.environ.get("S3_ENDPOINT") or None,
)


async def _generate_voice(
    voice_id: str,
    text: str,
    stability: float = 0.5,
    similarity_boost: float = 0.8,
) -> bytes:
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                },
            },
        )
        res.raise_for_status()
        return res.content


async def _fetch_freesound(query: str, fallbacks: list[str]) -> bytes | None:
    queries = [query] + fallbacks
    async with httpx.AsyncClient(timeout=30) as client:
        for q in queries:
            try:
                search_res = await client.get(
                    "https://freesound.org/apiv2/search/text/",
                    params={
                        "query": q,
                        "filter": "duration:[5.0 TO 600.0]",
                        "fields": "id,name,duration,previews",
                        "page_size": 3,
                        "sort": "rating_desc",
                    },
                    headers={"Authorization": f"Token {FREESOUND_API_KEY}"},
                )
                data = search_res.json()
                if data.get("results"):
                    preview_url = data["results"][0]["previews"].get(
                        "preview-hq-mp3", data["results"][0]["previews"].get("preview-lq-mp3")
                    )
                    audio_res = await client.get(
                        preview_url,
                        headers={"Authorization": f"Token {FREESOUND_API_KEY}"},
                    )
                    audio_res.raise_for_status()
                    return audio_res.content
            except Exception:
                continue
    return None


def _upload_to_s3(key: str, data: bytes, content_type: str = "audio/mpeg") -> str:
    s3_client.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type)
    return f"{S3_PUBLIC_URL.rstrip('/')}/{key}"


async def _run_generation(state: dict) -> dict:
    scene_id   = state["scene_id"]
    plan       = state.get("audio_plan", {})
    parsed     = state.get("parsed_script", {})
    generated  = []

    # Build voice lookup: character → voice config
    voice_map = {v["character"]: v for v in plan.get("voices", [])}

    # ── Generate dialogue voices (parallel) ──────────────────────────────────
    async def gen_voice(scene: dict, line: dict) -> dict | None:
        char = line["character"]
        if char not in voice_map:
            return None
        vc   = voice_map[char]
        es   = vc.get("emotion_settings", {})
        data = await _generate_voice(
            voice_id         = vc["voice_id"],
            text             = line["text"],
            stability        = es.get("stability", 0.5),
            similarity_boost = es.get("similarity_boost", 0.8),
        )
        key = f"scenes/{scene_id}/voices/{char}_{line['id']}.mp3"
        url = _upload_to_s3(key, data)
        return {
            "layer_type":     "voice",
            "character_name": char,
            "description":    f"{char}: {line['text'][:40]}",
            "file_url":       url,
            "volume":         0.0 if line.get("volume") == "loud" else (-3.0 if line.get("volume") == "normal" else -6.0),
            "spatial_position": plan.get("spatial_setup", {})
                                    .get("character_positions", {})
                                    .get(char, {})
                                    .get("default", {"x": 0, "y": 0, "z": -1, "distance": 1.5}),
            "loop":      False,
            "start_time": 0.0,  # Timeline sequencing handled by mixer
            "line_id":    line["id"],
        }

    dialogue_tasks = [
        gen_voice(scene, line)
        for scene in parsed.get("scenes", [])
        for line in scene.get("dialogue", [])
    ]
    voice_results = await asyncio.gather(*dialogue_tasks, return_exceptions=True)
    for r in voice_results:
        if r and not isinstance(r, Exception):
            generated.append(r)

    # ── Fetch ambience sounds (sequential, with fallbacks) ───────────────────
    for amb in plan.get("ambience", []):
        data = await _fetch_freesound(amb["sound_query"], amb.get("fallback_queries", []))
        if data:
            key = f"scenes/{scene_id}/ambience/{amb['id']}.mp3"
            url = _upload_to_s3(key, data)
            generated.append({
                "layer_type":      "ambience",
                "character_name":  None,
                "description":     amb["sound_query"],
                "file_url":        url,
                "volume":          amb.get("volume", -18.0),
                "spatial_position": amb.get("position", {"x": 0, "y": 0, "z": 0, "distance": 8}),
                "loop":            amb.get("loop", True),
                "start_time":      0.0,
                "layer_id":        amb["id"],
            })

    # ── Fetch effect sounds ───────────────────────────────────────────────────
    for sfx in plan.get("effects", []):
        data = await _fetch_freesound(sfx["sound_query"], sfx.get("fallback_queries", []))
        if data:
            key = f"scenes/{scene_id}/effects/{sfx['id']}.mp3"
            url = _upload_to_s3(key, data)
            generated.append({
                "layer_type":      "effect",
                "character_name":  None,
                "description":     sfx["sound_query"],
                "file_url":        url,
                "volume":          sfx.get("volume", -10.0),
                "spatial_position": sfx.get("position", {"x": 0, "y": 0, "z": 0, "distance": 4}),
                "loop":            False,
                "start_time":      0.0,
                "layer_id":        sfx["id"],
            })

    return {
        **state,
        "generated_files": generated,
        "status": "mixing",
    }


def generator_agent(state: dict) -> dict:
    """Sync wrapper around the async generator."""
    return asyncio.run(_run_generation(state))
