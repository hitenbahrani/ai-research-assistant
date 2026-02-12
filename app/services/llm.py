from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
import os

from groq import Groq


# ==========================
# GROQ CONFIGURATION
# ==========================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY environment variable not set.")

client = Groq(api_key=GROQ_API_KEY)


# ==========================
# SYSTEM PROMPTS
# ==========================

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


# ==========================
# HISTORY CLEANING
# ==========================

def _to_history_messages(history: list[dict]) -> list[dict]:
    cleaned: list[dict] = []
    for msg in history:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if role not in {"user", "assistant"} or not content:
            continue
        cleaned.append({"role": role, "content": content})
    return cleaned[-10:]


# ==========================
# MAIN GENERATION FUNCTION
# ==========================

def generate_answer(
    user_message: str,
    context: str = "",
    history: Optional[list[dict]] = None,
    strict_grounding: bool = False,
) -> str:

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

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0.25 if strict_grounding else 0.45,
        max_tokens=900,
    )

    return response.choices[0].message.content.strip()