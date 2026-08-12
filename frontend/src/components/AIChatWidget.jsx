import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { API } from "@/lib/api";

export const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Olá! Sou o assistente do SENTIENT-AI. Como posso ajudar você a encontrar recursos hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionRef.current }),
      });
      sessionRef.current = res.headers.get("X-Session-Id") || sessionRef.current;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Erro de conexão. Tente novamente." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} data-testid="ai-chat-toggle"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#FF7A59] flex items-center justify-center cyan-glow hover:scale-105 transition-transform">
        {open ? <X className="w-6 h-6 text-black" /> : <MessageSquare className="w-6 h-6 text-black" />}
      </button>

      {open && (
        <div data-testid="ai-chat-panel"
          className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[520px] rounded-2xl glass cyan-glow flex flex-col overflow-hidden border border-[#FF7A59]/30">
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/40">
            <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden p-1.5">
              <img src="/logo-icon.png" alt="" className="w-full h-full object-contain select-none" draggable={false} />
            </div>
            <div>
              <p className="font-display text-sm">Assistente IA</p>
              <p className="text-xs text-white/40">Powered by Claude</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`chat-msg-${m.role}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "bg-[#FF7A59] text-black" : "bg-white/5 text-white/85 border border-white/10"}`}>
                  {m.content || (loading && i === messages.length - 1 ? "..." : "")}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-white/10 flex items-center gap-2 bg-black/40">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()} data-testid="chat-input"
              placeholder="Pergunte algo..." disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50 transition-colors" />
            <button onClick={send} disabled={loading} data-testid="chat-send"
              className="w-10 h-10 rounded-full bg-[#FF7A59] flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50">
              <Send className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
