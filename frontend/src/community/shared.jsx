import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Bookmark, Check, FileText, GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth, formatApiError } from "@/context/AuthContext";

export const ROOT = "/community-hub";

// Dados do cabeçalho (membros, online, onboarding) compartilhados entre o menu e as páginas.
export const CommunityContext = createContext({ overview: null, refreshOverview: () => {} });
export const useCommunity = () => useContext(CommunityContext);
export const membersLabel = o => `${o.members} ${o.members === 1 ? "membro" : "membros"} · ${o.online} online`;

// @handle no estilo do Whop, derivado do nome (sem acentos e espaços).
export const handleOf = name => "@" + (name || "membro").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Ícone quadrado de canal, como os "apps" da comunidade no Whop.
export function AppIcon({ icon: Icon, color, size = 20 }) {
  return <span className="w-app-icon" style={{ width: size, height: size, background: color }} aria-hidden="true"><Icon size={Math.round(size * 0.62)} strokeWidth={2.2} /></span>;
}

export function CommunityMark({ size = 32 }) {
  return <span className="w-mark" style={{ width: size, height: size, fontSize: Math.round(size * 0.48) }} aria-hidden="true">S</span>;
}

// Leva ao cadastro e volta para a página atual depois (ou para `to`, se informado).
export function JoinButton({ to, label = "Junte-se", className = "w-btn w-btn-primary" }) {
  const loc = useLocation();
  return <Link className={className} to="/cadastro" state={{ from: to || loc.pathname + loc.search }}>{label}</Link>;
}

export function LoginLink({ to, label = "Entrar", className = "w-btn w-btn-ghost" }) {
  const loc = useLocation();
  return <Link className={className} to="/login" state={{ from: to || loc.pathname + loc.search }}>{label}</Link>;
}

// Cartão mostrado no lugar de conteúdo exclusivo de membros.
export function LoginPrompt({ title = "Junte-se para continuar", children, to }) {
  return <div className="w-login-prompt"><CommunityMark size={48} /><h2>{title}</h2><p>{children || "A comunidade é gratuita. Crie sua conta em menos de um minuto."}</p><div className="w-row"><JoinButton to={to} label="Junte-se grátis" /><LoginLink to={to} label="Já tenho conta" className="w-btn w-btn-soft" /></div></div>;
}
export function errorMessage(error) { return formatApiError(error?.response?.data?.detail || "Não foi possível carregar. Tente novamente."); }
export function useCommunityData(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    setData(null); setError("");
    if (!path) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    api.get(ROOT + path, { signal: controller.signal }).then(r => setData(r.data)).catch(e => {
      if (!controller.signal.aborted) setError(errorMessage(e));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, revision]);
  return { data, error, loading, refresh };
}
export function State({ loading, error, retry, children }) {
  if (loading) return <div className="c-state" role="status"><Loader2 className="c-spin" size={24} /> Carregando…</div>;
  if (error) return <div className="c-empty" role="alert"><h2>Vamos tentar de novo</h2><p>{error}</p><button className="c-button" onClick={retry}>Tentar novamente</button></div>;
  return children;
}
export function ResourceCard({ item }) {
  const Icon = item.kind === "Fluxo" ? GitBranch : FileText;
  return <Link className={'c-resource c-resource-' + item.category.toLowerCase().replace(/[^a-z]/g, '')} to={'/comunidade/biblioteca/' + item.slug}>
    <div className="c-resource-art"><Icon size={44} strokeWidth={1.25} /><span>{item.kind}</span><span className="c-art-line" /></div>
    <div className="c-resource-content"><div className="c-meta"><span>{item.category}</span><span>{item.status === "ready" ? "Disponível" : "Em preparação"}</span></div><h3>{item.title}</h3><p>{item.summary}</p><div className="c-resource-foot"><span>{item.level}</span><ArrowUpRight size={18} /></div></div>
  </Link>;
}
export function SaveButton({ slug }) {
  const { user } = useAuth();
  const mine = useCommunityData(user ? "/me" : null);
  const [busy, setBusy] = useState(false);
  const loc = useLocation();
  if (!user) return <Link className="c-button" to="/cadastro" state={{ from: loc.pathname }}><Bookmark size={16} /> Salvar</Link>;
  const saved = mine.data?.saved.some(s => s.slug === slug);
  const toggle = async () => {
    setBusy(true);
    try { await api[saved ? "delete" : "put"](ROOT + "/saved/" + slug); mine.refresh(); toast.success(saved ? "Material removido dos salvos" : "Material salvo no seu espaço"); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return <button className="c-button" onClick={toggle} disabled={busy || mine.loading || !!mine.error} aria-pressed={!!saved}>{saved ? <Check size={16} /> : <Bookmark size={16} />}{saved ? "Salvo" : "Salvar"}</button>;
}
export function Field({ label, children }) { return <label className="c-field"><span>{label}</span>{children}</label>; }
export function DateLabel({ value }) { return <time dateTime={value}>{new Date(value).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}</time>; }
const AVATAR_COLORS = ["#1754d8", "#218358", "#e5484d", "#8e4ec6", "#f5a524", "#0d9488", "#ff7a59"];
export function Avatar({ name, size, picture }) {
  // Foto externa (login Google) ou arquivo do próprio site (/community/...).
  if (picture && (/^https:\/\//.test(picture) || /^\/[^/]/.test(picture))) return <img className="c-avatar photo" src={picture} alt="" style={size ? { width: size, height: size } : undefined} referrerPolicy="no-referrer" />;
  const letter = name?.trim().slice(0, 1).toUpperCase() || "J";
  const color = AVATAR_COLORS[(name || "").split("").reduce((n, ch) => n + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return <span className="c-avatar" aria-hidden="true" style={size ? { width: size, height: size, fontSize: Math.round(size * 0.42), background: color } : { background: color }}>{letter}</span>;
}
// Data curta como no Whop: "4h", "3d" até uma semana; depois "21 de set.".
export function RelDate({ value }) {
  const d = new Date(value), diff = (Date.now() - d.getTime()) / 1000;
  const text = diff < 60 ? "agora" : diff < 3600 ? `${Math.floor(diff / 60)}min` : diff < 86400 ? `${Math.floor(diff / 3600)}h` : diff < 604800 ? `${Math.floor(diff / 86400)}d`
    : d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  return <time dateTime={value} title={d.toLocaleString("pt-BR")}>{text}</time>;
}
