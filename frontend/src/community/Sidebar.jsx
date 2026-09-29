import React, { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CalendarDays, Crown, Hand, House, LifeBuoy, Library, ListChecks, Lock, Megaphone, MessagesSquare, Settings2, UserRound, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CommunityMark, JoinButton, useCommunity } from "./shared";
import { COMMUNITY_NAME, VIP, VIP_PLAN } from "./nav";

// Mesmo padrão da barra lateral do Admin: fundo #08080b, itens com ícone neutro e ativo em laranja.
const GROUPS = [
  { title: "Comece aqui", items: [
    { path: "", label: "Início", icon: House, end: true },
    { path: "onboarding", label: "Onboarding", icon: ListChecks },
    { path: "apresente-se", label: "Apresente-se", icon: Hand },
    { path: "anuncios", label: "Anúncios", icon: Megaphone },
  ] },
  { title: "Comunidade", items: [
    { path: "chat", label: "Chat", icon: MessagesSquare },
    { path: "encontros", label: "Encontros", icon: CalendarDays },
  ] },
  { title: "Conteúdos", items: [
    { path: "biblioteca", label: "Recursos gratuitos", icon: Library },
  ] },
];
const to = path => "/comunidade" + (path ? "/" + path : "");
const itemClass = ({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-[#FF7A59]/10 text-[#FF7A59]" : "text-white/55 hover:text-white hover:bg-white/5"}`;
const chipClass = ({ isActive }) => `shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition-colors ${isActive ? "bg-[#FF7A59] text-black" : "bg-white/5 text-white/65 border border-white/10"}`;

export function Sidebar() {
  const { user } = useAuth();
  const { overview } = useCommunity();
  const personal = [
    user && { path: "meu-espaco", label: "Meu espaço", icon: UserRound },
    user?.role === "admin" && { path: "admin", label: "Administrar", icon: Settings2 },
  ].filter(Boolean);
  return <aside className="w-60 shrink-0 border-r border-white/10 bg-[#08080b] hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar" aria-label="Canais da comunidade">
    <div className="p-4 pb-2">
      <Link to="/comunidade" className="flex items-center gap-2.5 px-2">
        <CommunityMark size={28} />
        <span className="min-w-0">
          <span className="block font-display text-[13px] leading-tight">{COMMUNITY_NAME}</span>
          <span className="flex items-center gap-1.5 text-[11px] text-white/40"><Users className="w-3 h-3" />{overview ? `${overview.members} ${overview.members === 1 ? "membro" : "membros"}` : "Comunidade"}{overview?.online > 0 && <><span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />{overview.online} online</>}</span>
        </span>
      </Link>
    </div>
    <nav className="flex-1 px-4 pt-3 space-y-5">
      {GROUPS.map(g => <div key={g.title}>
        <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-white/30 font-mono-code">{g.title}</p>
        <div className="space-y-0.5">{g.items.map(it => <NavLink key={it.path} to={to(it.path)} end={it.end} className={itemClass}><it.icon className="w-4 h-4" />{it.label}</NavLink>)}</div>
      </div>)}
      {personal.length > 0 && <div>
        <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-white/30 font-mono-code">Você</p>
        <div className="space-y-0.5">{personal.map(it => <NavLink key={it.path} to={to(it.path)} className={itemClass}><it.icon className="w-4 h-4" />{it.label}</NavLink>)}</div>
      </div>}
    </nav>
    <div className="p-4 space-y-3">
      <NavLink to={to("vip/" + VIP_PLAN.slug)} className={({ isActive }) => `block rounded-xl border p-3.5 transition-colors ${isActive ?"border-[#FF7A59]/50 bg-[#FF7A59]/10" : "border-white/10 bg-white/[0.03] hover:border-[#FF7A59]/40"}`}>
        <span className="flex items-center gap-2 text-sm font-medium"><Crown className="w-4 h-4 text-[#FF7A59]" />Membro VIP<Lock className="w-3.5 h-3.5 ml-auto text-white/35" /></span>
        <span className="block mt-1.5 text-xs text-white/45 leading-relaxed">{VIP.length} canais exclusivos: {VIP.slice(0, 3).map(v => v.label).join(", ")} e mais.</span>
        <span className="block mt-2 text-xs text-[#FF7A59]">Em breve · ver o que tem →</span>
      </NavLink>
      {!user && <JoinButton label="Junte-se grátis" className="flex w-full items-center justify-center text-sm font-medium bg-[#FF7A59] text-black px-4 py-2 rounded-full hover:bg-white transition-colors" />}
      <Link to="/faq" className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors"><LifeBuoy className="w-4 h-4" /> Contatar suporte</Link>
    </div>
  </aside>;
}

// No celular, o mesmo menu vira uma faixa de chips com rolagem, como no Admin.
export function MobileNav() {
  const { user } = useAuth();
  const loc = useLocation();
  const ref = useRef(null);
  // Mantém o chip do canal atual visível na faixa.
  useEffect(() => {
    const nav = ref.current, active = nav?.querySelector('a[aria-current="page"]');
    if (nav && active) nav.scrollLeft += active.getBoundingClientRect().left - nav.getBoundingClientRect().left - 16;
  }, [loc.pathname]);
  const items = [...GROUPS.flatMap(g => g.items), user && { path: "meu-espaco", label: "Meu espaço", icon: UserRound }, { path: "vip/" + VIP_PLAN.slug, label: "VIP", icon: Crown }].filter(Boolean);
  return <nav ref={ref} className="md:hidden px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/10 flex gap-2" aria-label="Canais da comunidade">
    {items.map(it => <NavLink key={it.path} to={to(it.path)} end={it.end} className={chipClass}><it.icon className="w-3.5 h-3.5" />{it.label}</NavLink>)}
  </nav>;
}
