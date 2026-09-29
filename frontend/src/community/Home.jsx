import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Instagram, Linkedin, ListChecks, MapPin, Youtube } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, CommunityMark, JoinButton, State, useCommunity, useCommunityData } from "./shared";
import { COMMUNITY_NAME, COMMUNITY_TAGLINE, CREATOR } from "./nav";
import { Post } from "./Channel";
import { ResourcePost } from "./LibraryPage";
import { EventList } from "./Events";
import MembersModal from "./MembersModal";
import CommunityActions from "./CommunityActions";

const TABS = [["inicio", "Início"], ["recursos", "Recursos"], ["encontros", "Encontros"]];

// Página inicial no formato do perfil de comunidade do Whop: capa, avatar, "Junte-se", membros e abas.
export default function Home() {
  const { user } = useAuth();
  const { overview } = useCommunity();
  const [tab, setTab] = useState("inicio");
  const [membersOpen, setMembersOpen] = useState(false);
  const resources = useCommunityData("/resources");
  const joinedBy = overview?.recent_members || [];
  const others = Math.max(0, (overview?.members || 0) - Math.min(2, joinedBy.length));
  const done = overview?.onboarding?.filter(s => s.done).length ?? 0;
  const total = overview?.onboarding?.length ?? 0;
  return <div className="w-profile">
    <div className="w-banner"><div><strong>{COMMUNITY_NAME}</strong><span>{COMMUNITY_TAGLINE}</span></div></div>
    <div className="w-profile-body">
      <span className="w-profile-avatar"><CommunityMark size={96} /></span>
      <div className="w-title-row">
        <div><h1>{COMMUNITY_NAME}</h1><div className="w-subline"><span className="w-free">Gratuita</span>{resources.data && <span>{resources.data.length} {resources.data.length === 1 ? "recurso" : "recursos"}</span>}</div></div>
        <div className="w-row">
          <CommunityActions />
          {user ? <span className="w-btn w-btn-member"><Check size={15} />Membro</span> : <JoinButton />}
        </div>
      </div>
      <div className="w-meta"><span><MapPin size={15} />Brasil</span><span className="w-dot">•</span><span>Criado por <CreatorBadge /></span></div>
      <button className="w-joined" onClick={() => setMembersOpen(true)}><b>{overview?.members ?? "–"}</b> {overview?.members === 1 ? "entrou" : "entraram"}</button>
      {joinedBy.length > 0 && <button className="w-joined-by" onClick={() => setMembersOpen(true)} aria-haspopup="dialog"><span className="w-avatars">{joinedBy.slice(0, 3).map((n, i) => <Avatar key={i} name={n} size={20} />)}</span>
        <span>Juntado por <b>{joinedBy.slice(0, 2).join(", ")}</b>{others > 0 && <>, e {others} {others === 1 ? "outro" : "outros"}</>}</span></button>}
      <MembersModal open={membersOpen} onOpenChange={setMembersOpen} />
    </div>
    <nav className="w-tabs" aria-label="Seções">{TABS.map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {user && total > 0 && done < total && tab === "inicio" && <Link to="/comunidade/onboarding" className="w-progress"><ListChecks size={18} /><span><b>Seus primeiros passos</b> · {done} de {total} concluídos</span><i><em style={{ width: `${(done / total) * 100}%` }} /></i></Link>}
    {tab === "inicio" && <HomeFeed />}
    {tab === "recursos" && <State {...resources} retry={resources.refresh}><div className="w-feed">{resources.data?.map(item => <ResourcePost key={item.slug} item={item} />)}</div></State>}
    {tab === "encontros" && <div className="w-tab-pad"><EventList /></div>}
  </div>;
}

const SOCIAL_ICONS = { linkedin: Linkedin, instagram: Instagram, youtube: Youtube };

// Nome do criador; ao passar o mouse (ou focar/tocar) abre um cartão pequeno só com os logos das redes.
function CreatorBadge() {
  const [open, setOpen] = useState(false);
  const socials = CREATOR.socials.filter(s => s.url);
  return <span className={"w-creator" + (open ? " open" : "")} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
    <button type="button" className="w-creator-name" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(o => !o)} onFocus={() => setOpen(true)}>
      <Avatar name={CREATOR.name} picture={CREATOR.photo} size={20} /><b>{CREATOR.name}</b>
    </button>
    {socials.length > 0 && <span className="w-creator-pop" role="menu" aria-label={`Redes de ${CREATOR.name}`}>
      {socials.map(s => { const Icon = SOCIAL_ICONS[s.network]; return <a key={s.network} role="menuitem" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} className={"w-social " + s.network}><Icon size={18} /></a>; })}
    </span>}
  </span>;
}

function HomeFeed() {
  const feed = useCommunityData("/posts?channel=todos");
  const resources = useCommunityData("/resources");
  return <State loading={feed.loading || resources.loading} error={feed.error || resources.error} retry={() => { feed.refresh(); resources.refresh(); }}>
    <div className="w-feed">
      {feed.data?.items.map(p => <Post key={p.id} post={p} />)}
      {/* Com poucas conversas, os materiais mais recentes completam o feed do início. */}
      {(feed.data?.items.length || 0) < 5 && resources.data?.slice(0, 3).map(item => <ResourcePost key={item.slug} item={item} />)}
    </div>
  </State>;
}
