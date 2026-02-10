from __future__ import annotations

import asyncio
import re
from datetime import date, datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import DEFAULT_TOP_K
from app.services.llm import generate_answer
from app.services.web_search import search_web

router = APIRouter()
MAX_CONTEXT_CHARS = 12000


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AskRequest(BaseModel):
    question: str
    top_k: int = Field(default=DEFAULT_TOP_K, ge=1, le=20)
    mode: Literal["auto", "chat", "web"] = "auto"
    use_web: bool = False
    messages: list[ChatMessage] = Field(default_factory=list)


@router.get("/health")
def health():
    return {"status": "ok"}


def _question_looks_web_focused(question: str) -> bool:
    q = question.lower()
    triggers = ["latest", "today", "news", "current", "recent", "headline", "breaking"]
    return any(t in q for t in triggers)


def _parse_iso_date(value: object) -> date | None:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = text[:10]
    try:
        return datetime.strptime(text, "%Y-%m-%d").date()
    except ValueError:
        return None


def _freshness_window_days(question: str) -> int:
    q = question.lower()
    if "today" in q:
        return 1
    if "this week" in q or "weekly" in q:
        return 8
    if "this month" in q:
        return 35
    return 14


def _filter_fresh_hits(web_hits: list[dict], question: str) -> list[dict]:
    today = datetime.now(timezone.utc).date()
    window_days = _freshness_window_days(question)
    out: list[dict] = []
    for item in web_hits:
        pub = _parse_iso_date(item.get("published"))
        if not pub:
            continue
        age_days = (today - pub).days
        if age_days < 0:
            continue
        if age_days <= window_days:
            out.append(item)
    return out


def _build_live_answer(question: str, hits: list[dict]) -> str:
    today_iso = datetime.now(timezone.utc).date().isoformat()
    lines = [f"Live web results as of {today_iso} UTC:"]
    for i, h in enumerate(hits[:5], start=1):
        title = (h.get("title") or "Untitled").strip()
        published = h.get("published") or "unknown"
        snippet = (h.get("snippet") or "").strip()
        url = (h.get("url") or "").strip()
        lines.append(f"{i}. {title} ({published})")
        if snippet:
            lines.append(f"   {snippet[:220]}")
        if url:
            lines.append(f"   Source: {url}")
    if re.search(r"\bsummary|summarize\b", question, re.IGNORECASE):
        lines.append("Summary: These are the freshest available headlines from live web search.")
    return "\n".join(lines)


@router.post("/ask")
async def ask(req: AskRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    include_web = req.use_web or req.mode == "web" or (
        req.mode == "auto" and _question_looks_web_focused(question)
    )
    freshness_required = _question_looks_web_focused(question)

    sources: list[dict] = []
    context_parts: list[str] = []

    if include_web:
        web_hits = search_web(
            question,
            top_k=min(req.top_k, 8),
            fresh_only=freshness_required,
        )
        if freshness_required:
            web_hits = _filter_fresh_hits(web_hits, question)

        if freshness_required and not web_hits:
            today_iso = datetime.now(timezone.utc).date().isoformat()
            return {
                "answer": (
                    f"I could not fetch sufficiently recent live results right now (as of {today_iso} UTC). "
                    "Please retry in a moment."
                ),
                "intent": "web",
                "sources": [],
                "grounded": False,
                "has_context": False,
            }

        if freshness_required and web_hits:
            source_items = [
                {
                    "type": "web",
                    "title": item.get("title"),
                    "url": item.get("url"),
                    "published": item.get("published"),
                    "engine": item.get("engine"),
                    "preview": (item.get("snippet") or "")[:220],
                }
                for item in web_hits[:5]
            ]
            return {
                "answer": _build_live_answer(question, web_hits),
                "intent": "web",
                "sources": source_items,
                "grounded": True,
                "has_context": True,
            }

        for item in web_hits:
            sources.append(
                {
                    "type": "web",
                    "title": item.get("title"),
                    "url": item.get("url"),
                    "published": item.get("published"),
                    "engine": item.get("engine"),
                    "preview": (item.get("snippet") or "")[:220],
                }
            )
            context_parts.append(
                (
                    f"[WEB title={item.get('title')} date={item.get('published') or 'unknown'} "
                    f"engine={item.get('engine') or 'unknown'}]\n"
                    f"{item.get('snippet')}\nSource: {item.get('url')}"
                )
            )

    context = "\n\n".join(context_parts).strip()[:MAX_CONTEXT_CHARS]
    history = [m.model_dump() for m in req.messages]

    answer = await asyncio.to_thread(
        generate_answer,
        question,
        context,
        history,
        bool(context),
    )

    return {
        "answer": answer,
        "intent": "web" if include_web else "chat",
        "sources": sources,
        "grounded": bool(context),
        "has_context": bool(context),
    }
