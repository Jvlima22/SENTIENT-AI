import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ChevronDown, Copy, Flag, Link2, Linkedin, Loader2, Mail, MoreHorizontal, Search, Send, Settings, Share2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AppIcon, errorMessage, ROOT } from "./shared";
import { CHANNEL_LIST, COMMUNITY_NAME, VIP_PLAN } from "./nav";

const COMMUNITY_URL = () => window.location.origin + "/comunidade";
const SHARE_TEXT = `Entrei na ${COMMUNITY_NAME}: fluxos de automação e IA com passo a passo. Vem também:`;

async function copyText(text, ok = "Link copiado") {
  try { await navigator.clipboard.writeText(text); toast.success(ok); } catch { toast.info("Copie o endereço na barra do navegador."); }
}

// Botões ao lado de "Junte-se": convidar, notificações e mais opções (como no perfil de comunidade do Whop).
export default function CommunityActions() {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [share, setShare] = useState(false);
  const [notify, setNotify] = useState(false);
  const [report, setReport] = useState(false);
  const needLogin = () => { nav("/cadastro", { state: { from: loc.pathname } }); };
  return <div className="w-actions-row">
    <button className="w-icon-btn w-soft" onClick={() => setShare(true)} aria-label="Convidar pessoas" title="Convidar pessoas"><UserPlus size={17} /></button>
    <button className="w-icon-btn w-soft" onClick={() => (user ? setNotify(true) : needLogin())} aria-label="Preferências de notificação" title="Notificações"><Bell size={17} /></button>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="w-icon-btn w-soft" aria-label="Mais opções"><MoreHorizontal size={18} /></DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="w-portal w-menu" align="end" sideOffset={8}>
          <DropdownMenu.Item className="w-menu-item" onSelect={() => copyText(COMMUNITY_URL())}><Link2 size={17} />Copiar link</DropdownMenu.Item>
          <DropdownMenu.Item className="w-menu-item" onSelect={() => (user ? setReport(true) : needLogin())}><Flag size={17} />Relatório</DropdownMenu.Item>
          <DropdownMenu.Item className="w-menu-item" onSelect={() => (user ? nav("/comunidade/meu-espaco") : needLogin())}><Settings size={17} />Gerenciar associação</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
    <ShareModal open={share} onOpenChange={setShare} />
    {user && <NotificationsSheet open={notify} onOpenChange={setNotify} />}
    {user && <ReportModal open={report} onOpenChange={setReport} />}
  </div>;
}

const XLogo = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5.3 22H2.2l7.7-8.8L1.8 2h6.7l4.7 6.2L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z" /></svg>;
const WhatsLogo = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" /></svg>;

