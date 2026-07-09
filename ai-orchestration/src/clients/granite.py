from __future__ import annotations

import os
import warnings
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from dotenv import load_dotenv

load_dotenv()


def get_granite_client() -> ModelInference:
    """Return a configured ModelInference instance using IBM Granite 4 (chat API)."""
    credentials = Credentials(
        url=os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com"),
        api_key=os.environ["WATSONX_API_KEY"],
    )
    client = APIClient(
        credentials=credentials,
        project_id=os.environ["WATSONX_PROJECT_ID"],
    )
    return ModelInference(
        model_id=os.environ.get("GRANITE_MODEL_ID", "ibm/granite-4-h-small"),
        api_client=client,
    )


def granite_chat(system_prompt: str, user_prompt: str, max_tokens: int = 2048) -> str:
    """
    Send a chat request to IBM Granite and return the response text.
    Uses the /ml/v1/text/chat endpoint (granite-4-h-small is chat-only).
    """
    model = get_granite_client()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt},
    ]
    params = {"max_tokens": max_tokens, "temperature": 0.2}

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        result = model.chat(messages=messages, params=params)

    # Extract text from response
    if isinstance(result, dict):
        choices = result.get("choices") or result.get("results", [])
        if choices:
            c = choices[0]
            return (
                c.get("message", {}).get("content", "")
                or c.get("generated_text", "")
            ).strip()

    raise ValueError(f"Unexpected Granite response format: {str(result)[:200]}")
