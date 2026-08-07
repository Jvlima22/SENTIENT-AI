import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Package, Users, UserCheck, Download, ShoppingBag, TrendingUp, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [m, setM] = useState(null);
  useEffect(() => { api.get("/admin/metrics").then((r) => setM(r.data)); }, []);

  if (!m) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" /></div>;

  const cards = [
    { label: "Produtos", value: m.total_products, icon: Package, sub: `${m.free_products} grátis · ${m.paid_products} pagos` },
    { label: "Leads", value: m.total_leads, icon: Users, sub: "capturados" },
    { label: "Usuários", value: m.total_users, icon: UserCheck, sub: "cadastrados" },
    { label: "Downloads", value: m.total_downloads, icon: Download, sub: "realizados" },
    { label: "Compras", value: m.total_purchases, icon: ShoppingBag, sub: "iniciadas" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Dashboard</h1>
      <p className="text-white/50 text-sm mb-8">Visão geral do hub SENTIENT-AI</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8" data-testid="metrics-cards">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-[#0F0F13] border border-white/10 p-5">
            <c.icon className="w-5 h-5 text-[#00F0FF] mb-3" />
            <p className="font-display text-3xl">{c.value}</p>
            <p className="text-sm text-white/70 mt-1">{c.label}</p>
            <p className="text-xs text-white/35 font-mono-code mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-[#0F0F13] border border-white/10 p-5">
          <h3 className="font-display text-base mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#00F0FF]" /> Mais vistos</h3>
          <div className="space-y-3">
            {m.top_products.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white/70 line-clamp-1">{p.title}</span>
                <span className="text-white/40 font-mono-code shrink-0 ml-3">{p.views} views · {p.downloads} dl</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[#0F0F13] border border-white/10 p-5">
          <h3 className="font-display text-base mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#00F0FF]" /> Leads recentes</h3>
          <div className="space-y-3">
            {m.recent_leads.length === 0 ? <p className="text-white/40 text-sm">Sem leads ainda.</p> : m.recent_leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{l.name}</span>
                <span className="text-white/40 font-mono-code text-xs shrink-0 ml-3">{l.product_title || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