function ShareModal({ open, onOpenChange }) {
  const [query, setQuery] = useState("");
  const url = COMMUNITY_URL();
  const text = encodeURIComponent(SHARE_TEXT);
  const link = encodeURIComponent(url);
  const targets = [
    { key: "whatsapp", label: "WhatsApp", color: "#25d366", icon: <WhatsLogo />, href: `https://wa.me/?text=${text}%20${link}` },
    { key: "telegram", label: "Telegram", color: "#229ed9", icon: <Send size={24} />, href: `https://t.me/share/url?url=${link}&text=${text}` },
    { key: "linkedin", label: "LinkedIn", color: "#0a66c2", icon: <Linkedin size={24} />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}` },
    { key: "email", label: "E-mail", color: "#3f3f46", icon: <Mail size={24} />, href: `mailto:?subject=${encodeURIComponent(COMMUNITY_NAME)}&body=${text}%20${link}` },
  ].filter(t => t.label.toLowerCase().includes(query.trim().toLowerCase()));
  const nativeShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: COMMUNITY_NAME, text: SHARE_TEXT, url }); } catch { /* cancelado */ } }
    else copyText(url);
  };
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
      <DialogPrimitive.Content className="w-portal w-modal w-share fixed left-1/2 top-1/2 z-[81] -translate-x-1/2 -translate-y-1/2">
        <div className="w-share-head">
          <div><DialogPrimitive.Title className="w-modal-title">Convidar pessoas</DialogPrimitive.Title><DialogPrimitive.Description className="w-modal-sub">Traga seus amigos para esta comunidade</DialogPrimitive.Description></div>
          <div className="w-row">
            <button className="w-round-btn" onClick={() => copyText(url)} aria-label="Copiar link" title="Copiar link"><Copy size={17} /></button>
            <a className="w-round-btn" href={`https://twitter.com/intent/tweet?text=${text}&url=${link}`} target="_blank" rel="noopener noreferrer" aria-label="Compartilhar no X" title="Compartilhar no X"><XLogo /></a>
            <button className="w-round-btn" onClick={nativeShare} aria-label="Mais opções de compartilhamento" title="Compartilhar"><Share2 size={17} /></button>
          </div>
        </div>
        <div className="w-share-body">
          <div className="w-share-bar"><strong>Compartilhar com alguém</strong><label className="w-share-search"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar" aria-label="Pesquisar onde compartilhar" /></label></div>
          <div className="w-share-grid">{targets.map(t => <a key={t.key} className="w-share-tile" href={t.href} target="_blank" rel="noopener noreferrer"><span style={{ background: t.color }}>{t.icon}</span>{t.label}</a>)}
            {!targets.length && <p className="w-modal-sub">Nada encontrado.</p>}</div>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

const CHANNEL_TYPES = { onboarding: "Onboarding", "apresente-se": "Fórum", anuncios: "Anúncios", chat: "Chat", biblioteca: "Fórum", vip: "Conteúdo" };
const LEVELS = [["todas", "Todas as publicações", "Avisar a cada nova publicação no canal"], ["respostas", "Só respostas e menções", "Avisar quando responderem ou mencionarem você"], ["nenhuma", "Nenhuma", "Não avisar sobre este canal"]];

// Painel lateral "Preferências de notificação", um item por canal, como no Whop.
function NotificationsSheet({ open, onOpenChange }) {
  const [prefs, setPrefs] = useState(null);
  const [expanded, setExpanded] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setError("");
    api.get(ROOT + "/notification-prefs").then(r => setPrefs(r.data.channels)).catch(e => setError(errorMessage(e)));
  }, [open]);
  const channels = [...CHANNEL_LIST.filter(c => c.path !== "encontros").map(c => ({ key: c.path, label: c.label, icon: c.icon, color: c.color })),
    { key: "vip", label: VIP_PLAN.label, icon: VIP_PLAN.icon, color: VIP_PLAN.color }];
  const change = async (key, level) => {
    const before = prefs;
    setPrefs(p => ({ ...p, [key]: level }));
    try { const { data } = await api.put(ROOT + "/notification-prefs", { channels: { [key]: level } }); setPrefs(data.channels); }
    catch (e) { setPrefs(before); toast.error(errorMessage(e)); }
  };
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/60" />
      <DialogPrimitive.Content className="w-portal w-sheet fixed right-0 top-0 bottom-0 z-[81]">
        <div className="w-sheet-head"><DialogPrimitive.Title className="w-modal-title">Preferências de notificação</DialogPrimitive.Title><DialogPrimitive.Close className="w-icon-btn" aria-label="Fechar"><X size={20} /></DialogPrimitive.Close></div>
        <DialogPrimitive.Description className="sr-only">Escolha quando ser avisado sobre cada canal da comunidade.</DialogPrimitive.Description>
        <div className="w-sheet-body">
          {error && <p className="c-error">{error}</p>}
          {!prefs && !error && <div className="w-members-state"><Loader2 className="c-spin" size={20} /></div>}
          {prefs && channels.map(c => {
            const isOpen = expanded === c.key;
            const current = LEVELS.find(l => l[0] === prefs[c.key]);
            return <div key={c.key} className={"w-pref" + (isOpen ? " open" : "")}>
              <button className="w-pref-head" onClick={() => setExpanded(isOpen ? "" : c.key)} aria-expanded={isOpen}>
                <AppIcon icon={c.icon} color={c.color} size={34} />
                <span className="w-pref-text"><strong>{c.label}</strong><small>{CHANNEL_TYPES[c.key]} · {current?.[1]}</small></span>
                <ChevronDown size={18} className="w-pref-chevron" />
              </button>
              {isOpen && <div className="w-pref-options" role="radiogroup" aria-label={`Notificações de ${c.label}`}>
                {LEVELS.map(([value, label, hint]) => <label key={value} className="w-pref-option">
                  <input type="radio" name={"pref-" + c.key} checked={prefs[c.key] === value} onChange={() => change(c.key, value)} />
                  <span><b>{label}</b><small>{hint}</small></span>
                </label>)}
              </div>}
            </div>;
          })}
          {prefs && <p className="w-sheet-note">As preferências ficam salvas na sua conta. O envio dos avisos por e-mail será ativado em breve.</p>}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

const REASONS = [["spam", "Spam ou divulgação repetitiva"], ["conteudo-improprio", "Conteúdo impróprio ou ofensivo"], ["golpe", "Golpe ou tentativa de fraude"], ["outro", "Outro problema"]];

function ReportModal({ open, onOpenChange }) {
  const loc = useLocation();
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post(ROOT + "/reports", { reason, details, url: loc.pathname });
      toast.success("Relatório enviado. A equipe vai analisar.");
      setDetails(""); onOpenChange(false);
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
      <DialogPrimitive.Content className="w-portal w-modal w-report fixed left-1/2 top-1/2 z-[81] -translate-x-1/2 -translate-y-1/2">
        <div className="w-sheet-head"><DialogPrimitive.Title className="w-modal-title">Relatório</DialogPrimitive.Title><DialogPrimitive.Close className="w-icon-btn" aria-label="Fechar"><X size={20} /></DialogPrimitive.Close></div>
        <form onSubmit={submit} className="w-report-body">
          <DialogPrimitive.Description className="w-modal-sub">Conte o que está acontecendo. Só a equipe vê este relatório.</DialogPrimitive.Description>
          <div role="radiogroup" aria-label="Motivo" className="w-report-reasons">{REASONS.map(([value, label]) => <label key={value} className="w-pref-option"><input type="radio" name="reason" checked={reason === value} onChange={() => setReason(value)} /><span><b>{label}</b></span></label>)}</div>
          <textarea className="w-report-text" rows={3} maxLength={2000} value={details} onChange={e => setDetails(e.target.value)} placeholder="Detalhes (opcional): onde viu, quem publicou, o que aconteceu" aria-label="Detalhes" />
          <div className="w-row w-report-foot"><DialogPrimitive.Close className="w-btn w-btn-soft" type="button">Cancelar</DialogPrimitive.Close><button className="w-btn w-btn-primary" disabled={busy}>{busy ? "Enviando…" : "Enviar relatório"}</button></div>
        </form>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
