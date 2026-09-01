import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { MessageCircle, Send, Instagram, Youtube, Gamepad2, ArrowUpRight, Users, Loader2 } from "lucide-react";

const ICONS = { "message-circle": MessageCircle, send: Send, instagram: Instagram, youtube: Youtube, "gamepad-2": Gamepad2 };

export default function Community() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/community").then((r) => { setLinks(r.data); setLoading(false); }); }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-12">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-6 h-6 text-[#FF7A59]" />
        <span className="text-xs uppercase tracking-wide text-[#FF7A59] font-mono-code">Conecte-se</span>
      </div>
      <h1 className="font-display font-800 text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">Comunidade</h1>
      <p className="text-white/55 max-w-2xl mb-12 leading-relaxed">Participe dos nossos canais, receba novidades em primeira mão e troque ideias com a comunidade SENTIENT-AI.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#FF7A59] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="community-grid">
          {links.map((l, i) => {
            const Icon = ICONS[l.icon] || MessageCircle;
            return (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" data-testid={`community-${l.platform}`}
                className="grid-fade-in group rounded-xl bg-[#0F0F13] border border-white/10 p-6 hover:border-[#FF7A59]/30 hover:-translate-y-1 transition-transform transition-colors"
                style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#FF7A59]/10 flex items-center justify-center group-hover:bg-[#FF7A59]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#FF7A59]" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-[#FF7A59] transition-colors" />
                </div>
                <h3 className="font-display text-lg mb-2">{l.name}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{l.description}</p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
