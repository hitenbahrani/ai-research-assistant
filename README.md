## Nova Nexus AI

**Nova Nexus AI** is a full-stack AI research assistant platform built for fast, reliable, thread-based conversations with optional live web grounding.

It combines a premium chat workspace UI, a FastAPI orchestration backend, and a local GGUF LLM runtime to deliver practical AI workflows for research, comparison, planning, and ideation.

---

## 🚀 Overview

Modern AI assistants must do more than answer single prompts. They should support:

- Multi-thread workflows
- Fast interaction loops
- Clear chat context management
- Optional live web grounding for latest/current queries

**Nova Nexus AI** demonstrates this with a clean frontend/backend split:

- **Frontend (React + Vite):** chat UI, thread management, action chips, web toggle
- **Backend (FastAPI):** request orchestration, freshness logic, web search, LLM inference
- **Model layer (llama.cpp):** local Mistral GGUF inference

---

## 🧠 What This Project Demonstrates

- Threaded chat UX with persistent history (localStorage)
- Intent-driven prompting via action chips
- Optional web-assisted responses (`Web` toggle)
- Freshness-aware news handling for latest/current questions
- Local model inference with context-grounded answer path
- Clear modular architecture ready for RAG/auth expansion

---

## 🏗️ High-Level Architecture

Nova Nexus AI follows a **frontend-driven, backend-orchestrated** architecture.

### Architecture Layers

- **UI Layer (React):**
  - Sidebar threads
  - Chat workspace
  - Input controls (`Web` toggle, actions, send/stop)
- **API Layer (FastAPI):**
  - `/health` liveness
  - `/ask` orchestration endpoint
- **Search Layer (DuckDuckGo):**
  - Optional web/news retrieval
  - Freshness filtering for recent queries
- **LLM Layer (llama.cpp):**
  - Local model loading and generation
  - Grounded vs normal response behavior

---

## 🖥️ Frontend Flow

1. User types prompt in input bar.
2. User can optionally:
   - toggle `Web` on/off
   - select an action chip (`Research`, `Compare`, etc.)
3. Frontend builds request payload and sends to `/ask`.
4. User message is appended immediately to current thread.
5. Assistant response is appended after backend completion.
6. Threads are sorted by latest activity and persisted across refresh.

### Frontend Highlights

- Thread creation with controlled draft-thread behavior
- Copy/regenerate assistant response actions
- Sidebar collapse/expand
- Dark premium workspace styling

---

## ⚙️ Backend Flow

1. FastAPI receives `POST /ask`.
2. Request is validated (question, mode, history, flags).
3. Backend decides chat-only vs web-assisted path.
4. If web path is enabled:
   - runs DDG search/news
   - normalizes dates
   - applies freshness filtering when needed
5. Builds context and calls local LLM generation.
6. Returns answer + metadata (`intent`, `sources`, `grounded`, `has_context`).

---

## 🔌 API Design

### `GET /health`

Returns service status.

```json
{ "status": "ok" }
```

### `POST /ask`

Request body:

```json
{
  "question": "Why is Nvidia growing so rapidly?",
  "top_k": 6,
  "mode": "auto",
  "use_web": false,
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response body:

```json
{
  "answer": "...",
  "intent": "chat",
  "sources": [],
  "grounded": false,
  "has_context": false
}
```

---

## 🧰 Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Axios
- Lucide React
- React Markdown + remark-gfm

### Backend

- FastAPI
- Uvicorn
- Pydantic
- llama-cpp-python
- duckduckgo-search

### Model

- Local GGUF model: `mistral-7b-instruct.gguf`

---

## ✨ Key Features

- Multi-thread conversations
- Persistent threads on refresh
- Action chips + guided suggestions
- Web search toggle
- Latest/current freshness handling
- Copy + regenerate response controls
- Sidebar management (select/delete/collapse)
- Premium dark research workspace UI

---

## 🎯 Use Cases

- AI research assistant
- Competitive comparison analysis
- Brainstorming and planning
- Technical concept explanation
- Summarization and validation workflows
- Current-events aware question answering

---

## ⚠️ Current Limitations

- No authentication yet
- No server-side thread persistence (browser localStorage only)
- No production-grade streaming token output
- Vector DB/PDF pipeline not integrated into active `/ask` path yet
- Limited automated test coverage currently

---

## 🔮 Future Scope

Planned/possible upgrades:

- Retrieval-Augmented Generation (RAG)
- PDF/document ingestion pipeline
- Vector database retrieval integration (FAISS/managed vector DB)
- Authentication + user accounts
- Multi-workspace support
- Server-side persistence and analytics
- Streaming responses (SSE/WebSocket)
- Citation-first grounded answer mode

---

## 🧪 Run Locally

### 1) Start backend

```bash
cd /Users/hitenbahrani/Documents/Projects/ai-research-assistant
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2) Start frontend

```bash
cd /Users/hitenbahrani/Documents/Projects/ai-research-assistant/frontend
npm run dev -- --port 5173
```

Open: `http://localhost:5173`

---

## 🛠️ Build and Lint

```bash
cd /Users/hitenbahrani/Documents/Projects/ai-research-assistant/frontend
npm run lint
npm run build
```

---

## 📁 Project Structure

```text
ai-research-assistant/
├── app/
│   ├── api.py
│   ├── main.py
│   ├── config.py
│   └── services/
│       ├── llm.py
│       └── web_search.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── services/api.js
│   └── index.html
├── models/
├── vectorstore/
└── README.md
```

---

## 📌 Summary

**Nova Nexus AI** is a practical, extensible AI research workspace that already supports real multi-thread conversation workflows and optional live web grounding, while keeping architecture clean for next-stage upgrades like RAG, auth, and production persistence.
