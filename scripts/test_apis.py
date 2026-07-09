"""
SoundWeave API Connectivity Tests
Checks each external service and reports pass/fail with details.
Run from the project root: python scripts/test_apis.py
"""

import os
import sys
import json
import time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# ── Colours for terminal output ───────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):    print(f"  {GREEN}✓{RESET} {msg}")
def fail(msg):  print(f"  {RED}✗{RESET} {msg}")
def warn(msg):  print(f"  {YELLOW}⚠{RESET} {msg}")
def info(msg):  print(f"  {BLUE}>{RESET} {msg}")
def header(msg):print(f"\n{BOLD}{msg}{RESET}")

results = {}

# ── 1. IBM Watsonx / Granite ──────────────────────────────────────────────────
header("1. IBM Watsonx / Granite")

api_key    = os.environ.get("WATSONX_API_KEY", "")
project_id = os.environ.get("WATSONX_PROJECT_ID", "")
url        = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
model_id   = os.environ.get("GRANITE_MODEL_ID", "ibm/granite-3-8b-instruct")

if not api_key or api_key == "your_watsonx_api_key_here":
    fail("WATSONX_API_KEY not set in .env")
    results["watsonx"] = False
elif not project_id or project_id == "your_project_id_here":
    fail("WATSONX_PROJECT_ID not set in .env")
    results["watsonx"] = False
else:
    info(f"Endpoint : {url}")
    info(f"Model    : {model_id}")
    info(f"Project  : {project_id[:8]}…")
    try:
        import warnings
        import json as _json
        from ibm_watsonx_ai import APIClient, Credentials
        from ibm_watsonx_ai.foundation_models import ModelInference

        credentials = Credentials(url=url, api_key=api_key)
        client      = APIClient(credentials=credentials, project_id=project_id)
        model       = ModelInference(
            model_id   = model_id,
            api_client = client,
        )

        messages = [{"role": "user", "content": 'Reply with exactly two words: SOUNDWEAVE OK'}]
        params   = {"max_tokens": 20, "temperature": 0.1}

        t0 = time.time()
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            result  = model.chat(messages=messages, params=params)
        elapsed = round(time.time() - t0, 2)

        # chat() returns a dict with choices
        content = ""
        if isinstance(result, dict):
            choices = result.get("choices") or result.get("results", [])
            if choices:
                c = choices[0]
                content = (
                    c.get("message", {}).get("content", "")
                    or c.get("generated_text", "")
                )

        if content and len(content.strip()) > 0:
            ok(f"Granite (granite-4-h-small) responded in {elapsed}s")
            info(f"Response: {content.strip()[:80]}")
            results["watsonx"] = True
        else:
            fail(f"Granite returned empty response (raw={str(result)[:120]})")
            results["watsonx"] = False

    except Exception as e:
        fail(f"Granite error: {e}")
        results["watsonx"] = False


# ── 2. ElevenLabs ─────────────────────────────────────────────────────────────
header("2. ElevenLabs Voice API")

el_key = os.environ.get("ELEVENLABS_API_KEY", "")

if not el_key or el_key == "your_elevenlabs_api_key_here":
    warn("ELEVENLABS_API_KEY not set — skipping (needed for Phase 2)")
    results["elevenlabs"] = None
else:
    import httpx
    info(f"Key prefix: {el_key[:8]}…")
    try:
        r = httpx.get(
            "https://api.elevenlabs.io/v1/voices",
            headers={"xi-api-key": el_key},
            timeout=10,
        )
        if r.status_code == 200:
            voices = r.json().get("voices", [])
            ok(f"ElevenLabs reachable — {len(voices)} voices available")
            results["elevenlabs"] = True
        elif r.status_code == 401:
            fail("Invalid ElevenLabs API key (401)")
            results["elevenlabs"] = False
        else:
            fail(f"ElevenLabs returned HTTP {r.status_code}")
            results["elevenlabs"] = False
    except Exception as e:
        fail(f"ElevenLabs error: {e}")
        results["elevenlabs"] = False


# ── 3. Freesound ──────────────────────────────────────────────────────────────
header("3. Freesound API")

fs_key = os.environ.get("FREESOUND_API_KEY", "")

if not fs_key or fs_key == "your_freesound_api_key_here":
    warn("FREESOUND_API_KEY not set — skipping (needed for Phase 2)")
    results["freesound"] = None
else:
    import httpx
    info(f"Key prefix: {fs_key[:8]}…")
    try:
        r = httpx.get(
            "https://freesound.org/apiv2/search/text/",
            params={"query": "rain", "page_size": 1, "fields": "id,name"},
            headers={"Authorization": f"Token {fs_key}"},
            timeout=10,
        )
        if r.status_code == 200:
            count = r.json().get("count", 0)
            ok(f"Freesound reachable — {count:,} results for 'rain'")
            results["freesound"] = True
        elif r.status_code == 401:
            fail("Invalid Freesound API key (401)")
            results["freesound"] = False
        else:
            fail(f"Freesound returned HTTP {r.status_code}")
            results["freesound"] = False
    except Exception as e:
        fail(f"Freesound error: {e}")
        results["freesound"] = False


# ── 4. AWS S3 ─────────────────────────────────────────────────────────────────
header("4. AWS S3 / Object Storage")

aws_key    = os.environ.get("AWS_ACCESS_KEY_ID", "")
aws_secret = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
s3_bucket  = os.environ.get("S3_BUCKET", "")

if not aws_key or aws_key == "your_aws_key_here":
    warn("AWS credentials not set — skipping (needed for Phase 2)")
    results["s3"] = None
else:
    try:
        import boto3
        from botocore.exceptions import ClientError, NoCredentialsError

        s3 = boto3.client(
            "s3",
            region_name            = os.environ.get("AWS_REGION", "us-east-1"),
            aws_access_key_id      = aws_key,
            aws_secret_access_key  = aws_secret,
            endpoint_url           = os.environ.get("S3_ENDPOINT") or None,
        )
        s3.head_bucket(Bucket=s3_bucket)
        ok(f"S3 bucket '{s3_bucket}' accessible")
        results["s3"] = True
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("403", "AccessDenied"):
            fail(f"S3 access denied to bucket '{s3_bucket}' (check IAM permissions)")
        elif code in ("404", "NoSuchBucket"):
            fail(f"S3 bucket '{s3_bucket}' does not exist")
        else:
            fail(f"S3 error: {e}")
        results["s3"] = False
    except Exception as e:
        fail(f"S3 error: {e}")
        results["s3"] = False


# ── Summary ───────────────────────────────────────────────────────────────────
header("━" * 46)
header("  Test Summary")
print("━" * 46)

labels = {
    "watsonx":    "IBM Granite (Watsonx)",
    "elevenlabs": "ElevenLabs Voice API",
    "freesound":  "Freesound API",
    "s3":         "AWS S3 Storage",
}

passed = 0
skipped = 0
failed = 0

for key, label in labels.items():
    status = results.get(key)
    if status is True:
        print(f"  {GREEN}PASS{RESET}  {label}")
        passed += 1
    elif status is False:
        print(f"  {RED}FAIL{RESET}  {label}")
        failed += 1
    else:
        print(f"  {YELLOW}SKIP{RESET}  {label}  (key not configured)")
        skipped += 1

print("━" * 46)
print(f"  {passed} passed · {skipped} skipped · {failed} failed\n")

if failed > 0:
    sys.exit(1)
