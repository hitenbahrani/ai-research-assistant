import {
  ArrowUp,
  Compass,
  FilePlus2,
  Globe,
  MessageCircleMore,
  Search,
  Sparkles,
  Square,
  WandSparkles,
} from "lucide-react";

export default function InputBar({
  value,
  onChange,
  onSend,
  isLoading,
  onStop,
  webSearchEnabled,
  onWebSearchToggle,
  actions,
  selectedAction,
  onActionSelect,
  suggestions,
  onSuggestionClick,
  onCreateThread,
  canCreateNewThread,
  showActionGrid,
}) {
  const canSend = value.trim().length > 0 && !isLoading;

  const submit = () => {
    if (!value.trim()) return;
    onSend(value);
  };

  return (
    <div className="w-full max-w-[900px] mx-auto relative">
      <div className="rounded-[28px] border border-cyan-300/20 bg-gradient-to-b from-slate-900/85 to-slate-950/65 overflow-hidden backdrop-blur-md shadow-[0_18px_56px_rgba(0,12,30,.5)]">
        <div className="px-5 pt-4">
          <textarea
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything..."
            className="w-full bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-400/60 text-lg min-h-[36px]"
          />
        </div>

        <div className="px-4 py-2.5 border-t border-cyan-300/10 flex items-center justify-between gap-3">
          <div data-mode-toggle className="relative">
            <button
              type="button"
              onClick={onWebSearchToggle}
              className={`h-9 rounded-full border px-3 inline-flex items-center gap-2 transition ${
                webSearchEnabled
                  ? "border-cyan-200/60 bg-cyan-500/15 text-cyan-100"
                  : "border-cyan-300/20 bg-[#031023] text-slate-300/80 hover:text-slate-100"
              }`}
              aria-label="Toggle web search"
            >
              <Globe size={15} />
              <span className="text-xs font-medium">Web</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCreateThread}
              disabled={!canCreateNewThread}
              className="h-9 w-9 rounded-full grid place-items-center border border-cyan-300/20 text-cyan-100/70 enabled:hover:bg-cyan-300/10 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="New thread"
            >
              <FilePlus2 size={16} />
            </button>

            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="h-10 w-10 rounded-full grid place-items-center bg-sky-500 hover:bg-sky-400 text-slate-900 transition"
                aria-label="Stop generating"
              >
                <Square size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                className="h-10 w-10 rounded-full grid place-items-center bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 transition"
                aria-label="Send"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div data-suggestion-panel className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSuggestionClick(item)}
              className="w-full text-left h-11 px-4 rounded-xl border border-cyan-300/20 bg-slate-900/45 hover:bg-slate-800/80 transition text-slate-200/92 flex items-center gap-2"
            >
              <Search size={16} className="text-cyan-200/75" />
              <span className="truncate">{item}</span>
            </button>
          ))}
        </div>
      )}

      {showActionGrid && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 pb-2">
          {actions.map((action) => {
            const active = selectedAction === action.key;
            return (
              <button
                data-action-chip
                key={action.key}
                type="button"
                onClick={() => {
                  onActionSelect(action.key);
                }}
                className={`h-10 rounded-xl border px-4 text-left flex items-center gap-2 transition ${
                  active
                    ? "border-cyan-200/55 bg-sky-600/20 text-cyan-100"
                    : "border-cyan-300/20 bg-slate-900/45 hover:bg-slate-900/75 text-slate-100/90"
                }`}
              >
                {action.key === "research" && <Search size={16} />}
                {action.key === "compare" && <Compass size={16} />}
                {action.key === "latest" && <WandSparkles size={16} />}
                {action.key === "summarize" && <MessageCircleMore size={16} />}
                {action.key === "explain" && <MessageCircleMore size={16} />}
                {action.key === "brainstorm" && <Sparkles size={16} />}
                {action.key === "validate" && <Search size={16} />}
                {action.key === "plan" && <Compass size={16} />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
