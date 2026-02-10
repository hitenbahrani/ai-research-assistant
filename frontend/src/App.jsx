import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import { askChat } from "./services/api";

const ACTIONS = [
  { key: "research", label: "Research" },
  { key: "compare", label: "Compare" },
  { key: "latest", label: "Latest" },
  { key: "summarize", label: "Summarize" },
  { key: "explain", label: "Explain" },
  { key: "brainstorm", label: "Brainstorm" },
  { key: "validate", label: "Validate" },
  { key: "plan", label: "Plan" },
];

const ACTION_SUGGESTIONS = {
  research: [
    "Why is Nvidia growing so rapidly?",
    "Research the latest AI developments",
    "What are the key trends in robotics?",
    "What are the latest breakthroughs in renewable energy?",
  ],
  compare: [
    "Compare ChatGPT, Claude, and Gemini for technical writing",
    "Compare SQL vs NoSQL for analytics-heavy products",
    "Compare hiring in-house vs outsourcing for MVP delivery",
    "Compare Tesla and BYD strategies in EV expansion",
  ],
  brainstorm: [
    "Brainstorm 10 startup ideas in climate tech",
    "Generate creative marketing angles for an AI product",
    "Brainstorm product names for a premium research assistant",
    "Give me unconventional growth ideas for a developer tool",
  ],
  latest: [
    "Latest news today",
    "What happened in tech this week?",
    "Recent breakthroughs in medicine",
    "Latest AI model releases",
  ],
  summarize: [
    "Summarize the key differences between supervised and unsupervised learning",
    "Summarize this quarter's product priorities into 5 bullets",
    "Summarize the causes and impact of inflation",
    "Summarize this article in plain English for a non-technical audience",
  ],
  explain: [
    "Explain blockchain like I am 12 years old",
    "Explain how recommendation systems work in streaming apps",
    "Explain the difference between GPU and CPU with examples",
    "Explain microservices vs monolith architecture",
  ],
  validate: [
    "Validate my SaaS pricing model assumptions",
    "Validate whether this GTM strategy is realistic",
    "Validate this startup idea and identify key risks",
    "Validate if this roadmap can be delivered in 90 days",
  ],
  plan: [
    "Plan a 30-60-90 day AI product launch roadmap",
    "Plan a full-stack learning path for the next 4 months",
    "Plan a weekly content strategy for a developer brand",
    "Plan migration from a monolith to microservices",
  ],
};

const ACTION_INTENT_PREFIX = {
  compare: "Compare key options with clear pros, cons, and tradeoffs:",
  summarize: "Summarize this clearly and concisely:",
  explain: "Explain this in simple terms with practical examples:",
  brainstorm: "Brainstorm diverse, creative ideas for:",
  validate: "Validate this and identify risks, assumptions, and improvements:",
  plan: "Create a step-by-step plan with milestones for:",
};
const CHATS_STORAGE_KEY = "nova.nexus.chats.v1";
const ACTIVE_CHAT_STORAGE_KEY = "nova.nexus.activeChatId.v1";

function inferActionKey(text, selectedAction) {
  if (selectedAction) return selectedAction;
  const lower = text.toLowerCase().trim();
  const fromText = ACTIONS.find((item) => lower.startsWith(item.label.toLowerCase()));
  return fromText?.key || null;
}

function buildBackendPayload(message, actionKey, webSearchEnabled, history) {
  const normalized = message.trim();
  const intentPrefix = actionKey ? ACTION_INTENT_PREFIX[actionKey] : null;
  const question = intentPrefix ? `${intentPrefix} ${normalized}` : normalized;

  const shouldUseWebByAction = actionKey === "research" || actionKey === "latest";
  const useWeb = Boolean(webSearchEnabled);
  const mode = useWeb ? (shouldUseWebByAction ? "web" : "auto") : "chat";

  return {
    question,
    messages: history.map((item) => ({ role: item.role, content: item.content })),
    mode,
    use_web: useWeb,
  };
}

