import { BookOpenText, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from "lucide-react";
import NovaLogo from "./NovaLogo";

function formatThreadTime(timestamp) {
  const value = new Date(timestamp || Date.now());
  const now = new Date();
  const isToday = value.toDateString() === now.toDateString();
  if (isToday) {
    return `Today, ${value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return value.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewThread,
  canCreateNewThread,
  onDeleteThread,
  collapsed,
  onToggleCollapsed,
}) {
  return (
    <aside
      className={`h-screen overflow-hidden border-r border-cyan-400/10 bg-[#021124]/85 backdrop-blur-xl flex flex-col transition-all duration-300 ${
        collapsed ? "w-0 border-r-0" : "w-[280px]"
      }`}
    >
      <div className="px-4 pt-5 pb-4 border-b border-cyan-400/10">
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-slate-900/50 px-3 py-2 ${
              collapsed ? "justify-center w-10 px-0" : ""
            }`}
          >
            <NovaLogo size={20} />
            {!collapsed && <span className="text-cyan-100 font-medium tracking-wide">Nova Nexus AI</span>}
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="h-9 w-9 rounded-lg grid place-items-center text-cyan-100/70 hover:bg-cyan-300/10 hover:text-cyan-50 transition"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <button
          type="button"
          onClick={onNewThread}
          disabled={!canCreateNewThread}
          className={`mt-4 w-full rounded-xl border border-cyan-400/10 bg-slate-900/40 enabled:hover:bg-slate-900/75 transition px-3 py-2 text-cyan-100/85 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${
            collapsed ? "justify-center" : "text-left"
          }`}
        >
          <Plus size={16} />
          {!collapsed && "New"}
        </button>
      </div>

      {!collapsed && <div className="px-4 pt-4 text-sm text-slate-300/80">Threads</div>}

      {!collapsed && chats.length === 0 ? (
        <div className="px-4 pt-12 text-slate-300/35 text-center">Start a chat to create a thread</div>
      ) : !collapsed ? (
        <div className="mt-2 px-3 pb-4 overflow-y-auto space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`rounded-xl border transition ${
                chat.id === activeChatId
                  ? "border-cyan-300/30 bg-slate-400/20"
                  : "border-transparent hover:border-cyan-200/20 hover:bg-slate-300/10"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className="w-full text-left px-3 pt-3"
              >
                <div className="truncate text-slate-100/95 font-medium">{chat.title}</div>
                <div className="mt-1 pb-2 text-sm text-slate-300/70">
                  {formatThreadTime(chat.updatedAt || chat.createdAt)}
                </div>
              </button>

              <div className="px-3 pb-2 flex justify-end">
                <button
                  type="button"
                  className="h-7 w-7 rounded-md grid place-items-center text-slate-400 hover:text-rose-300 hover:bg-rose-400/15 transition"
                  onClick={() => onDeleteThread(chat.id)}
                  aria-label={`Delete ${chat.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className={`mt-auto px-4 py-4 border-t border-cyan-400/10 text-xs uppercase tracking-[0.22em] text-cyan-200/55 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
        <BookOpenText size={12} />
        {!collapsed && "Research Copilot"}
      </div>
    </aside>
  );
}
