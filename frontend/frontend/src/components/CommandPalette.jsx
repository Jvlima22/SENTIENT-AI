import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, Package, Terminal, HelpCircle, ArrowRight, Loader2, CornerDownLeft, X } from "lucide-react";
import api from "@/lib/api";
import { useSearch } from "@/context/SearchContext";

export const CommandPalette = () => {
  const { open, setOpen } = useSearch();
  const [q, setQ] = useState("");
  const [data, setData] = useState({ products: [], skills: [], faqs: [], categories: [], popular: [] });
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiRecs, setAiRecs] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const inputRef = useRef(null);
  const nav = useNavigate();

  // global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQ(""); setAiMode(false); setAiRecs(null);
    }
  }, [open]);

  const fetchResults = useCallback((query) => {
    setLoading(true);
    api.get("/search", { params: query ? { q: query } : {} })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => fetchResults(q), 220);
    return () => clearTimeout(id);
  }, [q, open, fetchResults]);

  const go = (path) => { setOpen(false); nav(path); };

  const runAI = async () => {
    if (!q.trim()) return;
    setAiMode(true); setAiLoading(true); setAiRecs(null);
    try {
      const { data } = await api.post("/ai/recommend", { query: q });
      setAiRecs(data.recommendations || []);
    } finally { setAiLoading(false); }
  };

  const hasResults = data.products.length || data.skills.length || data.faqs.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)} data-testid="command-palette-overlay">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0A0A0F]/95 shadow-2xl overflow-hidden"
            style={{ boxShadow: "0 0 60px rgba(0,240,255,0.08), 0 30px 80px rgba(0,0,0,0.6)" }}
            data-testid="command-palette">
            {/* input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <Search className="w-5 h-5 text-white/40 shrink-0" />
              <input ref={inputRef} value={q}
                onChange={(e) => { setQ(e.target.value); setAiMode(false); }}
                onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) runAI(); }}
                placeholder="Buscar produtos, skills, categorias..." data-testid="command-input"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-white/30" />
              <button onClick={runAI} disabled={!q.trim()} data-testid="command-ai-btn"
                className="hidden sm:flex items-center gap-1.5 text-xs bg-[#FF7A59]/10 text-[#FF7A59] border border-[#FF7A59]/30 rounded-full px-3 py-1.5 hover:bg-[#FF7A59]/20 transition-colors disabled:opacity-40">
                <Sparkles className="w-3.5 h-3.5" /> Perguntar à IA
              </button>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors sm:hidden"><X className="w-5 h-5" /></button>
            </div>

            {/* body */}
            <div className="max-h-[55vh] overflow-y-auto p-3">
              {aiMode ? (
                <div data-testid="command-ai-results">
                  <SectionLabel icon={Sparkles}>Recomendações da IA</SectionLabel>
                  {aiLoading ? (
                    <div className="flex items-center gap-2 px-3 py-6 text-white/50 text-sm"><Loader2 className="w-4 h-4 animate-spin text-[#FF7A59]" /> Analisando o catálogo...</div>
                  ) : (
                    (aiRecs || []).map((p) => <ProductRow key={p.id} p={p} onClick={() => go(`/produto/${p.id}`)} />)
                  )}
                </div>
              ) : loading && !hasResults ? (
                <div className="flex items-center gap-2 px-3 py-6 text-white/50 text-sm"><Loader2 className="w-4 h-4 animate-spin text-[#FF7A59]" /> Buscando...</div>
              ) : !q ? (
                <div>
                  <SectionLabel>Categorias</SectionLabel>
                  <div className="flex flex-wrap gap-2 px-3 pb-3">
                    {data.categories.map((c) => (
                      <button key={c.id} onClick={() => go(`/?cat=${c.id}`)} data-testid={`command-cat-${c.slug}`}
                        className="text-sm border border-white/12 text-white/70 rounded-full px-3.5 py-1.5 hover:border-[#FF7A59]/50 hover:text-[#FF7A59] transition-colors">
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <SectionLabel icon={Sparkles}>Populares</SectionLabel>
                  {data.popular.map((p) => <ProductRow key={p.id} p={p} onClick={() => go(`/produto/${p.id}`)} />)}
                </div>
              ) : !hasResults ? (
                <div className="px-3 py-8 text-center text-white/40 text-sm">
                  Nada encontrado para "<span className="text-white/70">{q}</span>".
                  <button onClick={runAI} className="block mx-auto mt-3 text-[#FF7A59] hover:underline flex items-center gap-1.5 justify-center">
                    <Sparkles className="w-4 h-4" /> Perguntar à IA
                  </button>
                </div>
              ) : (
                <div data-testid="command-results">
                  {data.products.length > 0 && (
                    <><SectionLabel icon={Package}>Produtos</SectionLabel>
                      {data.products.map((p) => <ProductRow key={p.id} p={p} onClick={() => go(`/produto/${p.id}`)} />)}</>
                  )}
                  {data.skills.length > 0 && (
                    <><SectionLabel icon={Terminal}>Skills Claude</SectionLabel>
                      {data.skills.map((s) => (
                        <Row key={s.id} onClick={() => go("/skills")} testid={`command-skill-${s.id}`}
                          icon={<Terminal className="w-4 h-4 text-[#FF7A59]" />} title={s.title} sub={s.category} />
                      ))}</>
                  )}
                  {data.faqs.length > 0 && (
                    <><SectionLabel icon={HelpCircle}>FAQ</SectionLabel>
                      {data.faqs.map((f) => (
                        <Row key={f.id} onClick={() => go("/faq")} testid={`command-faq-${f.id}`}
                          icon={<HelpCircle className="w-4 h-4 text-[#FF7A59]" />} title={f.question} sub={f.category} />
                      ))}</>
                  )}
                </div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-[11px] text-white/35 font-mono-code">
              <span className="flex items-center gap-1.5"><CornerDownLeft className="w-3.5 h-3.5" /> IA · <span className="text-white/25">esc</span> fechar</span>
              <span>SENTIENT-AI</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SectionLabel = ({ children, icon: Icon }) => (
  <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5 text-[11px] uppercase tracking-wide text-white/35 font-mono-code">
    {Icon && <Icon className="w-3.5 h-3.5" />} {children}
  </div>
);

const Row = ({ icon, title, sub, onClick, testid, right }) => (
  <button onClick={onClick} data-testid={testid}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group">
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-white/90 truncate">{title}</p>
      {sub && <p className="text-xs text-white/40 truncate font-mono-code">{sub}</p>}
    </div>
    {right}
    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#FF7A59] transition-colors shrink-0" />
  </button>
);

const ProductRow = ({ p, onClick }) => (
  <button onClick={onClick} data-testid={`command-product-${p.id}`}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group">
    <img src={p.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-white/90 truncate">{p.title}</p>
      <p className="text-xs text-white/40 truncate font-mono-code">{p.category_name}</p>
    </div>
    {p.type === "free"
      ? <span className="text-[10px] border border-white/20 text-white/60 rounded-full px-2 py-0.5 font-mono-code shrink-0">Grátis</span>
      : <span className="text-[10px] bg-[#ff7a59] text-black font-bold rounded-full px-2 py-0.5 font-mono-code shrink-0">R$ {p.price}</span>}
    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#FF7A59] transition-colors shrink-0" />
  </button>
);
