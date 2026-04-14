"use client";

import { useState, useRef, useEffect } from "react";
import { answerPolicyQuestion, SUGGESTED_QUESTIONS } from "@/lib/policy-chat-engine";

interface Message {
  role: "user" | "bot";
  text: string;
}

function SimpleMarkdown({ text }: { text: string }) {
  const html = text
    .replace(/---/g, '<hr class="my-2 border-zinc-700" />')
    .replace(/\*\*(.+?)\*\*/g, "<strong class='text-zinc-100'>$1</strong>")
    .replace(/^[•\-]\s+(.+)$/gm, '<div class="flex gap-1.5 ml-1"><span class="text-zinc-500 shrink-0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div class="h-2"></div>')
    .replace(/\n/g, "<br />");
  return <div className="policy-msg" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function PolicyChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const answer = answerPolicyQuestion(trimmed);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }, { role: "bot", text: answer }]);
    setInput("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg hover:bg-[var(--accent-muted)] transition-all flex items-center justify-center z-50"
        title="Policy Chatbot"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-[420px] max-h-[580px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--accent)]/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center text-sm">📋</div>
            <div>
              <h3 className="font-medium text-sm text-[var(--foreground)]">Policy Assistant</h3>
              <p className="text-xs text-zinc-400">Ask about channels, rules & guidelines</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[420px]">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 mb-3">Try a question:</p>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-md bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:text-[var(--foreground)] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "max-w-[80%] bg-[var(--accent)] text-white"
                      : "max-w-[95%] bg-zinc-800/80 text-zinc-300"
                  }`}
                >
                  {msg.role === "bot" ? <SimpleMarkdown text={msg.text} /> : msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--card-border)]">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a channel or policy..."
                className="flex-1 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-sm text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-3 py-2 rounded-md bg-[var(--accent)] text-white text-sm disabled:opacity-50 hover:bg-[var(--accent-muted)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