export default function App() {
  const [chats, setChats] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(CHATS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [activeChatId, setActiveChatId] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY) || null;
  });
  const [draft, setDraft] = useState("");
  const [selectedAction, setSelectedAction] = useState(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDraftThread, setIsDraftThread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const activeRequestRef = useRef(null);

  const activeChat = useMemo(
    () => (isDraftThread ? null : chats.find((item) => item.id === activeChatId) || null),
    [activeChatId, chats, isDraftThread]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeChatId) {
      window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeChatId);
    } else {
      window.localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    }
  }, [activeChatId]);

  useEffect(() => {
    if (!chats.length) {
      if (activeChatId) setActiveChatId(null);
      return;
    }
    if (isDraftThread) return;
    const exists = chats.some((item) => item.id === activeChatId);
    if (!exists) setActiveChatId(chats[0].id);
  }, [activeChatId, chats, isDraftThread]);

  const upsertChat = useCallback((chatId, updater) => {
    setChats((prev) => {
      const index = prev.findIndex((item) => item.id === chatId);
      if (index < 0) return prev;
      const next = [...prev];
      const updated = updater(next[index]);
      next[index] = updated;
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      return next;
    });
  }, []);

  const createChat = useCallback((text) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const chat = {
      id,
      title: text.trim().slice(0, 42) || "New Chat",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(id);
    setIsDraftThread(false);
    return id;
  }, []);

  const fallbackChatWithMessages = useMemo(
    () => chats.find((item) => Array.isArray(item.messages) && item.messages.length > 0) || null,
    [chats]
  );

  const canCreateNewThread = useMemo(() => {
    if (isLoading) return false;
    if (isDraftThread) return false;
    if (activeChat && Array.isArray(activeChat.messages)) return activeChat.messages.length > 0;
    return Boolean(fallbackChatWithMessages);
  }, [activeChat, fallbackChatWithMessages, isDraftThread, isLoading]);

  const runAssistant = useCallback(
    async ({ chatId, userText, actionKey, history }) => {
      const requestId = crypto.randomUUID();
      activeRequestRef.current = requestId;
      setIsLoading(true);
      try {
        const payload = buildBackendPayload(userText, actionKey, webSearchEnabled, history);
        const response = await askChat(payload);
        if (activeRequestRef.current !== requestId) return;

        const assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            response?.answer ||
            "I could not generate a response from the backend. Please try again.",
          sources: response?.sources || [],
          createdAt: Date.now(),
        };

        upsertChat(chatId, (existing) => ({
          ...existing,
          updatedAt: Date.now(),
          messages: [...existing.messages, assistantMessage],
        }));
      } catch (error) {
        if (activeRequestRef.current !== requestId) return;
        const errorMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error?.response?.data?.detail ||
            error?.message ||
            "Request failed. Check backend status and try again.",
          createdAt: Date.now(),
        };
        upsertChat(chatId, (existing) => ({
          ...existing,
          updatedAt: Date.now(),
          messages: [...existing.messages, errorMessage],
        }));
      } finally {
        if (activeRequestRef.current === requestId) {
          activeRequestRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [upsertChat, webSearchEnabled]
  );

  const handleSend = useCallback(
    async (text) => {
      const normalized = text.trim();
      if (!normalized || isLoading) return;

      const chatId = activeChat?.id || createChat(normalized);
      const actionKey = inferActionKey(normalized, selectedAction);
      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: normalized,
        createdAt: Date.now(),
      };

      let history = [];
      upsertChat(chatId, (existing) => {
        history = [...existing.messages, userMessage];
        return {
          ...existing,
          title: existing.messages.length ? existing.title : normalized.slice(0, 42),
          updatedAt: Date.now(),
          messages: history,
        };
      });

      setDraft("");
      setSelectedAction(null);
      await runAssistant({ chatId, userText: normalized, actionKey, history });
    },
    [activeChat?.id, createChat, isLoading, runAssistant, selectedAction, upsertChat]
  );

  const handleStop = useCallback(() => {
    activeRequestRef.current = null;
    setIsLoading(false);
  }, []);

  const handleDeleteThread = useCallback(
    (chatId) => {
      setChats((prev) => prev.filter((item) => item.id !== chatId));
      if (activeChatId === chatId) setActiveChatId(null);
    },
    [activeChatId]
  );

  const handleCreateNewThread = useCallback(() => {
    if (!canCreateNewThread) return;
    setIsDraftThread(true);
    setActiveChatId(null);
    setDraft("");
    setSelectedAction(null);
  }, [canCreateNewThread]);

  const handleActionSelect = useCallback((actionKey) => {
    setSelectedAction((prev) => (prev === actionKey ? null : actionKey));
  }, []);

  const handleClearAction = useCallback(() => {
    setSelectedAction(null);
  }, []);

  const handleSuggestionSend = useCallback(
    async (suggestionText) => {
      if (!suggestionText?.trim()) return;
      setDraft(suggestionText);
      await handleSend(suggestionText);
    },
    [handleSend]
  );

  const handleCopy = useCallback(async (content) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Keep silent for unsupported clipboard environments.
    }
  }, []);

  const handleRegenerate = useCallback(
    async (assistantMessageId) => {
      if (!activeChat || isLoading) return;
      const assistantIndex = activeChat.messages.findIndex((m) => m.id === assistantMessageId);
      if (assistantIndex < 0) return;

      const historyBeforeAssistant = activeChat.messages.slice(0, assistantIndex);
      let lastUserText = "";
      for (let i = historyBeforeAssistant.length - 1; i >= 0; i -= 1) {
        if (historyBeforeAssistant[i].role === "user") {
          lastUserText = historyBeforeAssistant[i].content;
          break;
        }
      }
      if (!lastUserText) return;

      upsertChat(activeChat.id, (existing) => ({
        ...existing,
        messages: existing.messages.filter((m) => m.id !== assistantMessageId),
        updatedAt: Date.now(),
      }));

      const refreshedHistory = historyBeforeAssistant;
      await runAssistant({
        chatId: activeChat.id,
        userText: lastUserText,
        actionKey: inferActionKey(lastUserText, null),
        history: refreshedHistory,
      });
    },
    [activeChat, isLoading, runAssistant, upsertChat]
  );

  return (
    <div className="app-shell h-screen text-slate-100">
      <div className="flex h-full">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(chatId) => {
            setIsDraftThread(false);
            setActiveChatId(chatId);
          }}
          onNewThread={handleCreateNewThread}
          canCreateNewThread={canCreateNewThread}
          onDeleteThread={handleDeleteThread}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        />
        <Chat
          chat={activeChat}
          actions={ACTIONS}
          actionSuggestions={ACTION_SUGGESTIONS}
          draft={draft}
          onDraftChange={setDraft}
          selectedAction={selectedAction}
          onActionSelect={handleActionSelect}
          onClearAction={handleClearAction}
          onSend={handleSend}
          onSuggestionSend={handleSuggestionSend}
          onCreateThread={handleCreateNewThread}
          canCreateNewThread={canCreateNewThread}
          isLoading={isLoading}
          onStop={handleStop}
          webSearchEnabled={webSearchEnabled}
          onWebSearchToggle={() => setWebSearchEnabled((prev) => !prev)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onCopy={handleCopy}
          onRegenerate={handleRegenerate}
        />
      </div>
    </div>
  );
}
