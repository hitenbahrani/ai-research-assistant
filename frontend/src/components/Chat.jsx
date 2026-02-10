import { PanelLeftOpen, Settings2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import InputBar from "./InputBar";
import Message from "./Message";
import NovaLogo from "./NovaLogo";

export default function Chat({
  chat,
  actions,
  actionSuggestions,
  draft,
  onDraftChange,
  selectedAction,
  onActionSelect,
  onClearAction,
  onSend,
  onSuggestionSend,
  onCreateThread,
  canCreateNewThread,
  isLoading,
  onStop,
  webSearchEnabled,
  onWebSearchToggle,
  sidebarCollapsed,
  onToggleSidebar,
  onCopy,
  onRegenerate,
}) {
  const isEmptyScreen = !chat || chat.messages.length === 0;
  const scrollRef = useRef(null);
  const shellRef = useRef(null);

  const activeAction = selectedAction;

  const suggestions = useMemo(() => {
    if (!activeAction) return [];
    return actionSuggestions[activeAction] || [];
  }, [actionSuggestions, activeAction]);

  const latestAssistantId = useMemo(() => {
    if (!chat) return null;
    for (let index = chat.messages.length - 1; index >= 0; index -= 1) {
      if (chat.messages[index].role === "assistant") return chat.messages[index].id;
    }
    return null;
  }, [chat]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat?.messages.length, isLoading]);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (!shellRef.current) return;
      if (!shellRef.current.contains(event.target)) return;
      const shouldIgnore =
        event.target.closest("[data-action-chip]") ||
        event.target.closest("[data-mode-toggle]") ||
        event.target.closest("[data-suggestion-panel]");
      if (!shouldIgnore) onClearAction();
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClearAction]);

  return (
    <main ref={shellRef} className="flex-1 h-screen relative overflow-hidden border-l border-cyan-300/10">
      <div className="absolute inset-0 workspace-bg" />
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="absolute left-5 top-5 z-20 h-8 w-8 rounded-md grid place-items-center text-cyan-100/75 hover:bg-cyan-200/10"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}
      <div className="absolute right-5 top-5 text-cyan-200/70">
        <button
          type="button"
          className="h-8 w-8 rounded-full grid place-items-center hover:bg-cyan-200/10 transition"
          aria-label="Settings"
        >
          <Settings2 size={15} />
        </button>
      </div>

      {isEmptyScreen ? (
        <div className="relative z-10 h-full flex items-center justify-center px-6 py-8">
          <div className="max-w-[900px] w-full text-center">
            <div className="inline-flex p-4 rounded-3xl border border-cyan-300/20 bg-slate-900/40">
              <NovaLogo size={48} />
            </div>
            <h1 className="mt-5 text-[clamp(22px,3.7vw,48px)] font-semibold tracking-[-0.01em] leading-[1.08] text-slate-100">
              Ask anything. Nova will deliver clarity.
            </h1>
            <p className="mt-4 text-[clamp(13px,1.35vw,20px)] text-slate-300/75 max-w-3xl mx-auto leading-relaxed">
              A premium AI workspace for live research, synthesis, comparison, and execution planning.
            </p>
            <div className="mt-7 pb-1">
              <InputBar
                value={draft}
                onChange={onDraftChange}
                onSend={onSend}
                isLoading={isLoading}
                onStop={onStop}
                webSearchEnabled={webSearchEnabled}
                onWebSearchToggle={onWebSearchToggle}
                actions={actions}
                selectedAction={activeAction}
                onActionSelect={onActionSelect}
                suggestions={suggestions}
                onSuggestionClick={onSuggestionSend}
                onCreateThread={onCreateThread}
                canCreateNewThread={canCreateNewThread}
                showActionGrid
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 h-full flex flex-col px-8 pb-4">
          <div ref={scrollRef} className="flex-1 overflow-y-auto pt-10">
            <div className="max-w-4xl mx-auto pb-8 space-y-10">
              {chat.messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  isLatestAssistant={latestAssistantId === message.id}
                  onCopy={onCopy}
                  onRegenerate={onRegenerate}
                />
              ))}

              {isLoading && (
                <div className="max-w-4xl">
                  <div className="flex items-center gap-3 text-slate-300/80">
                    <div className="h-7 w-7 rounded-full bg-slate-900/75 border border-cyan-300/20 grid place-items-center">
                      <span className="animate-pulse">••</span>
                    </div>
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 pb-3">
            <InputBar
              value={draft}
              onChange={onDraftChange}
              onSend={onSend}
              isLoading={isLoading}
              onStop={onStop}
              webSearchEnabled={webSearchEnabled}
              onWebSearchToggle={onWebSearchToggle}
              actions={actions}
              selectedAction={activeAction}
              onActionSelect={onActionSelect}
              suggestions={suggestions}
              onSuggestionClick={onSuggestionSend}
              onCreateThread={onCreateThread}
              canCreateNewThread={canCreateNewThread}
              showActionGrid={false}
            />
          </div>
        </div>
      )}
    </main>
  );
}
