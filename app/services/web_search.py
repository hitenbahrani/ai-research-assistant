from __future__ import annotations

from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
try:
    from ddgs import DDGS
except ImportError:  # Backward compatibility if ddgs is not installed yet.
    from duckduckgo_search import DDGS

from app.config import MAX_WEB_CHARS, WEB_TIMEOUT_SECONDS, WEB_TOP_K


def _normalize_date(value: object) -> str | None:
    if not value:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).date().isoformat()
    text = str(value).strip()
    if not text:
        return None

    # ISO-like
    if len(text) >= 10:
        iso_candidate = text[:10]
        try:
            parsed = datetime.strptime(iso_candidate, "%Y-%m-%d")
            return parsed.date().isoformat()
        except ValueError:
            pass

    # RFC 2822 / HTTP date formats
    try:
        parsed_dt = parsedate_to_datetime(text)
        if parsed_dt.tzinfo is None:
            parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
        return parsed_dt.astimezone(timezone.utc).date().isoformat()
    except Exception:
        pass

    # Common text date patterns
    for fmt in ("%b %d, %Y", "%B %d, %Y", "%d %b %Y", "%d %B %Y"):
        try:
            parsed = datetime.strptime(text, fmt)
            return parsed.date().isoformat()
        except ValueError:
            continue

    return None


def search_web(query: str, top_k: int = WEB_TOP_K, fresh_only: bool = False) -> list[dict]:
    results_out: list[dict] = []
    try:
        with DDGS(timeout=WEB_TIMEOUT_SECONDS) as ddgs:
            # Fresh-first path for latest/current/news prompts.
            if fresh_only:
                news_results = list(ddgs.news(query, max_results=top_k, timelimit="w"))
                for r in news_results:
                    title = (r.get("title") or "").strip()
                    snippet = (r.get("body") or "").strip()
                    url = (r.get("url") or r.get("href") or "").strip()
                    published = _normalize_date(r.get("date"))
                    if not snippet:
                        continue
                    results_out.append(
                        {
                            "title": title,
                            "snippet": snippet,
                            "url": url,
                            "published": published,
                            "engine": "ddg_news",
                        }
                    )
                if results_out:
                    return results_out[:top_k]

            results = list(ddgs.text(query, max_results=top_k))

        for r in results:
            title = (r.get("title") or "").strip()
            snippet = (r.get("body") or "").strip()
            url = (r.get("href") or "").strip()
            if not snippet:
                continue
            results_out.append(
                {
                    "title": title,
                    "snippet": snippet,
                    "url": url,
                    "published": _normalize_date(r.get("date")),
                    "engine": "ddg_text",
                }
            )
    except Exception as e:
        print("[web_search] error:", e)
        return []

    return results_out


def web_context(query: str, top_k: int = WEB_TOP_K, fresh_only: bool = False) -> str:
    entries = search_web(query, top_k, fresh_only=fresh_only)
    if not entries:
        return ""

    blocks: list[str] = []
    for item in entries:
        title = item.get("title") or "Untitled"
        snippet = item.get("snippet") or ""
        url = item.get("url") or ""
        published = item.get("published") or "unknown"
        blocks.append(f"{title}\nDate: {published}\n{snippet}\nSource: {url}".strip())

    return "\n\n".join(blocks)[:MAX_WEB_CHARS]
