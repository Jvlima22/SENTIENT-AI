import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { Copy, Check, Terminal, Search, Loader2 } from "lucide-react";

export default function Skills() {
  const { t } = useI18n();
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (cat !== "all") params.category = cat;
    if (search) params.search = search;
    const id = setTimeout(() => api.get("/skills", { params }).then((r) => { setSkills(r.data); setLoading(false); }), 250);
    return () => clearTimeout(id);
  }, [search, cat]);

  const [allCats, setAllCats] = useState([]);
  useEffect(() => { api.get("/skills").then((r) => setAllCats([...new Set(r.data.map((s) => s.category))])); }, []);

  const copy = (skill) => {
    navigator.clipboard.writeText(skill.command);
    setCopied(skill.id);
    toast.success(t("copied"));
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-12">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-6 h-6 text-[#00F0FF]" />
        <span className="text-xs uppercase tracking-wide text-[#00F0FF] font-mono-code">Prompt Library</span>
      </div>
      <h1 className="font-display font-800 text-4xl md:text-5xl tracking-tight mb-4">{t("skills")}</h1>
      <p className="text-white/55 max-w-2xl mb-10 leading-relaxed">Comandos e prompts avançados prontos para usar com o Claude. Copie com um clique e turbine sua produtividade.</p>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} data-testid="skills-search"
            placeholder="Buscar skills..." className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-[#00F0FF]/50 transition-colors" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>{t("all")}</Chip>
          {allCats.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="skills-grid">
          {skills.map((s, i) => (
            <div key={s.id} data-testid={`skill-card-${s.id}`} className="grid-fade-in group rounded-xl bg-[#0A0A0F] border border-white/10 p-5 hover:border-[#00F0FF]/30 transition-colors"
              style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[11px] uppercase text-[#00F0FF]/70 font-mono-code tracking-wide">{s.category}</span>
                  <h3 className="font-display text-lg mt-1">{s.title}</h3>
                </div>
                <button onClick={() => copy(s)} data-testid={`skill-copy-${s.id}`}
                  className="shrink-0 flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors">
                  {copied === s.id ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === s.id ? t("copied") : t("copy")}
                </button>
              </div>
              <p className="text-sm text-white/50 mb-4">{s.description}</p>
              <pre className="bg-black/50 border border-white/5 rounded-lg p-4 text-xs text-white/70 font-mono-code overflow-x-auto whitespace-pre-wrap max-h-40">{s.command}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const Chip = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${active ? "bg-[#00F0FF] text-black border-[#00F0FF]" : "border-white/15 text-white/60 hover:border-white/40"}`}>{children}</button>
);
