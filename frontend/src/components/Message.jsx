import { Bot, Copy, RefreshCw, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Message({ message, isLatestAssistant, onCopy, onRegenerate }) {
  const isUser = message.role === "user";

  return (
    <div className="max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="h-7 w-7 rounded-full bg-slate-900/70 border border-cyan-300/20 grid place-items-center text-cyan-100/85">
          {isUser ? <User size={15} /> : <Bot size={15} />}
        </div>

        <div className="flex-1">
          <div className={`leading-relaxed ${isUser ? "text-slate-100" : "text-slate-200/95"}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>

          {!isUser && (
            <div className="mt-2 flex items-center gap-2 text-slate-400">
              <button
                type="button"
                onClick={() => onCopy(message.content)}
                className="h-8 w-8 rounded-md grid place-items-center hover:bg-cyan-400/10 hover:text-cyan-200 transition"
                aria-label="Copy answer"
              >
                <Copy size={15} />
              </button>
              {isLatestAssistant && (
                <button
                  type="button"
                  onClick={() => onRegenerate(message.id)}
                  className="h-8 w-8 rounded-md grid place-items-center hover:bg-cyan-400/10 hover:text-cyan-200 transition"
                  aria-label="Regenerate answer"
                >
                  <RefreshCw size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
