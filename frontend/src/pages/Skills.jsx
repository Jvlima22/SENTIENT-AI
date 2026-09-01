import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Blocks, Bookmark, Check, ChevronDown, Copy, Download, Filter, History, Loader2, MessageCircle, Play, Search, Send, ShieldCheck, Sparkles, Tag, Terminal, X } from "lucide-react";

const ALL = "all";

export default function Skills() {
  const { t } = useI18n();
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]), [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState(""), [category, setCategory] = useState(ALL), [kind, setKind] = useState(ALL), [level, setLevel] = useState(ALL);
  const [loading, setLoading] = useState(true), [copied, setCopied] = useState(null), [openSkill, setOpenSkill] = useState(null), [showFilters, setShowFilters] = useState(false);
  useEffect(() => { api.get("/skills").then((r) => setCatalog(r.data)).catch(() => setCatalog([])); }, []);
  useEffect(() => {
    if (!skillId) return;
    api.get(`/skills/${skillId}`)
      .then((response) => setOpenSkill(response.data))
      .catch(() => { toast.error("Skill não encontrada."); navigate("/skills", { replace: true }); });
  }, [skillId, navigate]);
  useEffect(() => { setLoading(true); const params = {}; if (category !== ALL) params.category = category; if (kind !== ALL) params.kind = kind; if (level !== ALL) params.level = level; if (search.trim()) params.search = search.trim(); const id = setTimeout(() => api.get("/skills", { params }).then((r) => setSkills(r.data)).catch(() => { setSkills([]); toast.error("Não foi possível carregar as skills."); }).finally(() => setLoading(false)), 220); return () => clearTimeout(id); }, [search, category, kind, level]);
  const categories = useMemo(() => [...new Set(catalog.map((s) => s.category).filter(Boolean))].sort(), [catalog]);
  const kinds = useMemo(() => [...new Set(catalog.map((s) => s.kind || "Prompt").filter(Boolean))].sort(), [catalog]);
  const levels = useMemo(() => [...new Set(catalog.map((s) => s.level || "Iniciante").filter(Boolean))], [catalog]);
  const activeFilters = [category, kind, level].filter((item) => item !== ALL).length;
  const copy = async (skill) => { try { await navigator.clipboard.writeText(skill.command); setCopied(skill.id); toast.success(t("copied")); setTimeout(() => setCopied(null), 1500); } catch { toast.error("Não foi possível copiar o prompt."); } };
  const clearFilters = () => { setSearch(""); setCategory(ALL); setKind(ALL); setLevel(ALL); };
  const openSkillDetail = (skill) => { setOpenSkill(skill); navigate(`/skills/${skill.public_id || skill.id}`); };
  const closeSkillDetail = () => { setOpenSkill(null); navigate("/skills"); };
  return <div className="max-w-[1440px] mx-auto px-5 md:px-8 py-10 md:py-14">
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0F] px-5 py-8 sm:px-6 sm:py-9 md:px-10 md:py-12 mb-8"><div className="aurora aurora-a w-72 h-72 bg-[#FF7A59]/25 -right-24 -top-28" /><div className="relative"><div className="flex items-center gap-2 mb-4 text-[#FF7A59]"><Sparkles className="w-5 h-5" /><span className="text-xs uppercase tracking-[0.16em] font-mono-code">Biblioteca de prompts</span></div><div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"><div><h1 className="font-display font-800 text-2xl min-[380px]:text-3xl md:text-5xl tracking-tight leading-tight">Skills para transformar<br className="hidden md:block" /> intenção em ação.</h1><p className="text-white/55 max-w-2xl mt-4 leading-relaxed">Prompts práticos, em português, criados para você adaptar ao seu contexto e usar com a IA de sua preferência.</p></div><div className="self-start lg:self-auto shrink-0 rounded-2xl border border-white/10 bg-black/20 px-5 py-4"><span className="block text-2xl font-display text-[#FF7A59]">{catalog.length || "—"}</span><span className="text-xs text-white/45">skills disponíveis</span></div></div></div></section>
    <section className="mb-8" aria-label="Filtros da biblioteca"><div className="relative max-w-2xl mb-5"><div className="flex items-center gap-2"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><input value={search} onChange={(e) => setSearch(e.target.value)} data-testid="skills-search" placeholder="Busque por tema, objetivo ou tag..." className="w-full bg-white/[0.045] border border-white/10 rounded-2xl pl-11 pr-10 py-3.5 text-sm outline-none focus:border-[#FF7A59]/60" />{search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/45 hover:text-white"><X className="w-4 h-4" /></button>}</div><button onClick={() => setShowFilters(!showFilters)} aria-label="Abrir filtros" className={`shrink-0 rounded-2xl border p-3.5 ${showFilters ? "bg-[#1689E8] border-[#1689E8]" : "border-white/15 text-white/65"}`}><Filter className="w-4 h-4" /></button></div>{showFilters && <div className="absolute z-20 left-0 top-[calc(100%+12px)] w-full max-w-md rounded-2xl border border-white/15 bg-[#101015] p-4 sm:p-5 shadow-2xl"><div className="flex justify-between mb-4"><div><p className="text-sm font-medium">Filtros avançados</p><p className="text-xs text-white/45 mt-1">Refine os resultados.</p></div><button onClick={() => setShowFilters(false)} aria-label="Fechar filtros"><X className="w-4 h-4 text-white/45" /></button></div><div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3"><FilterSelect label="Tipo" value={kind} onChange={setKind} options={kinds} allLabel="Todos" /><FilterSelect label="Nível" value={level} onChange={setLevel} options={levels} allLabel="Todos" /></div><button onClick={clearFilters} className="text-xs text-[#FF7A59] mt-4">Limpar filtros</button></div>}</div><div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap"><Chip active={category === ALL} onClick={() => setCategory(ALL)}>Todos</Chip>{categories.map((item) => <Chip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Chip>)}</div></section>
    <div className="flex items-center justify-between mb-5"><p className="text-sm text-white/45">{loading ? "Buscando skills..." : `${skills.length} skills encontradas`}</p>{activeFilters > 0 && <span className="text-xs text-[#ff9b85]">{activeFilters} filtro(s) ativo(s)</span>}</div>
    {loading ? <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-[#FF7A59] animate-spin" /></div> : skills.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 py-20 text-center"><Terminal className="w-7 h-7 text-white/25 mx-auto mb-3" /><h2 className="font-display text-base">Nenhuma skill encontrada</h2><button onClick={clearFilters} className="mt-5 text-sm text-[#FF7A59]">Ver todas as skills</button></div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="skills-grid">{skills.map((skill, index) => <SkillCard key={skill.id} skill={skill} index={index} copied={copied} onCopy={copy} onOpen={openSkillDetail} />)}</div>}
    {openSkill && <SkillDialog skill={openSkill} copied={copied} onCopy={copy} onClose={closeSkillDetail} />}
  </div>;
}

function Chip({ active, onClick, children }) { return <button onClick={onClick} className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${active ? "bg-[#1689E8] border-[#1689E8] text-white" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"}`}>{children}</button>; }
function FilterSelect({ label, value, onChange, options, allLabel }) { return <label><span className="block text-xs text-white/55 mb-2">{label}</span><div className="relative"><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-xl border border-white/15 bg-[#17171e] px-3 py-2.5 text-sm text-white"><option value={ALL}>{allLabel}</option>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown className="absolute right-3 top-3 w-4 h-4 text-white/45 pointer-events-none" /></div></label>; }
function SkillCard({ skill, index, copied, onCopy, onOpen }) { const preview = skill.command.length > 190 ? `${skill.command.slice(0, 190)}…` : skill.command; return <article onClick={() => onOpen(skill)} className="grid-fade-in cursor-pointer flex flex-col rounded-2xl bg-[#0A0A0F] border border-white/10 p-5 hover:border-[#FF7A59]/45 hover:-translate-y-0.5 transition-all" style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}><div className="flex justify-between"><div><span className="text-[10px] uppercase tracking-[0.13em] text-[#FF7A59] font-mono-code">{skill.category}</span><h2 className="font-display text-base mt-4">{skill.title}</h2></div><span className="text-[10px] text-white/35">{skill.kind || "Prompt"}</span></div><p className="text-sm text-white/50 mt-3 min-h-11">{skill.description}</p><div className="mt-4 rounded-xl bg-black/35 border border-white/5 p-3 font-mono-code text-[11px] text-white/55 line-clamp-4 whitespace-pre-wrap">{preview}</div><div className="flex flex-wrap gap-1.5 mt-3">{(skill.tags || []).slice(0, 4).map((tag) => <span key={tag} className="inline-flex gap-1 text-[10px] text-white/45"><Tag className="w-2.5 h-2.5" />{tag}</span>)}</div><div className="flex gap-2 mt-5 pt-4 border-t border-white/[0.07]"><button onClick={(e) => { e.stopPropagation(); onCopy(skill); }} className="inline-flex items-center gap-1.5 text-xs rounded-full bg-[#FF7A59] text-black px-3.5 py-2 font-medium">{copied === skill.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied === skill.id ? "Copiado" : "Copiar prompt"}</button><button onClick={(e) => { e.stopPropagation(); onOpen(skill); }} className="text-xs text-white/55 px-2">Ver completo</button></div></article>; }

function SkillDialog({ skill, copied, onCopy, onClose }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [tab, setTab] = useState("content"), [executeOpen, setExecuteOpen] = useState(false), [executeTab, setExecuteTab] = useState("chat");
  const [comments, setComments] = useState([]), [comment, setComment] = useState(""), [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false), [savingCollection, setSavingCollection] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false), [showMcpGuide, setShowMcpGuide] = useState(false);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  const prompt = skill.command;
  const exportPrompt = lang === "en"
    ? `Respond entirely in English.\n\n${prompt}`
    : `Responda inteiramente em português do Brasil.\n\n${prompt}`;
  useEffect(() => { setExecuteOpen(false); api.get(`/skills/${skill.id}/comments`).then((r) => setComments(r.data)).catch(() => setComments([])); }, [skill.id]);
  useEffect(() => {
    if (!user) { setSaved(false); return; }
    api.get("/account/collection")
      .then((response) => setSaved(response.data.some((item) => item.id === skill.id)))
      .catch(() => setSaved(false));
  }, [skill.id, user]);
  const copyPrompt = async () => { try { await navigator.clipboard.writeText(exportPrompt); await onCopy({ ...skill, command: exportPrompt }); return true; } catch { toast.error("Não foi possível copiar o prompt."); return false; } };
  const destinations = { ChatGPT: "https://chatgpt.com/", Claude: "https://claude.ai/new", Gemini: "https://gemini.google.com/app", Perplexity: "https://www.perplexity.ai/" };
  const exportTo = async (name) => { window.open(destinations[name], "_blank", "noopener,noreferrer"); setExecuteOpen(false); if (await copyPrompt()) toast.success("Prompt copiado. Cole com Ctrl+V na nova conversa."); };
  const save = async () => {
    if (!user) { setShowLoginPrompt(true); return; }
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
    } finally { setSavingCollection(false); }
  };
  const download = () => { const url = URL.createObjectURL(new Blob([`# ${skill.title}\n\n${exportPrompt}\n`], { type: "text/markdown" })); const a = document.createElement("a"); a.href = url; a.download = `${skill.title}.md`; a.click(); URL.revokeObjectURL(url); };
  const post = async (e) => { e.preventDefault(); if (!user) return toast.error("Entre na sua conta para comentar."); if (!comment.trim()) return; setSending(true); try { const { data } = await api.post(`/skills/${skill.id}/comments`, { body: comment.trim() }); setComments([data, ...comments]); setComment(""); } catch { toast.error("Não foi possível publicar o comentário."); } finally { setSending(false); } };
  return <>
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#101015] sm:p-4 sm:bg-black/75 sm:backdrop-blur-sm" onMouseDown={onClose}>
      <section onMouseDown={(e) => e.stopPropagation()} className="flex h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-[#101015] sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-4xl sm:rounded-2xl sm:border sm:border-white/15 sm:shadow-2xl">
        <header className="z-10 flex shrink-0 justify-between gap-3 border-b border-white/10 bg-[#101015]/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur sm:p-5 md:p-6"><div className="min-w-0"><span className="text-[10px] uppercase tracking-[0.13em] text-[#FF7A59] font-mono-code">{skill.category} · {skill.kind || "Prompt"}</span><h2 className="font-display text-lg sm:text-xl md:text-2xl mt-2">{skill.title}</h2></div><button onClick={onClose} aria-label="Fechar skill" className="shrink-0 p-2 text-white/50 hover:text-white"><X className="w-5 h-5" /></button></header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6"><p className="text-white/60 max-w-2xl">{skill.description}</p><button type="button" onClick={save} disabled={savingCollection} className={`inline-flex w-full sm:w-auto justify-center h-fit items-center gap-2 rounded-full border px-4 py-2.5 text-sm disabled:cursor-wait disabled:opacity-60 ${saved ? "border-[#1689E8] text-[#72baff]" : "border-white/15 text-white/70"}`}><Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />{savingCollection ? "Salvando..." : saved ? "Na sua coleção" : "Adicionar à coleção"}</button></div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar border-b border-white/10 mb-6"><Tab active={tab === "content"} onClick={() => setTab("content")}><Terminal className="w-4 h-4" />Conteúdo</Tab><Tab active={tab === "versions"} onClick={() => setTab("versions")}><History className="w-4 h-4" />Versões 1</Tab><Tab active={tab === "mcp"} onClick={() => setTab("mcp")}><Blocks className="w-4 h-4" />MCP</Tab></div>
          {tab === "content" ? <><div className="flex justify-end relative mb-3"><button onClick={() => setExecuteOpen(!executeOpen)} className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-1.5 text-xs font-medium"><Play className="w-3.5 h-3.5 fill-current" />Executar</button>{executeOpen && <ExecuteMenu tab={executeTab} setTab={setExecuteTab} onChoose={exportTo} onCopy={copyPrompt} onDownload={download} />}</div><pre className="rounded-xl border border-white/10 bg-black/45 p-4 md:p-5 text-sm text-white/80 font-mono-code whitespace-pre-wrap leading-relaxed overflow-x-auto">{prompt}</pre></> : tab === "mcp" ? <McpTab skill={skill} /> : <div className="rounded-xl border border-white/10 bg-black/25 p-5"><p className="text-sm font-medium">Versão 1</p><p className="text-xs text-white/45 mt-1">Versão editorial atual deste prompt.</p></div>}
          <section className="mt-8 pt-7 border-t border-white/10"><div className="flex items-center gap-2 mb-4"><MessageCircle className="w-4 h-4 text-[#FF7A59]" /><h3 className="font-display text-sm">Comentários ({comments.length})</h3></div>{user ? <form onSubmit={post} className="mb-6"><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Compartilhe uma dúvida, adaptação ou resultado..." className="w-full min-h-24 rounded-xl bg-black/35 border border-white/10 p-3 text-sm outline-none focus:border-[#FF7A59]" /><div className="flex justify-end mt-2"><button disabled={sending || !comment.trim()} className="inline-flex items-center gap-2 rounded-full bg-[#FF7A59] text-black px-4 py-2 text-xs font-medium disabled:opacity-45"><Send className="w-3.5 h-3.5" />Publicar comentário</button></div></form> : <div className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/55 mb-6">Entre na sua conta para participar da conversa.</div>}<div className="space-y-3">{comments.length ? comments.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.08] bg-black/20 p-4"><p className="text-sm font-medium">{item.author_name}</p><p className="text-sm text-white/65 mt-2 whitespace-pre-wrap">{item.body}</p></article>) : <p className="text-sm text-white/45">Ainda não há comentários. Seja a primeira pessoa.</p>}</div></section>
        </div>
        <footer className="flex shrink-0 justify-end border-t border-white/10 bg-[#101015]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:p-5"><button onClick={copyPrompt} className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-[#FF7A59] text-black px-4 py-2.5 text-sm font-medium"><Copy className="w-4 h-4" />{copied === skill.id ? "Prompt copiado" : "Copiar prompt"}</button></footer>
      </section>
    </div>
    {showLoginPrompt && <LoginRequiredModal onClose={() => setShowLoginPrompt(false)} />}
  </>;
}

function Tab({ active, onClick, children }) { return <button onClick={onClick} className={`shrink-0 inline-flex gap-2 items-center border-b-2 -mb-px pb-3 text-sm ${active ? "border-[#FF7A59] text-white" : "border-transparent text-white/45"}`}>{children}</button>; }

function McpTab({ skill }) {
  const [client, setClient] = useState("Claude Desktop");
  const [copied, setCopied] = useState(false);
  const clients = {
    "Claude Desktop": { open: "https://claude.ai/download", steps: ["Abra o Claude Desktop.", "Vá em Settings > Developer > Edit Config.", "Cole a configuração fornecida pelo serviço MCP e reinicie o Claude."] },
    "ChatGPT / Codex": { open: "https://chatgpt.com/", steps: ["Abra o ChatGPT ou Codex.", "Acesse Settings > Apps ou Connectors.", "Adicione o conector MCP seguindo a configuração do serviço escolhido."] },
    Cursor: { open: "https://www.cursor.com/", steps: ["Abra o Cursor.", "Vá em Settings > MCP.", "Escolha Add new MCP server, cole a configuração e habilite o servidor."] },
    "VS Code": { open: "https://code.visualstudio.com/", steps: ["Abra o VS Code.", "Abra a Paleta de Comandos.", "Procure por MCP: Add Server e use os dados do serviço MCP."] },
  };
  const selected = clients[client];
  const recommended = MCP_RECOMMENDATIONS[skill.category] || ["Google Drive", "Notion", "Arquivos"];
  const checklist = `Como conectar um MCP no ${client}:\n\n${selected.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\nImportante: use apenas a configuração oficial do serviço MCP escolhido e nunca compartilhe sua chave de API em um prompt.`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(checklist); setCopied(true); toast.success("Passo a passo copiado."); setTimeout(() => setCopied(false), 1800); }
    catch { toast.error("Não foi possível copiar."); }
  };
  return <div className="space-y-5"><div className="rounded-xl border border-white/10 bg-black/25 p-4 sm:p-5"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1689E8]/15 text-[#72baff]"><Blocks className="w-5 h-5" /></div><div><p className="text-[10px] font-mono-code uppercase tracking-[0.13em] text-[#72baff]">Guia rápido</p><h3 className="font-display text-base mt-1">Conecte uma ferramenta em 3 passos</h3><p className="mt-1 text-sm text-white/55">Escolha onde vai usar o MCP. A Sentient AI não pede nem armazena suas chaves.</p></div></div><div className="mt-4"><p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/45">Úteis para esta skill</p><div className="flex flex-wrap gap-2">{recommended.map((name) => <span key={name} className="rounded-full border border-[#1689E8]/30 bg-[#1689E8]/10 px-3 py-1.5 text-xs text-[#9bcfff]">{name}</span>)}</div></div></div><div><p className="mb-3 text-xs uppercase tracking-[0.12em] text-white/45">1. Escolha sua IA ou editor</p><div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">{Object.keys(clients).map((name) => <button type="button" key={name} onClick={() => setClient(name)} className={`rounded-xl border px-3 py-3 text-left text-xs transition-colors ${client === name ? "border-[#1689E8] bg-[#1689E8]/10 text-white" : "border-white/10 text-white/55 hover:border-white/30"}`}>{name}</button>)}</div></div><div className="rounded-xl border border-white/10 bg-black/25 p-4"><p className="text-xs uppercase tracking-[0.12em] text-white/45">2. Siga este caminho no {client}</p><ol className="mt-3 space-y-3">{selected.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm text-white/70"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1689E8]/15 text-[11px] text-[#9bcfff]">{index + 1}</span><span>{step}</span></li>)}</ol><div className="mt-4 flex flex-col gap-2 sm:flex-row"><a href={selected.open} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black"><Play className="h-3.5 w-3.5 fill-current" />Abrir {client}</a><button type="button" onClick={copy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/80"><Copy className="h-3.5 w-3.5" />{copied ? "Copiado" : "Copiar passos"}</button></div></div><div className="rounded-xl border border-[#FF7A59]/25 bg-[#FF7A59]/[0.06] p-4"><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7A59]" /><div><p className="text-sm font-medium">3. Use a configuração oficial do serviço</p><p className="mt-1 text-xs leading-relaxed text-white/60">Após escolher um serviço, como GitHub, Notion ou Google Drive, copie a configuração da documentação dele e cole no local indicado acima. Nunca coloque uma chave de API no prompt.</p></div></div></div></div>;
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

const MCP_CONFIG = `{
  "mcpServers": {
    "meu-servidor": {
      "command": "npx",
      "args": ["-y", "@provedor/mcp-server"],
      "env": { "API_KEY": "SUA_CHAVE_AQUI" }
    }
  }
}`;

function McpGuide({ skill, onClose }) {
  const [client, setClient] = useState("Claude Desktop");
  const recommended = MCP_RECOMMENDATIONS[skill.category] || ["Google Drive", "Notion", "Filesystem"];
  const setup = {
    "Claude Desktop": "Abra Settings > Developer > Edit Config. Adicione o servidor no arquivo de configuração e reinicie o Claude Desktop.",
    "ChatGPT / Codex": "Abra Settings e procure Apps, Connectors ou Developer tools. Adicione o servidor MCP conforme a tela disponível na sua conta.",
    "Cursor": "Abra Settings > MCP e escolha Add new MCP server. Cole a configuração, salve e habilite o servidor.",
    "VS Code": "Abra a Paleta de Comandos e procure MCP: Add Server. Informe o comando do provedor e confirme a configuração.",
  };
  const context = `Use as ferramentas MCP já conectadas quando forem relevantes para esta skill de ${skill.category}. Antes de ler, alterar, enviar ou publicar qualquer dado externo, explique a ação e peça minha confirmação. Não invente resultados: cite quais ferramentas foram usadas e o que foi encontrado.`;
  const copy = async (value, message) => { try { await navigator.clipboard.writeText(value); toast.success(message); } catch { toast.error("Não foi possível copiar."); } };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onMouseDown={onClose}><section onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-white/15 bg-[#101015] shadow-2xl"><header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-white/10 bg-[#101015]/95 p-5 md:p-6 backdrop-blur"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1689E8]/15 text-[#72baff]"><Blocks className="w-5 h-5" /></div><div><p className="text-[10px] uppercase tracking-[0.14em] text-[#72baff] font-mono-code">Conectar ferramentas</p><h3 className="font-display text-xl mt-1">Use MCP nesta skill</h3></div></div><button onClick={onClose} className="text-white/45 hover:text-white"><X className="w-5 h-5" /></button></header><div className="p-5 md:p-6 space-y-6"><p className="text-sm leading-relaxed text-white/60">MCP permite que sua IA use ferramentas conectadas, como arquivos, GitHub ou Notion. A Sentient AI não recebe, guarda nem configura suas chaves.</p><div><p className="text-xs uppercase tracking-[0.12em] text-white/45 mb-3">Recomendados para esta skill</p><div className="flex flex-wrap gap-2">{recommended.map((name) => <span key={name} className="rounded-full border border-[#1689E8]/30 bg-[#1689E8]/10 px-3 py-1.5 text-xs text-[#9bcfff]">{name}</span>)}</div></div><div><p className="text-xs uppercase tracking-[0.12em] text-white/45 mb-3">Onde configurar</p><div className="grid grid-cols-2 gap-2">{Object.keys(setup).map((name) => <button key={name} onClick={() => setClient(name)} className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${client === name ? "border-[#1689E8] bg-[#1689E8]/10 text-white" : "border-white/10 text-white/55 hover:border-white/30"}`}>{name}</button>)}</div><p className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/65">{setup[client]}</p></div><div><div className="flex items-center justify-between gap-3 mb-2"><p className="text-xs uppercase tracking-[0.12em] text-white/45">Modelo de configuração</p><button onClick={() => copy(MCP_CONFIG, "Configuração MCP copiada.")} className="text-xs text-[#FF7A59]">Copiar</button></div><pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/45 p-4 text-xs leading-relaxed text-white/70 font-mono-code">{MCP_CONFIG}</pre><p className="mt-2 text-xs text-white/40">Use o comando e as variáveis fornecidos pelo provedor do MCP. Nunca cole uma chave real em um prompt.</p></div><div className="rounded-xl border border-[#FF7A59]/25 bg-[#FF7A59]/[0.06] p-4"><div className="flex gap-2"><ShieldCheck className="w-4 h-4 shrink-0 text-[#FF7A59] mt-0.5" /><div><p className="text-sm font-medium">Instrução para a IA</p><p className="mt-1 text-xs leading-relaxed text-white/60">Copie este contexto junto do prompt para orientar o uso seguro das ferramentas.</p></div></div><button onClick={() => copy(context, "Instrução MCP copiada.")} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#FF7A59] px-3.5 py-2 text-xs font-medium text-black"><Copy className="w-3.5 h-3.5" />Copiar instrução</button></div></div></section></div>;
}
function LoginRequiredModal({ onClose }) { return <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onMouseDown={onClose}><section onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="login-required-title" className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#15151b] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div className="w-10 h-10 rounded-full bg-[#FF7A59]/15 text-[#FF7A59] flex items-center justify-center"><Bookmark className="w-5 h-5" /></div><button onClick={onClose} aria-label="Fechar aviso" className="text-white/45 hover:text-white"><X className="w-5 h-5" /></button></div><h3 id="login-required-title" className="font-display text-xl mt-5">Salve suas skills</h3><p className="text-sm text-white/60 mt-2 leading-relaxed">Entre ou crie uma conta para adicionar prompts à sua coleção e acessá-los quando quiser.</p><div className="flex gap-3 mt-6"><button onClick={onClose} className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70">Agora não</button><Link to="/login" className="flex-1 rounded-full bg-[#FF7A59] px-4 py-2.5 text-center text-sm font-medium text-black">Entrar</Link></div></section></div>; }
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

  return <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-xl border border-white/15 bg-[#17171e] p-2 shadow-2xl text-left"><div className="flex border-b border-white/10 mb-1"><button onClick={() => setTab("chat")} className={`flex-1 px-3 py-2 text-xs ${tab === "chat" ? "text-white border-b-2 border-[#FF7A59]" : "text-white/45"}`}>Chat</button><button onClick={() => setTab("code")} className={`flex-1 px-3 py-2 text-xs ${tab === "code" ? "text-white border-b-2 border-[#FF7A59]" : "text-white/45"}`}>Code</button></div>{names.map((name) => <button key={name} onClick={() => onChoose(name)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 hover:text-white"><span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-white/[0.06]"><img src={AI_LOGOS[name]} alt={`${name} logo`} className={`h-4 w-4 object-contain ${name === "Perplexity" ? "invert" : ""}`} onError={(event) => { event.currentTarget.classList.add("hidden"); event.currentTarget.nextElementSibling.classList.remove("hidden"); }} /><span aria-hidden="true" className="hidden text-[9px] font-bold text-white/45">AI</span></span>{name}</button>)}<div className="border-t border-white/10 mt-1 pt-1"><button onClick={() => setShowMcp(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#9bcfff] hover:bg-[#1689E8]/10 text-left"><Blocks className="w-3.5 h-3.5" />Conectar ferramentas MCP</button><button onClick={onCopy} className="w-full rounded-lg px-3 py-2 text-xs text-white/55 hover:bg-white/10 text-left">Copiar prompt</button><button onClick={onDownload} className="w-full rounded-lg px-3 py-2 text-xs text-white/55 hover:bg-white/10 text-left"><Download className="w-3.5 h-3.5 inline mr-2" />Baixar Markdown</button></div></div>;
}

function McpQuickPanel({ onBack }) {
  const [client, setClient] = useState("Claude Desktop");
  const setup = { "Claude Desktop": "Settings > Developer > Edit Config", "ChatGPT / Codex": "Settings > Apps, Connectors ou Developer tools", Cursor: "Settings > MCP > Add new MCP server", "VS Code": "Paleta de Comandos > MCP: Add Server" };
  const config = `{"mcpServers":{"meu-servidor":{"command":"npx","args":["-y","@provedor/mcp-server"],"env":{"API_KEY":"SUA_CHAVE_AQUI"}}}}`;
  const context = "Use as ferramentas MCP conectadas quando forem relevantes. Antes de ler, alterar, enviar ou publicar dados externos, explique a ação e peça confirmação. Cite quais ferramentas foram usadas e não invente resultados.";
  const copy = async (value, message) => { try { await navigator.clipboard.writeText(value); toast.success(message); } catch { toast.error("Não foi possível copiar."); } };
  return <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-white/15 bg-[#17171e] p-4 shadow-2xl text-left"><button onClick={onBack} className="text-xs text-white/50 hover:text-white">← Voltar</button><div className="flex gap-2 mt-3"><Blocks className="w-4 h-4 text-[#72baff] mt-0.5" /><div><p className="text-sm font-medium">Conectar via MCP</p><p className="text-xs text-white/50 mt-1">A configuração acontece na IA escolhida; suas chaves não passam pela Sentient AI.</p></div></div><div className="grid grid-cols-2 gap-2 mt-4">{Object.keys(setup).map((name) => <button key={name} onClick={() => setClient(name)} className={`rounded-lg border px-2 py-2 text-left text-[11px] ${client === name ? "border-[#1689E8] bg-[#1689E8]/10 text-white" : "border-white/10 text-white/55"}`}>{name}</button>)}</div><p className="mt-3 rounded-lg bg-black/30 p-3 text-xs text-white/65">{setup[client]}</p><div className="flex justify-between mt-4 mb-2"><p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Modelo de servidor</p><button onClick={() => copy(config, "Configuração MCP copiada.")} className="text-xs text-[#FF7A59]">Copiar</button></div><pre className="overflow-x-auto rounded-lg bg-black/45 p-3 text-[10px] leading-relaxed text-white/70 font-mono-code whitespace-pre-wrap">{config}</pre><button onClick={() => copy(context, "Instrução MCP copiada.")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#FF7A59]/40 px-3 py-2 text-xs text-[#ffab96]"><ShieldCheck className="w-3.5 h-3.5" />Copiar instrução segura para a IA</button></div>;
}
