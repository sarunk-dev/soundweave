from __future__ import annotations

import os
from typing import Any

from langchain_ibm import WatsonxLLM
from dotenv import load_dotenv

load_dotenv()


def get_granite_llm() -> WatsonxLLM:
    """Return a configured WatsonxLLM instance using IBM Granite."""
    return WatsonxLLM(
        model_id=os.environ.get("GRANITE_MODEL_ID", "ibm/granite-3-8b-instruct"),
        url=os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com"),
        apikey=os.environ["WATSONX_API_KEY"],
        project_id=os.environ["WATSONX_PROJECT_ID"],
        params={
            "max_new_tokens": 2048,
            "temperature": 0.2,
            "top_p": 0.9,
            "repetition_penalty": 1.05,
        },
    )
