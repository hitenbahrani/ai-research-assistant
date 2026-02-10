from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
import threading

from llama_cpp import Llama

from app.config import LLM_MODEL_PATH

_llm: Optional[Llama] = None
_lock = threading.Lock()

N_CTX = 8192
N_GPU_LAYERS = 1
N_THREADS = None

BASE_SYSTEM_PROMPT = """You are Nova, a precise and useful AI assistant.

Behavior rules:
- Be direct and accurate.
- Prefer short structured answers when possible.
- If the user asks for steps, provide ordered steps.
"""

CONTEXT_SYSTEM_PROMPT = """You are Nova, a context-grounded assistant.

Grounding rules:
- Use the provided context for factual claims.
- If context is insufficient, say you do not have enough context.
- Do not invent facts.
- Prefer the most recent dated items in context.
- For latest/news/current questions, include specific dates found in context.
"""


def load_llm() -> Llama:
    global _llm
    with _lock:
        if _llm is None:
            print("Loading LLM...")
            _llm = Llama(
                model_path=str(LLM_MODEL_PATH),
                n_ctx=N_CTX,
                n_gpu_layers=N_GPU_LAYERS,
                n_threads=N_THREADS,
                verbose=False,
            )
            print("LLM loaded")
    return _llm


def _to_history_messages(history: list[dict]) -> list[dict]:
    cleaned: list[dict] = []
    for msg in history:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if role not in {"user", "assistant"} or not content:
            continue
        cleaned.append({"role": role, "content": content})
    return cleaned[-10:]


def generate_answer(
    user_message: str,
    context: str = "",
    history: Optional[list[dict]] = None,
    strict_grounding: bool = False,
) -> str:
    llm = load_llm()

    messages: list[dict] = [
        {
            "role": "system",
            "content": CONTEXT_SYSTEM_PROMPT if strict_grounding else BASE_SYSTEM_PROMPT,
        }
    ]

    if context.strip():
        today_iso = datetime.now(timezone.utc).date().isoformat()
        messages.append(
            {
                "role": "system",
                "content": (
                    f"Today is {today_iso} (UTC). "
                    "Use this context as your knowledge base for this turn:\n\n"
                    f"{context[:12000]}"
                ),
            }
        )

    if history:
        messages.extend(_to_history_messages(history))

    messages.append({"role": "user", "content": user_message.strip()})

    result = llm.create_chat_completion(
        messages=messages,
        temperature=0.25 if strict_grounding else 0.45,
        top_p=0.9,
        max_tokens=900,
    )

    return result["choices"][0]["message"]["content"].strip()
