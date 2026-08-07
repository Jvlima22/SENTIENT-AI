import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { useSearch } from "@/context/SearchContext";
import { ProductCard } from "@/components/ProductCard";
import { Search, Sparkles, ArrowRight, Loader2, Zap, Command } from "lucide-react";

export default function Home() {
  const { t } = useI18n();
  const { setOpen } = useSearch();
  const [params] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState(params.get("cat") || "all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/categories").then((r) => setCategories(r.data)); }, []);
  useEffect(() => { const c = params.get("cat"); if (c) setCat(c); }, [params]);

  useEffect(() => {
    setLoading(true);
    const p = {};
    if (cat !== "all") p.category = cat;
    if (type !== "all") p.type = type;
    if (search) p.search = search;
    const id = setTimeout(() => api.get("/products", { params: p }).then((r) => { setProducts(r.data); setLoading(false); }), 250);
    return () => clearTimeout(id);
  }, [cat, type, search]);

  const featured = products.filter((p) => p.featured);
  const stats = [
    { label: "Recursos", value: "50+" },
    { label: "Automações", value: "20+" },
    { label: "Skills Claude", value: "100+" },
    { label: "Gratuitos", value: "Vários" },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="aurora aurora-a" style={{ width: 520, height: 520, background: "radial-gradient(circle, rgba(0,240,255,0.35), transparent 70%)", top: -160, left: -80 }} />
        <div className="aurora aurora-b" style={{ width: 480, height: 480, background: "radial-gradient(circle, rgba(160,140,255,0.30), transparent 70%)", top: -60, right: -60 }} />
        <div className="aurora" style={{ width: 360, height: 360, background: "radial-gradient(circle, rgba(255,122,89,0.22), transparent 70%)", bottom: -120, left: "40%" }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-8 py-24 md:py-36 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-1.5 mb-8" data-testid="hero-tag">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-xs text-white/70 font-mono-code uppercase tracking-wide">{t("hero_tag")}</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display font-800 text-4xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight max-w-4xl mx-auto mb-6">
            Descubra, acesse e escale com <span className="gradient-text">recursos digitais</span> inteligentes
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="text-base md:text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">{t("hero_sub")}</motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center gap-5">
            <button onClick={() => setOpen(true)} data-testid="hero-search-btn"
              className="group w-full max-w-lg flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 backdrop-blur px-5 py-4 hover:border-[#00F0FF]/40 transition-colors cyan-glow">
              <Search className="w-5 h-5 text-white/40" />
              <span className="flex-1 text-left text-white/40">O que você procura hoje?</span>
              <kbd className="flex items-center gap-1 text-[11px] font-mono-code bg-white/8 border border-white/10 rounded px-2 py-1 text-white/50"><Command className="w-3 h-3" />K</kbd>
            </button>
            <a href="#catalogo" className="text-sm text-white/50 hover:text-[#00F0FF] transition-colors flex items-center gap-1.5" data-testid="hero-explore-btn">
              {t("explore")} <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.35 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mt-20">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl md:text-3xl gradient-text">{s.value}</p>
                <p className="text-xs text-white/40 font-mono-code mt-1 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* category marquee */}
        {categories.length > 0 && (
          <div className="relative z-10 overflow-hidden border-t border-white/10 py-4">
            <div className="flex gap-3 w-max marquee-track">
              {[...categories, ...categories, ...categories].map((c, i) => (
                <span key={i} className="flex items-center gap-2 text-sm text-white/50 border border-white/10 rounded-full px-4 py-1.5 whitespace-nowrap">
                  <Zap className="w-3.5 h-3.5 text-[#00F0FF]" /> {c.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-5 md:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs uppercase tracking-wide text-[#00F0FF] font-mono-code">Curadoria</span>
              <h2 className="font-display text-2xl md:text-3xl mt-1">{t("featured")}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* CATALOG */}
      <section id="catalogo" className="max-w-[1400px] mx-auto px-5 md:px-8 py-8 scroll-mt-20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <h2 className="font-display text-2xl md:text-3xl">{t("all_resources")}</h2>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} data-testid="search-input"
              placeholder={t("search")}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-[#00F0FF]/50 transition-colors" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-10">
          <Chip active={cat === "all"} onClick={() => setCat("all")} testid="cat-all">{t("all")}</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} testid={`cat-${c.slug}`}>{c.name}</Chip>
          ))}
          <span className="mx-2 w-px h-5 bg-white/10" />
          <Chip active={type === "all"} onClick={() => setType("all")} testid="type-all">{t("all")}</Chip>
          <Chip active={type === "free"} onClick={() => setType("free")} testid="type-free">{t("free")}</Chip>
          <Chip active={type === "paid"} onClick={() => setType("paid")} testid="type-paid">{t("paid")}</Chip>
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

const Chip = ({ active, onClick, children, testid }) => (
  <button onClick={onClick} data-testid={`filter-${testid}`}
    className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
      active ? "bg-[#00F0FF] text-black border-[#00F0FF]" : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"}`}>
    {children}
  </button>
);
