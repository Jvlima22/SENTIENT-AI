import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { ProductCard } from "@/components/ProductCard";
import { Search, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { t } = useI18n();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState("");
  const [aiRecs, setAiRecs] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { api.get("/categories").then((r) => setCategories(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (cat !== "all") params.category = cat;
    if (type !== "all") params.type = type;
    if (search) params.search = search;
    const id = setTimeout(() => {
      api.get("/products", { params }).then((r) => { setProducts(r.data); setLoading(false); });
    }, 250);
    return () => clearTimeout(id);
  }, [cat, type, search]);

  const runAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await api.post("/ai/recommend", { query: aiQuery });
      setAiRecs(data.recommendations || []);
    } catch { toast.error("Falha na busca inteligente"); }
    finally { setAiLoading(false); }
  };

  const featured = products.filter((p) => p.featured);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1544380904-c686aad2fc40?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV0d29yayUyMG5lb258ZW58MHx8fHwxNzg1MTk5Mjg1fDA&ixlib=rb-4.1.0&q=85"
            alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/70 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/5 px-4 py-1.5 mb-6" data-testid="hero-tag">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-xs text-[#00F0FF] font-mono-code uppercase tracking-wide">{t("hero_tag")}</span>
          </div>
          <h1 className="font-display font-800 text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl mb-6">
            {t("hero_title")}
          </h1>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mb-10 leading-relaxed">{t("hero_sub")}</p>
          <div className="flex flex-wrap gap-4">
            <a href="#catalogo" className="bg-[#00F0FF] text-black font-medium px-6 py-3 rounded-full hover:bg-white transition-colors flex items-center gap-2" data-testid="hero-explore-btn">
              {t("explore")} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Smart search */}
      <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-12">
        <div className="rounded-2xl glass p-6 md:p-8 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#00F0FF]" />
            <h2 className="font-display text-lg">{t("smart_search")}</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAI()} data-testid="ai-search-input"
              placeholder={t("ai_placeholder")}
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-[#00F0FF]/50 transition-colors" />
            <button onClick={runAI} disabled={aiLoading} data-testid="ai-search-btn"
              className="bg-[#00F0FF] text-black font-medium px-6 py-3 rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {t("recommend")}
            </button>
          </div>
          {aiRecs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6" data-testid="ai-recommendations">
              {aiRecs.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-8">
          <h2 className="font-display text-2xl mb-6">{t("featured")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* Catalog */}
      <section id="catalogo" className="max-w-[1400px] mx-auto px-5 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <h2 className="font-display text-2xl">{t("all_resources")}</h2>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} data-testid="search-input"
              placeholder={t("search")}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-[#00F0FF]/50 transition-colors" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          <FilterChip active={cat === "all"} onClick={() => setCat("all")} testid="cat-all">{t("all")}</FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} testid={`cat-${c.slug}`}>{c.name}</FilterChip>
          ))}
          <span className="mx-2 w-px h-5 bg-white/10" />
          <FilterChip active={type === "all"} onClick={() => setType("all")} testid="type-all">{t("all")}</FilterChip>
          <FilterChip active={type === "free"} onClick={() => setType("free")} testid="type-free">{t("free")}</FilterChip>
          <FilterChip active={type === "paid"} onClick={() => setType("paid")} testid="type-paid">{t("paid")}</FilterChip>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" /></div>
        ) : products.length === 0 ? (
          <p className="text-white/40 py-20 text-center" data-testid="no-results">{t("no_results")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}

const FilterChip = ({ active, onClick, children, testid }) => (
  <button onClick={onClick} data-testid={`filter-${testid}`}
    className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
      active ? "bg-[#00F0FF] text-black border-[#00F0FF]" : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"}`}>
    {children}
  </button>
);
