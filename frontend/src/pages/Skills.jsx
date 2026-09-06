import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Blocks,
  Bookmark,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Flame,
  GitBranch,
  History,
  Loader2,
  MessageCircle,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Terminal,
  X,
} from "lucide-react";

const ALL = "all";

const AI_OPTIONS = [
  { id: ALL, label: "Todas as IAs", icon: "✨" },
  {
    id: "claude",
    label: "Claude",
    logo: "/ai-logos/claude.svg",
    activeLogo:
      "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/claude.png",
  },
  { id: "chatgpt", label: "ChatGPT", logo: "/ai-logos/openai.svg" },
  {
    id: "cursor",
    label: "Cursor / MCP",
    logo:
      "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/cursor.png",
    activeLogo:
      "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/cursor.png",
  },
  { id: "gemini", label: "Gemini", logo: "/ai-logos/gemini.svg" },
  { id: "perplexity", label: "Perplexity", logo: "/ai-logos/perplexity.svg" },
];

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function getSkillRepoUrl(skill) {
  if (skill?.github_url && skill.github_url.trim()) return skill.github_url;
  if (skill?.github_repo && skill.github_repo.trim()) return `https://github.com/${skill.github_repo}`;
  return "#";
}

function formatStars(count) {
  if (!count) return null;
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

function dedupeSkills(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter((item) => {
    if (!item) return false;
    const repo = (item.github_repo || "").toLowerCase().trim();
    const title = (item.title || "").toLowerCase().trim();
    const id = item.id || item.public_id || "";
    const key = repo || title || id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Skills() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { skillId } = useParams();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [targetAi, setTargetAi] = useState(ALL);
  const [source, setSource] = useState(ALL);
  const [sort, setSort] = useState("stars");

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [openSkill, setOpenSkill] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const toolbarRef = useRef(null);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carrega catálogo base
  const fetchCatalog = () => {
    api
      .get("/skills")
      .then((r) => setCatalog(dedupeSkills(r.data)))
      .catch(() => setCatalog([]));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Skill aberta por URL direta
  useEffect(() => {
    if (!skillId) return;
    api
      .get(`/skills/${skillId}`)
      .then((response) => setOpenSkill(response.data))
      .catch(() => {
        toast.error("Skill não encontrada.");
        navigate("/skills", { replace: true });
      });
  }, [skillId, navigate]);

  // Busca filtrada e ordenada
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== ALL) params.category = category;
    if (kind !== ALL) params.kind = kind;
    if (level !== ALL) params.level = level;
    if (targetAi !== ALL) params.target_ai = targetAi;
    if (source !== ALL) params.source = source;
    if (sort) params.sort = sort;
    if (search.trim()) params.search = search.trim();

    const id = setTimeout(() => {
      api
        .get("/skills", { params })
        .then((r) => setSkills(dedupeSkills(r.data)))
        .catch(() => {
          setSkills([]);
          toast.error("Não foi possível carregar as skills.");
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(id);
  }, [search, category, kind, level, targetAi, source, sort]);

  // Contagem de itens por categoria
  const categoryCounts = useMemo(() => {
    const counts = {};
    catalog.forEach((s) => {
      const cat = s.category || "Geral";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [catalog]);

  const categories = useMemo(
    () => [...new Set(catalog.map((s) => s.category).filter(Boolean))].sort(),
    [catalog]
  );
  const kinds = useMemo(
    () => [...new Set(catalog.map((s) => s.kind || "Prompt").filter(Boolean))].sort(),
    [catalog]
  );
  const levels = useMemo(
    () => [...new Set(catalog.map((s) => s.level || "Iniciante").filter(Boolean))],
    [catalog]
  );

  // Destaques de maior pontuação por categoria
  const topByCategory = useMemo(() => {
    if (!catalog.length) return [];
    const map = {};
    catalog.forEach((item) => {
      const cat = item.category || "Geral";
      if (!map[cat] || (item.github_stars || 0) > (map[cat].github_stars || 0)) {
        map[cat] = item;
      }
    });
    return Object.values(map);
  }, [catalog]);

  const activeFilters = [
    category !== ALL,
    kind !== ALL,
    level !== ALL,
    targetAi !== ALL,
    source !== ALL,
  ].filter(Boolean).length;

  const copy = async (skill) => {
    try {
      await navigator.clipboard.writeText(skill.command);
      setCopied(skill.id);
      toast.success(t("copied"));
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Não foi possível copiar o prompt.");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory(ALL);
    setKind(ALL);
    setLevel(ALL);
    setTargetAi(ALL);
    setSource(ALL);
    setSort("stars");
  };

  const openSkillDetail = (skill) => {
    setOpenSkill(skill);
    navigate(`/skills/${skill.public_id || skill.id}`);
  };

  const closeSkillDetail = () => {
    setOpenSkill(null);
    navigate("/skills");
  };

  const selectedAiOption = AI_OPTIONS.find((o) => o.id === targetAi) || AI_OPTIONS[0];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0F] px-5 py-7 sm:px-7 sm:py-8 md:px-10 md:py-10 mb-8">
        <div className="aurora aurora-a w-72 h-72 bg-[#FF7A59]/20 -right-20 -top-24 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#FF7A59] mb-3">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.16em] font-mono-code font-semibold">
                Hub de Skills GitHub & Prompts
              </span>
            </div>
            <h1 className="font-display font-800 text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight text-white">
              Skills de alta pontuação para suas IAs
            </h1>
            <p className="text-white/55 max-w-2xl mt-2 text-xs sm:text-sm leading-relaxed">
              Catálogo curado de repositórios open-source do GitHub, organizados por compatibilidade (Claude, ChatGPT, Cursor MCP, Gemini, Perplexity) e ordenados por relevância e estrelas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 min-w-[110px]">
              <span className="block text-2xl font-display text-[#FF7A59] font-bold">
                {catalog.length || "—"}
              </span>
              <span className="text-[11px] text-white/45">skills ativas</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 min-w-[110px]">
              <span className="block text-2xl font-display text-[#FFD700] font-bold flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" /> Top ⭐
              </span>
              <span className="text-[11px] text-white/45">GitHub Stars</span>
            </div>
          </div>
        </div>
      </section>

      {/* Container Principal */}
      <div className="space-y-6">
        {/* 1. Barra de Busca e Ordenação (Mais Populares / Stars, etc) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="skills-search"
              placeholder="Busque por tema, objetivo, repositório ou tag..."
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm outline-none focus:border-[#FF7A59]/60 text-white placeholder:text-white/35 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/45 hover:text-white"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Seletor de Ordenação */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full sm:w-auto appearance-none rounded-2xl border border-white/15 bg-[#0A0A0F] pl-3.5 pr-8 py-3 text-xs text-white outline-none focus:border-[#FF7A59]/60 cursor-pointer"
              >
                <option value="stars">⭐ Mais pontuadas (GitHub Stars)</option>
                <option value="recent">🔥 Mais recentes</option>
                <option value="title">🔤 Título (A-Z)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/45 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 2. Filtros Lado a Lado (Grid 4 colunas abaixo da busca - Popovers Flutuantes que Sobrepõem) */}
        <div ref={toolbarRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start relative z-30">
          {/* 1. Filtro por IA */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("ai")}
              className={`w-full flex items-center justify-between gap-2 p-3.5 sm:p-4 rounded-2xl border transition-all text-left select-none cursor-pointer ${
                openDropdown === "ai" || targetAi !== ALL
                  ? "bg-[#0A0A0F] border-[#FF7A59]/60 shadow-lg shadow-[#FF7A59]/5 ring-1 ring-[#FF7A59]/30"
                  : "bg-[#0A0A0F] border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
              }`}
              aria-expanded={openDropdown === "ai"}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
                <span className="text-xs font-mono-code uppercase tracking-[0.14em] text-white/80 font-semibold truncate">
                  Filtrar por IA
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {targetAi !== ALL && (
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#FF7A59]/15 text-[#ffab96] border border-[#FF7A59]/30 truncate max-w-[90px]">
                    {selectedAiOption.label}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                    openDropdown === "ai" ? "rotate-180 text-[#FF7A59]" : ""
                  }`}
                />
              </div>
            </button>

            {/* Popover Flutuante Sobreposto */}
            {openDropdown === "ai" && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] sm:w-[280px] z-50 rounded-2xl border border-white/15 bg-[#121218]/95 backdrop-blur-2xl p-4 shadow-2xl shadow-black/90 space-y-2 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-white/10">
                  <span className="text-[11px] text-white/40 font-mono-code">Compatibilidade:</span>
                  {targetAi !== ALL && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetAi(ALL);
                      }}
                      className="text-[11px] text-[#FF7A59] hover:underline font-medium"
                    >
                      Ver todas
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
                  {AI_OPTIONS.map((opt) => {
                    const isActive = targetAi === opt.id;
                    const currentLogo = isActive && opt.activeLogo ? opt.activeLogo : opt.logo;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTargetAi(opt.id);
                        }}
                        className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? "bg-[#FF7A59] border-[#FF7A59] text-black font-semibold shadow-md shadow-[#FF7A59]/20"
                            : "border-white/10 bg-black/40 text-white/75 hover:border-white/25 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {currentLogo ? (
                            <img
                              src={currentLogo}
                              alt=""
                              aria-hidden="true"
                              className={`w-4 h-4 object-contain shrink-0 ${
                                opt.id === "perplexity" ? (isActive ? "" : "invert") : ""
                              }`}
                            />
                          ) : (
                            <span className="text-sm shrink-0" aria-hidden="true">
                              {opt.icon}
                            </span>
                          )}
                          <span className="truncate">{opt.label}</span>
                        </div>

                        {opt.id === ALL && (
                          <span
                            className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded-md ${
                              isActive ? "bg-black/20 text-black" : "bg-white/5 text-white/40"
                            }`}
                          >
                            {catalog.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Categorias */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("category")}
              className={`w-full flex items-center justify-between gap-2 p-3.5 sm:p-4 rounded-2xl border transition-all text-left select-none cursor-pointer ${
                openDropdown === "category" || category !== ALL
                  ? "bg-[#0A0A0F] border-[#FF7A59]/60 shadow-lg shadow-[#FF7A59]/5 ring-1 ring-[#FF7A59]/30"
                  : "bg-[#0A0A0F] border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
              }`}
              aria-expanded={openDropdown === "category"}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Tag className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
                <span className="text-xs font-mono-code uppercase tracking-[0.14em] text-white/80 font-semibold truncate">
                  Categorias
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {category !== ALL && (
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15 truncate max-w-[90px]">
                    {category}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                    openDropdown === "category" ? "rotate-180 text-[#FF7A59]" : ""
                  }`}
                />
              </div>
            </button>

            {/* Popover Flutuante Sobreposto */}
            {openDropdown === "category" && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] sm:w-[280px] z-50 rounded-2xl border border-white/15 bg-[#121218]/95 backdrop-blur-2xl p-4 shadow-2xl shadow-black/90 space-y-2 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-white/10">
                  <span className="text-[11px] text-white/40 font-mono-code">Áreas de especialidade</span>
                  {category !== ALL && (
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(ALL);
                      }}
                      className="text-[11px] text-[#FF7A59] hover:underline font-medium"
                    >
                      Todas
                    </button>
                  )}
                </div>

                <nav className="space-y-1 max-h-[290px] overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(ALL);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      category === ALL
                        ? "bg-[#FF7A59] text-black font-semibold shadow-md shadow-[#FF7A59]/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>Todas as categorias</span>
                    <span
                      className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full ${
                        category === ALL ? "bg-black/20 text-black" : "bg-white/5 text-white/40"
                      }`}
                    >
                      {catalog.length}
                    </span>
                  </button>

                  {categories.map((catName) => {
                    const isCatActive = category === catName;
                    const count = categoryCounts[catName] || 0;
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => {
                          setCategory(catName);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          isCatActive
                            ? "bg-[#FF7A59] text-black font-semibold shadow-md shadow-[#FF7A59]/20"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="truncate">{catName}</span>
                        <span
                          className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full ${
                            isCatActive ? "bg-black/20 text-black" : "bg-white/5 text-white/40"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          {/* 3. Filtros Avançados */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("advanced")}
              className={`w-full flex items-center justify-between gap-2 p-3.5 sm:p-4 rounded-2xl border transition-all text-left select-none cursor-pointer ${
                openDropdown === "advanced" || activeFilters > 0
                  ? "bg-[#0A0A0F] border-[#FF7A59]/60 shadow-lg shadow-[#FF7A59]/5 ring-1 ring-[#FF7A59]/30"
                  : "bg-[#0A0A0F] border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
              }`}
              aria-expanded={openDropdown === "advanced"}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Filter className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
                <span className="text-xs font-mono-code uppercase tracking-[0.14em] text-white/80 font-semibold truncate">
                  Filtros Avançados
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {activeFilters > 0 && (
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#FF7A59]/15 text-[#ffab96] border border-[#FF7A59]/30">
                    {activeFilters}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                    openDropdown === "advanced" ? "rotate-180 text-[#FF7A59]" : ""
                  }`}
                />
              </div>
            </button>

            {/* Popover Flutuante Sobreposto */}
            {openDropdown === "advanced" && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] sm:w-[280px] z-50 rounded-2xl border border-white/15 bg-[#121218]/95 backdrop-blur-2xl p-4 shadow-2xl shadow-black/90 space-y-3 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-white/10">
                  <span className="text-[11px] text-white/40 font-mono-code">Parâmetros</span>
                  {activeFilters > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] text-[#ff9b85] hover:underline font-medium"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <FilterSelect
                  label="Tipo de Skill"
                  value={kind}
                  onChange={setKind}
                  options={kinds}
                  allLabel="Todos os tipos"
                />
                <FilterSelect
                  label="Nível de Dificuldade"
                  value={level}
                  onChange={setLevel}
                  options={levels}
                  allLabel="Todos os níveis"
                />
                <FilterSelect
                  label="Origem dos Dados"
                  value={source}
                  onChange={setSource}
                  options={["github", "editorial"]}
                  allLabel="Todas as origens"
                />
              </div>
            )}
          </div>

          {/* 4. Top Skill por Categoria ⭐ */}
          {topByCategory.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("top")}
                className={`w-full flex items-center justify-between gap-2 p-3.5 sm:p-4 rounded-2xl border transition-all text-left select-none cursor-pointer ${
                  openDropdown === "top"
                    ? "bg-[#0A0A0F] border-[#FFD700]/60 shadow-lg shadow-[#FFD700]/5 ring-1 ring-[#FFD700]/30"
                    : "bg-[#0A0A0F] border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                }`}
                aria-expanded={openDropdown === "top"}
              >
                <div className="flex items-center gap-1.5 min-w-0 text-[#FFD700]">
                  <Flame className="w-4 h-4 fill-current shrink-0" />
                  <span className="text-xs font-mono-code uppercase tracking-[0.14em] text-white/80 font-semibold truncate">
                    Top Skills ⭐
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20">
                    {topByCategory.length}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                      openDropdown === "top" ? "rotate-180 text-[#FFD700]" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Popover Flutuante Sobreposto (alinhado à direita para encaixar na tela) */}
              {openDropdown === "top" && (
                <div className="absolute top-[calc(100%+8px)] right-0 sm:left-auto w-[min(340px,calc(100vw-2rem))] z-50 rounded-2xl border border-white/15 bg-[#121218]/95 backdrop-blur-2xl p-4 shadow-2xl shadow-black/90 space-y-2.5 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-white/10">
                    <span className="text-[11px] text-white/40 font-mono-code">Mais pontuadas por área</span>
                    <span className="text-[10px] font-mono-code text-[#FFD700]">
                      {topByCategory.length} categorias
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 pt-1">
                    {topByCategory.map((topSkill) => {
                      const repoUrl = getSkillRepoUrl(topSkill);
                      const repoName = topSkill.github_repo || "SENTIENT-AI";
                      return (
                        <div
                          key={topSkill.id}
                          onClick={() => {
                            openSkillDetail(topSkill);
                            setOpenDropdown(null);
                          }}
                          className="cursor-pointer group rounded-xl border border-white/10 bg-black/40 p-3 hover:border-[#FF7A59]/50 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] uppercase font-mono-code text-[#FF7A59] font-semibold truncate">
                              {topSkill.category}
                            </span>
                            {topSkill.github_stars > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 px-2 py-0.5 text-[10px] font-mono-code text-[#FFD700] shrink-0">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {formatStars(topSkill.github_stars)}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-medium text-white group-hover:text-[#FF7A59] line-clamp-1 transition-colors">
                            {topSkill.title}
                          </h4>
                          <p className="text-[11px] text-white/45 mt-1 line-clamp-2 leading-relaxed">
                            {topSkill.description}
                          </p>

                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                            <span className="truncate max-w-[100px] font-mono-code">{topSkill.author || repoName}</span>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all shadow-sm group/git"
                                title={`GitHub: ${repoName}`}
                                aria-label={`GitHub: ${repoName}`}
                              >
                                <GithubIcon className="w-3 h-3 group-hover/git:scale-110 transition-transform" />
                              </a>
                              <span className="text-[#FF7A59] font-medium group-hover:translate-x-0.5 transition-transform">
                                Ver →
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Tags de Filtros Ativos */}
        {(category !== ALL || targetAi !== ALL || kind !== ALL || level !== ALL || source !== ALL || search) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-white/40 font-mono-code mr-1">Filtros:</span>
            {targetAi !== ALL && (
              <span className="inline-flex items-center gap-1 text-xs rounded-full bg-[#FF7A59]/15 border border-[#FF7A59]/30 text-[#ffab96] px-3 py-1">
                IA: {selectedAiOption.label}
                <button onClick={() => setTargetAi(ALL)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {category !== ALL && (
              <span className="inline-flex items-center gap-1 text-xs rounded-full bg-white/10 border border-white/15 text-white/80 px-3 py-1">
                Categoria: {category}
                <button onClick={() => setCategory(ALL)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {kind !== ALL && (
              <span className="inline-flex items-center gap-1 text-xs rounded-full bg-white/10 border border-white/15 text-white/80 px-3 py-1">
                Tipo: {kind}
                <button onClick={() => setKind(ALL)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {level !== ALL && (
              <span className="inline-flex items-center gap-1 text-xs rounded-full bg-white/10 border border-white/15 text-white/80 px-3 py-1">
                Nível: {level}
                <button onClick={() => setLevel(ALL)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 text-xs rounded-full bg-white/10 border border-white/15 text-white/80 px-3 py-1">
                Busca: "{search}"
                <button onClick={() => setSearch("")} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-[#FF7A59] hover:underline ml-1 font-medium"
            >
              Limpar todos
            </button>
          </div>
        )}

        {/* 4. Contador & Status */}
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <p className="text-xs sm:text-sm text-white/45">
            {loading
              ? "Buscando skills..."
              : `${skills.length} skills encontradas${
                  sort === "stars" ? " (ordenadas pelas mais bem avaliadas)" : ""
                }`}
          </p>
        </div>

        {/* 5. Grade de Skills */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#FF7A59] animate-spin" />
          </div>
        ) : skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center bg-[#0A0A0F]/50">
            <Terminal className="w-7 h-7 text-white/25 mx-auto mb-3" />
            <h2 className="font-display text-base text-white">Nenhuma skill encontrada</h2>
            <p className="text-xs text-white/45 mt-1 max-w-sm mx-auto">
              Tente alterar os filtros de IA ou categoria, ou limpe a busca.
            </p>
            <button onClick={clearFilters} className="mt-4 text-xs font-semibold text-[#FF7A59] hover:underline">
              Ver todas as skills
            </button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="skills-grid"
          >
            {skills.map((skill, index) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                index={index}
                copied={copied}
                onCopy={copy}
                onOpen={openSkillDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Skill */}
      {openSkill && (
        <SkillDialog
          skill={openSkill}
          copied={copied}
          onCopy={copy}
          onClose={closeSkillDetail}
        />
      )}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-[#FF7A59] border-[#FF7A59] text-black font-semibold shadow-sm"
          : "border-white/15 text-white/70 hover:border-white/40 hover:text-white bg-black/20"
      }`}
    >
      {children}
    </button>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <label className="block">
      <span className="block text-xs text-white/55 mb-2">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-white/15 bg-[#17171e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF7A59]/60 cursor-pointer"
        >
          <option value={ALL}>{allLabel}</option>
          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-white/45 pointer-events-none" />
      </div>
    </label>
  );
}

function SkillCard({ skill, index, copied, onCopy, onOpen }) {
  const preview =
    skill.command.length > 190 ? `${skill.command.slice(0, 190)}…` : skill.command;

  const starsFormatted = formatStars(skill.github_stars);
  const repoUrl = getSkillRepoUrl(skill);
  const repoName = skill.github_repo || "SENTIENT-AI";

  return (
    <article
      onClick={() => onOpen(skill)}
      className="grid-fade-in cursor-pointer flex flex-col justify-between rounded-2xl bg-[#0A0A0F] border border-white/10 p-5 hover:border-[#FF7A59]/45 hover:-translate-y-0.5 transition-all relative overflow-hidden group"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-[0.13em] text-[#FF7A59] font-mono-code">
              {skill.category}
            </span>
            <h2 className="font-display text-base font-semibold mt-2 group-hover:text-[#FF7A59] transition-colors">
              {skill.title}
            </h2>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {starsFormatted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 px-2.5 py-1 text-[11px] font-mono-code text-[#FFD700] font-medium shadow-sm">
                <Star className="w-3 h-3 fill-current" />
                {starsFormatted}
              </span>
            ) : (
              <span className="text-[10px] text-white/35 font-mono-code">
                {skill.kind || "Prompt"}
              </span>
            )}
            {skill.github_repo && (
              <span className="text-[10px] text-white/40 font-mono-code max-w-[130px] truncate">
                {skill.github_repo}
              </span>
            )}
          </div>
        </div>

        {/* Descrição */}
        <p className="text-sm text-white/55 mt-3 min-h-11 line-clamp-2 leading-relaxed">
          {skill.description}
        </p>

        {/* Preview do Prompt / Comando */}
        <div className="mt-4 rounded-xl bg-black/40 border border-white/5 p-3 font-mono-code text-[11px] text-white/60 line-clamp-3 whitespace-pre-wrap">
          {preview}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(skill.tags || []).slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] text-white/45 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Rodapé do Card com Ações */}
      <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-white/[0.07]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(skill);
          }}
          className="inline-flex items-center gap-1.5 text-xs rounded-full bg-[#FF7A59] text-black px-3.5 py-2 font-medium hover:bg-[#ff8f73] transition-colors"
        >
          {copied === skill.id ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied === skill.id ? "Copiado" : "Copiar prompt"}
        </button>

        <div className="flex items-center gap-2">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/15 hover:border-[#FF7A59]/50 text-white/70 hover:text-white transition-all shadow-sm group/git"
            title={`Abrir repositório no GitHub (${repoName})`}
            aria-label="Abrir repositório no GitHub"
          >
            <GithubIcon className="w-4 h-4 group-hover/git:scale-110 transition-transform" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(skill);
            }}
            className="text-xs text-white/60 hover:text-white px-2 py-1"
          >
            Ver completo
          </button>
        </div>
      </div>
    </article>
  );
}

function SkillDialog({ skill, copied, onCopy, onClose }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [tab, setTab] = useState("content");
  const [executeOpen, setExecuteOpen] = useState(false);
  const [executeTab, setExecuteTab] = useState("chat");
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const prompt = skill.command;
  const exportPrompt =
    lang === "en"
      ? `Respond entirely in English.\n\n${prompt}`
      : `Responda inteiramente em português do Brasil.\n\n${prompt}`;

  useEffect(() => {
    setExecuteOpen(false);
    api
      .get(`/skills/${skill.id}/comments`)
      .then((r) => setComments(r.data))
      .catch(() => setComments([]));
  }, [skill.id]);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    api
      .get("/account/collection")
      .then((response) =>
        setSaved(response.data.some((item) => item.id === skill.id))
      )
      .catch(() => setSaved(false));
  }, [skill.id, user]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(exportPrompt);
      await onCopy({ ...skill, command: exportPrompt });
      return true;
    } catch {
      toast.error("Não foi possível copiar o prompt.");
      return false;
    }
  };

  const destinations = {
    ChatGPT: "https://chatgpt.com/",
    Claude: "https://claude.ai/new",
    Gemini: "https://gemini.google.com/app",
    Perplexity: "https://www.perplexity.ai/",
  };

  const exportTo = async (name) => {
    window.open(destinations[name], "_blank", "noopener,noreferrer");
    setExecuteOpen(false);
    if (await copyPrompt()) {
      toast.success(
        `Prompt copiado! Cole com Ctrl+V na conversa do ${name}.`
      );
    }
  };

  const save = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (savingCollection) return;
    setSavingCollection(true);
    try {
      if (saved) {
        await api.delete(`/account/collection/${skill.id}`);
        setSaved(false);
        toast.success("Removida da coleção.");
      } else {
        await api.post(`/account/collection/${skill.id}`);
        setSaved(true);
        toast.success("Skill salva na coleção.");
      }
    } catch (error) {
      if (error.response?.status === 401) setShowLoginPrompt(true);
      else toast.error(error.response?.data?.detail || "Não foi possível atualizar sua coleção.");
    } finally {
      setSavingCollection(false);
    }
  };

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([`# ${skill.title}\n\n${exportPrompt}\n`], {
        type: "text/markdown",
      })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${skill.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const post = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Entre na sua conta para comentar.");
    if (!comment.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/skills/${skill.id}/comments`, {
        body: comment.trim(),
      });
      setComments([data, ...comments]);
      setComment("");
    } catch {
      toast.error("Não foi possível publicar o comentário.");
    } finally {
      setSending(false);
    }
  };

  const starsFormatted = formatStars(skill.github_stars);
  const repoUrl = getSkillRepoUrl(skill);
  const repoName = skill.github_repo || "SENTIENT-AI";

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-[#101015] sm:p-4 sm:bg-black/80 sm:backdrop-blur-sm"
        onMouseDown={onClose}
      >
        <section
          onMouseDown={(e) => e.stopPropagation()}
          className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-[#101015] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-4xl sm:rounded-2xl sm:border sm:border-white/15 sm:shadow-2xl"
        >
          {/* Cabeçalho do Modal */}
          <header className="z-10 flex shrink-0 justify-between gap-3 border-b border-white/10 bg-[#101015]/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur sm:p-5 md:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.13em] text-[#FF7A59] font-mono-code">
                  {skill.category} · {skill.kind || "Prompt"}
                </span>
                {starsFormatted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 px-2 py-0.5 text-[10px] font-mono-code text-[#FFD700]">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    {starsFormatted} estrelas no GitHub
                  </span>
                )}
              </div>
              <h2 className="font-display font-semibold text-lg sm:text-xl md:text-2xl mt-2 text-white">
                {skill.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar skill"
              className="shrink-0 p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Conteúdo Principal do Modal */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
            {/* Linha de Descrição e Ações de Topo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-white/65 max-w-2xl text-sm leading-relaxed">
                {skill.description}
              </p>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/15 bg-white/5 text-white/80 hover:text-white hover:border-[#FF7A59]/60 hover:bg-white/10 transition-all shadow-sm group/git"
                  title={`Abrir repositório no GitHub: ${repoName}`}
                  aria-label="Abrir repositório no GitHub"
                >
                  <GithubIcon className="w-4 h-4 group-hover/git:scale-110 transition-transform" />
                </a>
                <button
                  type="button"
                  onClick={save}
                  disabled={savingCollection}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-colors disabled:cursor-wait disabled:opacity-60 ${
                    saved
                      ? "border-[#1689E8] text-[#72baff] bg-[#1689E8]/10"
                      : "border-white/15 text-white/70 hover:border-white/30"
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} />
                  {savingCollection ? "Salvando..." : saved ? "Na coleção" : "Salvar"}
                </button>
              </div>
            </div>

            {/* Abas */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar border-b border-white/10 mb-6">
              <Tab active={tab === "content"} onClick={() => setTab("content")}>
                <Terminal className="w-4 h-4" />
                Prompt & Conteúdo
              </Tab>
              <Tab active={tab === "mcp"} onClick={() => setTab("mcp")}>
                <Blocks className="w-4 h-4" />
                Conectar via MCP
              </Tab>
              <Tab active={tab === "versions"} onClick={() => setTab("versions")}>
                <History className="w-4 h-4" />
                Metadados & Fonte
              </Tab>
            </div>

            {/* Conteúdo da Aba Ativa */}
            {tab === "content" ? (
              <>
                <div className="flex justify-end relative mb-3">
                  <button
                    onClick={() => setExecuteOpen(!executeOpen)}
                    className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-3.5 py-1.5 text-xs font-medium hover:bg-white/90 transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Executar na IA
                  </button>
                  {executeOpen && (
                    <ExecuteMenu
                      tab={executeTab}
                      setTab={setExecuteTab}
                      onChoose={exportTo}
                      onCopy={copyPrompt}
                      onDownload={download}
                    />
                  )}
                </div>
                <pre className="rounded-xl border border-white/10 bg-black/45 p-4 md:p-5 text-sm text-white/85 font-mono-code whitespace-pre-wrap leading-relaxed overflow-x-auto select-all">
                  {prompt}
                </pre>
              </>
            ) : tab === "mcp" ? (
              <McpTab skill={skill} />
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/25 p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <GithubIcon className="w-4 h-4 text-[#FF7A59]" />
                      Repositório Oficial no GitHub
                    </p>
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#FF7A59] hover:underline font-mono-code"
                    >
                      Abrir repositório <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="mt-2 rounded-lg bg-black/40 border border-white/5 p-3">
                    <p className="text-xs font-mono-code text-white/80 select-all">
                      {repoUrl}
                    </p>
                    <p className="text-[11px] text-white/45 mt-1">
                      {skill.github_repo
                        ? `Projeto: ${skill.github_repo}`
                        : "Skill curada editorialmente pelo SENTIENT-AI."}
                    </p>
                  </div>
                </div>
                {skill.github_stars > 0 && (
                  <div>
                    <p className="text-sm font-medium text-white">Classificação & Estrelas</p>
                    <p className="text-xs text-[#FFD700] mt-1 flex items-center gap-1.5 font-mono-code">
                      <Star className="w-3.5 h-3.5 fill-current" /> {skill.github_stars.toLocaleString()} estrelas oficiais na comunidade
                    </p>
                  </div>
                )}
                {skill.synced_at && (
                  <div>
                    <p className="text-sm font-medium text-white">Última Sincronização Automática</p>
                    <p className="text-xs text-white/40 mt-1 font-mono-code">
                      {new Date(skill.synced_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Seção de Comentários */}
            <section className="mt-8 pt-7 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-4 h-4 text-[#FF7A59]" />
                <h3 className="font-display text-sm font-semibold text-white">
                  Comentários da Comunidade ({comments.length})
                </h3>
              </div>

              {user ? (
                <form onSubmit={post} className="mb-6">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Compartilhe uma dúvida, adaptação ou resultado com esta skill..."
                    className="w-full min-h-24 rounded-xl bg-black/35 border border-white/10 p-3 text-sm outline-none focus:border-[#FF7A59] text-white"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      disabled={sending || !comment.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-[#FF7A59] text-black px-4 py-2 text-xs font-medium disabled:opacity-45 hover:bg-[#ff8f73]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Publicar comentário
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/55 mb-6">
                  Entre na sua conta para participar da conversa e avaliar esta skill.
                </div>
              )}

              <div className="space-y-3">
                {comments.length ? (
                  comments.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-white/[0.08] bg-black/20 p-4"
                    >
                      <p className="text-sm font-medium text-white">{item.author_name}</p>
                      <p className="text-sm text-white/65 mt-2 whitespace-pre-wrap leading-relaxed">
                        {item.body}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-white/45">
                    Ainda não há comentários. Seja a primeira pessoa a compartilhar seus resultados!
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Rodapé do Modal */}
          <footer className="flex shrink-0 justify-end gap-3 border-t border-white/10 bg-[#101015]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:p-5">
            <button
              onClick={copyPrompt}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-[#FF7A59] text-black px-5 py-2.5 text-sm font-medium hover:bg-[#ff8f73] transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied === skill.id ? "Prompt copiado!" : "Copiar prompt"}
            </button>
          </footer>
        </section>
      </div>

      {showLoginPrompt && (
        <LoginRequiredModal onClose={() => setShowLoginPrompt(false)} />
      )}
    </>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex gap-2 items-center border-b-2 -mb-px pb-3 text-sm font-medium transition-colors ${
        active ? "border-[#FF7A59] text-white" : "border-transparent text-white/45 hover:text-white/70"
      }`}
    >
      {children}
    </button>
  );
}

function McpTab({ skill }) {
  const [client, setClient] = useState("Claude Desktop");
  const [copied, setCopied] = useState(false);
  const clients = {
    "Claude Desktop": {
      open: "https://claude.ai/download",
      steps: [
        "Abra o Claude Desktop.",
        "Vá em Settings > Developer > Edit Config.",
        "Cole a configuração fornecida pelo serviço MCP e reinicie o Claude.",
      ],
    },
    "ChatGPT / Codex": {
      open: "https://chatgpt.com/",
      steps: [
        "Abra o ChatGPT ou Codex.",
        "Acesse Settings > Apps ou Connectors.",
        "Adicione o conector MCP seguindo a configuração do serviço escolhido.",
      ],
    },
    Cursor: {
      open: "https://www.cursor.com/",
      steps: [
        "Abra o Cursor.",
        "Vá em Settings > MCP.",
        "Escolha Add new MCP server, cole a configuração e habilite o servidor.",
      ],
    },
    "VS Code": {
      open: "https://code.visualstudio.com/",
      steps: [
        "Abra o VS Code.",
        "Abra a Paleta de Comandos (Ctrl+Shift+P).",
        "Procure por MCP: Add Server e use os dados do serviço MCP.",
      ],
    },
  };

  const selected = clients[client];
  const recommended =
    MCP_RECOMMENDATIONS[skill.category] || ["Google Drive", "Notion", "Arquivos"];
  const checklist = `Como conectar um MCP no ${client}:\n\n${selected.steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n")}\n\nImportante: use apenas a configuração oficial do serviço MCP escolhido e nunca compartilhe sua chave de API em um prompt.`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(checklist);
      setCopied(true);
      toast.success("Passo a passo copiado.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-black/25 p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1689E8]/15 text-[#72baff]">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono-code uppercase tracking-[0.13em] text-[#72baff]">
              Guia rápido MCP
            </p>
            <h3 className="font-display text-base font-semibold mt-1">
              Conecte ferramentas à IA em 3 passos
            </h3>
            <p className="mt-1 text-sm text-white/55">
              Escolha onde vai usar o MCP. A Sentient AI não recebe nem armazena suas chaves.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/45">
            Ferramentas recomendadas para {skill.category}
          </p>
          <div className="flex flex-wrap gap-2">
            {recommended.map((name) => (
              <span
                key={name}
                className="rounded-full border border-[#1689E8]/30 bg-[#1689E8]/10 px-3 py-1 text-xs text-[#9bcfff]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.12em] text-white/45">
          1. Escolha sua IA ou editor
        </p>
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
          {Object.keys(clients).map((name) => (
            <button
              type="button"
              key={name}
              onClick={() => setClient(name)}
              className={`rounded-xl border px-3 py-3 text-left text-xs transition-colors ${
                client === name
                  ? "border-[#1689E8] bg-[#1689E8]/10 text-white font-medium"
                  : "border-white/10 text-white/55 hover:border-white/30"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-white/45">
          2. Siga este caminho no {client}
        </p>
        <ol className="mt-3 space-y-3">
          {selected.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm text-white/70">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1689E8]/15 text-[11px] text-[#9bcfff] font-mono-code">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href={selected.open}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-black hover:bg-white/90"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Abrir {client}
          </a>
          <button
            type="button"
            onClick={copy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-white/80 hover:bg-white/5"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copiado" : "Copiar passos"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#FF7A59]/25 bg-[#FF7A59]/[0.06] p-4">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7A59]" />
          <div>
            <p className="text-sm font-medium text-white">3. Segurança das ferramentas</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Após escolher um serviço (como GitHub, Postgres ou Notion), copie a configuração da documentação dele e cole no editor escolhido. Nunca coloque chaves privadas em prompts abertos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const MCP_RECOMMENDATIONS = {
  Desenvolvimento: ["GitHub", "Filesystem", "Postgres"],
  Dados: ["Postgres", "Google Drive", "Filesystem"],
  Marketing: ["Google Drive", "Notion", "Slack"],
  Produtividade: ["Notion", "Google Drive", "Slack"],
  Negócios: ["Notion", "Google Drive", "Slack"],
  Comunicação: ["Google Drive", "Slack", "Notion"],
  Automação: ["Slack", "Google Drive", "Postgres"],
  Operações: ["Notion", "Google Drive", "Slack"],
  Gestão: ["Notion", "Google Drive", "Slack"],
  Atendimento: ["Slack", "Notion", "Google Drive"],
  Educação: ["Google Drive", "Notion", "Filesystem"],
};

function LoginRequiredModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <section
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#15151b] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FF7A59]/15 text-[#FF7A59] flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar aviso"
            className="text-white/45 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 id="login-required-title" className="font-display text-xl font-semibold mt-5 text-white">
          Salve suas skills
        </h3>
        <p className="text-sm text-white/60 mt-2 leading-relaxed">
          Entre ou crie uma conta para adicionar prompts à sua coleção pessoal e acessá-los quando quiser.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5"
          >
            Agora não
          </button>
          <Link
            to="/login"
            className="flex-1 rounded-full bg-[#FF7A59] px-4 py-2.5 text-center text-sm font-medium text-black hover:bg-[#ff8f73]"
          >
            Entrar
          </Link>
        </div>
      </section>
    </div>
  );
}

const AI_LOGOS = {
  ChatGPT: "/ai-logos/openai.svg",
  Claude: "/ai-logos/claude.svg",
  Gemini: "/ai-logos/gemini.svg",
  Perplexity: "/ai-logos/perplexity.svg",
};

function ExecuteMenu({ tab, setTab, onChoose, onCopy, onDownload }) {
  const [showMcp, setShowMcp] = useState(false);
  const names = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

  if (showMcp) return <McpQuickPanel onBack={() => setShowMcp(false)} />;

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-xl border border-white/15 bg-[#17171e] p-2 shadow-2xl text-left">
      <div className="flex border-b border-white/10 mb-1">
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            tab === "chat" ? "text-white border-b-2 border-[#FF7A59]" : "text-white/45"
          }`}
        >
          Chat IA
        </button>
        <button
          onClick={() => setTab("code")}
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            tab === "code" ? "text-white border-b-2 border-[#FF7A59]" : "text-white/45"
          }`}
        >
          Code
        </button>
      </div>
      {names.map((name) => (
        <button
          key={name}
          onClick={() => onChoose(name)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-white/[0.06]">
            <img
              src={AI_LOGOS[name]}
              alt={`${name} logo`}
              className={`h-4 w-4 object-contain ${name === "Perplexity" ? "invert" : ""}`}
              onError={(event) => {
                event.currentTarget.classList.add("hidden");
                event.currentTarget.nextElementSibling.classList.remove("hidden");
              }}
            />
            <span aria-hidden="true" className="hidden text-[9px] font-bold text-white/45">
              AI
            </span>
          </span>
          {name}
        </button>
      ))}
      <div className="border-t border-white/10 mt-1 pt-1">
        <button
          onClick={() => setShowMcp(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#9bcfff] hover:bg-[#1689E8]/10 text-left"
        >
          <Blocks className="w-3.5 h-3.5" />
          Conectar ferramentas MCP
        </button>
        <button
          onClick={onCopy}
          className="w-full rounded-lg px-3 py-2 text-xs text-white/55 hover:bg-white/10 text-left"
        >
          Copiar prompt formatado
        </button>
        <button
          onClick={onDownload}
          className="w-full rounded-lg px-3 py-2 text-xs text-white/55 hover:bg-white/10 text-left"
        >
          <Download className="w-3.5 h-3.5 inline mr-2" />
          Baixar Markdown (.md)
        </button>
      </div>
    </div>
  );
}

function McpQuickPanel({ onBack }) {
  const [client, setClient] = useState("Claude Desktop");
  const setup = {
    "Claude Desktop": "Settings > Developer > Edit Config",
    "ChatGPT / Codex": "Settings > Apps, Connectors ou Developer tools",
    Cursor: "Settings > MCP > Add new MCP server",
    "VS Code": "Paleta de Comandos > MCP: Add Server",
  };
  const config = `{"mcpServers":{"meu-servidor":{"command":"npx","args":["-y","@provedor/mcp-server"],"env":{"API_KEY":"SUA_CHAVE_AQUI"}}}}`;
  const context =
    "Use as ferramentas MCP conectadas quando forem relevantes. Antes de ler, alterar, enviar ou publicar dados externos, explique a ação e peça confirmação. Cite quais ferramentas foram usadas e não invente resultados.";
  const copy = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-white/15 bg-[#17171e] p-4 shadow-2xl text-left">
      <button onClick={onBack} className="text-xs text-white/50 hover:text-white">
        ← Voltar
      </button>
      <div className="flex gap-2 mt-3">
        <Blocks className="w-4 h-4 text-[#72baff] mt-0.5" />
        <div>
          <p className="text-sm font-medium">Conectar via MCP</p>
          <p className="text-xs text-white/50 mt-1">
            A configuração acontece na sua IA; nenhuma chave passa pelo SENTIENT-AI.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {Object.keys(setup).map((name) => (
          <button
            key={name}
            onClick={() => setClient(name)}
            className={`rounded-lg border px-2 py-2 text-left text-[11px] ${
              client === name
                ? "border-[#1689E8] bg-[#1689E8]/10 text-white font-medium"
                : "border-white/10 text-white/55"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <p className="mt-3 rounded-lg bg-black/30 p-3 text-xs text-white/65">{setup[client]}</p>
      <div className="flex justify-between mt-4 mb-2">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
          Modelo de servidor
        </p>
        <button
          onClick={() => copy(config, "Configuração MCP copiada.")}
          className="text-xs text-[#FF7A59]"
        >
          Copiar
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-black/45 p-3 text-[10px] leading-relaxed text-white/70 font-mono-code whitespace-pre-wrap">
        {config}
      </pre>
      <button
        onClick={() => copy(context, "Instrução MCP copiada.")}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#FF7A59]/40 px-3 py-2 text-xs text-[#ffab96] hover:bg-[#FF7A59]/10"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Copiar instrução segura para a IA
      </button>
    </div>
  );
}
