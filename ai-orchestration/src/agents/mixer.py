from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path

import boto3
import httpx

S3_BUCKET    = os.environ.get("S3_BUCKET", "")
S3_PUBLIC_URL = os.environ.get("S3_PUBLIC_URL", "")

s3_client = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    endpoint_url=os.environ.get("S3_ENDPOINT") or None,
)


def _db_to_linear(db: float) -> float:
    return 10 ** (db / 20)


def _download_to_tmp(url: str, suffix: str = ".mp3") -> Path:
    """Download a file from S3/URL to a local temp file. Returns the path."""
    tmp = Path(tempfile.mktemp(suffix=suffix))
    if url.startswith("s3://") or (S3_PUBLIC_URL and url.startswith(S3_PUBLIC_URL)):
        key = url.replace(S3_PUBLIC_URL.rstrip("/") + "/", "")
        s3_client.download_file(S3_BUCKET, key, str(tmp))
    else:
        with httpx.Client(timeout=60) as client:
            res = client.get(url)
            res.raise_for_status()
            tmp.write_bytes(res.content)
    return tmp


def _get_duration(file_path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(file_path)],
        capture_output=True, text=True, check=True
    )
    return float(result.stdout.strip())


def mixer_agent(state: dict) -> dict:
    """
    Spatial Mixer Agent — downloads all generated audio layers, applies
    volume levels and basic panning, sequences dialogue, and exports
    a final stereo MP3 mix using FFmpeg.
    """
    scene_id = state["scene_id"]
    layers   = state.get("generated_files", [])

    if not layers:
        return {**state, "errors": state.get("errors", []) + ["Mixer: no audio layers to mix"], "status": "failed"}

    # Separate voice layers (need sequencing) from background layers
    voice_layers   = [l for l in layers if l["layer_type"] == "voice"]
    ambient_layers = [l for l in layers if l["layer_type"] in ("ambience", "effect")]

    # Download all files to temp directory
    tmp_dir = Path(tempfile.mkdtemp())
    downloaded: dict[str, Path] = {}

    for layer in layers:
        try:
            local = _download_to_tmp(layer["file_url"])
            downloaded[layer["file_url"]] = local
        except Exception as e:
            print(f"[mixer] Warning: failed to download {layer['file_url']}: {e}")

    # ── Sequence dialogue (natural pauses between lines) ─────────────────────
    pause_seconds = 0.5
    current_time  = 0.0

    for layer in voice_layers:
        url = layer["file_url"]
        if url not in downloaded:
            continue
        local_path = downloaded[url]
        dur = _get_duration(local_path)
        layer["start_time"] = current_time
        layer["duration"]   = dur
        current_time       += dur + pause_seconds

    total_duration = current_time + 2.0  # 2s tail for ambience to fade

    # ── Build FFmpeg filter_complex ───────────────────────────────────────────
    all_layers      = voice_layers + ambient_layers
    valid_layers    = [l for l in all_layers if l["file_url"] in downloaded]

    input_args:   list[str] = []
    filter_parts: list[str] = []

    for i, layer in enumerate(valid_layers):
        local = downloaded[layer["file_url"]]
        vol   = _db_to_linear(layer.get("volume", 0.0))
        delay_ms = int(layer.get("start_time", 0.0) * 1000)

        pos  = layer.get("spatial_position", {})
        x    = float(pos.get("x", 0))
        pan  = max(-1.0, min(1.0, x / 10.0))       # normalise x → -1..1

        loop_flag = "-stream_loop -1" if layer.get("loop") else ""
        input_args.append(f'{loop_flag} -i "{local}"')

        # stereo pan: pan=FL|c0+{left}*c1|FR|{right}*c0+c1
        left_gain  = round(1.0 - max(0.0,  pan), 3)
        right_gain = round(1.0 + min(0.0, -pan), 3)

        filter_parts.append(
            f"[{i}:a]volume={vol:.4f},"
            f"adelay={delay_ms}|{delay_ms},"
            f"pan=stereo|FL={left_gain}*c0|FR={right_gain}*c0"
            f"[a{i}]"
        )

    if not filter_parts:
        return {**state, "errors": ["Mixer: all downloads failed"], "status": "failed"}

    merge_inputs   = "".join(f"[a{i}]" for i in range(len(valid_layers)))
    filter_complex = "; ".join(filter_parts) + (
        f"; {merge_inputs}amix=inputs={len(valid_layers)}:duration=first:dropout_transition=2[out]"
    )

    out_tmp = tmp_dir / "final_mix.mp3"
    cmd = (
        f'ffmpeg -y {" ".join(input_args)} '
        f'-filter_complex "{filter_complex}" '
        f'-map "[out]" '
        f'-t {total_duration:.2f} '
        f'-ar 48000 -ac 2 -b:a 192k '
        f'"{out_tmp}"'
    )

    subprocess.run(cmd, shell=True, check=True, capture_output=True)

    # ── Upload final mix to S3 ────────────────────────────────────────────────
    key = f"scenes/{scene_id}/final_mix.mp3"
    s3_client.upload_file(
        str(out_tmp), S3_BUCKET, key,
        ExtraArgs={"ContentType": "audio/mpeg"}
    )
    final_url = f"{S3_PUBLIC_URL.rstrip('/')}/{key}"

    # Update layer durations + start_times back into generated_files
    updated_layers = []
    for layer in layers:
        updated_layers.append({
            **layer,
            "duration":   layer.get("duration"),
            "start_time": layer.get("start_time", 0.0),
        })

    return {
        **state,
        "generated_files": updated_layers,
        "final_mix_url":   final_url,
        "duration":        total_duration,
        "status":          "complete",
    }
