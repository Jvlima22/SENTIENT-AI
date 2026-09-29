import React, { useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Heart, Link2, LockKeyhole, MessageCircle, MoreHorizontal, Pin, Share, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AppIcon, Avatar, errorMessage, handleOf, JoinButton, RelDate, ROOT, State, useCommunity, useCommunityData } from "./shared";
import { CHANNELS, channelInfo } from "./nav";

export default function Channel({ channel }) {
  return <Routes><Route index element={<Feed channel={channel} />} /><Route path=":id" element={<Thread channel={channel} />} /></Routes>;
}

// Barra do canal, logo abaixo do topo (como no Whop): ícone, nome e ações rápidas.
export function ChannelBar({ path }) {
  const info = channelInfo(path);
  const { overview } = useCommunity();
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.origin + "/comunidade/" + path); toast.success("Link do canal copiado"); } catch { toast.info("Copie o endereço na barra do navegador."); } };
  return <div className="w-channel-bar">
    <AppIcon icon={info.icon} color={info.color} size={24} /><strong>{info.label}</strong>
    <div className="w-channel-actions">
      <button className="w-icon-btn" onClick={copy} aria-label="Copiar link do canal" title="Copiar link"><Link2 size={17} /></button>
      <span className="w-members-pill" title="Membros"><Users size={16} />{overview?.members ?? "–"}</span>
    </div>
  </div>;
}

function useShare() {
  return async url => {
    const full = window.location.origin + url;
    try { if (navigator.share) await navigator.share({ url: full }); else { await navigator.clipboard.writeText(full); toast.success("Link copiado"); } }
    catch { /* compartilhamento cancelado */ }
  };
}

// Curtida única (coração), como no Whop. Quem não entrou é levado ao cadastro.
function LikeButton({ post }) {
  const { user } = useAuth();
  const { refreshOverview } = useCommunity();
  const nav = useNavigate();
  const loc = useLocation();
  const [count, setCount] = useState(post.reactions?.coracao || 0);
  const [liked, setLiked] = useState((post.my_reactions || []).includes("coracao"));
  const toggle = async () => {
    if (!user) { nav("/cadastro", { state: { from: loc.pathname } }); return; }
    const was = liked;
    setLiked(!was); setCount(c => Math.max(0, c + (was ? -1 : 1)));
    try { await api[was ? "delete" : "put"](`${ROOT}/posts/${post.id}/reactions/coracao`); if (!was) refreshOverview(); }
    catch (e) { setLiked(was); setCount(c => Math.max(0, c + (was ? 1 : -1))); toast.error(errorMessage(e)); }
  };
  return <button type="button" className={"w-action" + (liked ? " liked" : "")} aria-pressed={liked} aria-label={`Curtir (${count})`} onClick={toggle}><Heart size={17} fill={liked ? "currentColor" : "none"} /><span>{count}</span></button>;
}

export function PostBody({ text, limit = 420 }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  return <><div className={"w-post-text" + (long && !open ? " clamp" : "")}>{text}</div>{long && <button className="w-more" onClick={() => setOpen(!open)}>{open ? "Ver menos" : "Ver mais"}</button>}</>;
}

export function Post({ post, channel, thread = false, onRemove }) {
  const { user } = useAuth();
  const share = useShare();
  const url = `/comunidade/${channel || post.channel}/${post.id}`;
  const canRemove = user && (user.role === "admin" || post.author.user_id === user.user_id);
  return <article className="w-post">
    <Avatar name={post.author.name} size={40} />
    <div className="w-post-main">
      <div className="w-post-head">
        <span className="w-post-name">{post.author.name}</span>
        {post.author.role === "admin" && <span className="w-badge-team">Equipe</span>}
        <span className="w-post-sub">{handleOf(post.author.name)} · <RelDate value={post.created_at} /></span>
        {post.pinned && <span className="w-post-sub"><Pin size={12} /> Fixada</span>}
        {post.locked && <LockKeyhole size={13} className="w-post-sub" aria-label="Encerrada" />}
        {canRemove && onRemove ? <button className="w-icon-btn w-post-menu" onClick={onRemove} aria-label="Remover publicação" title="Remover"><Trash2 size={15} /></button>
          : <span className="w-post-menu" aria-hidden="true"><MoreHorizontal size={16} /></span>}
      </div>
      {post.title && (thread ? <h1 className="w-post-title">{post.title}</h1> : <h2 className="w-post-title"><Link to={url}>{post.title}</Link></h2>)}
      <PostBody text={post.body} limit={thread ? 100000 : 420} />
      {post.resource_slug && <Link className="w-link" to={"/comunidade/biblioteca/" + post.resource_slug}>Material relacionado</Link>}
      <div className="w-post-actions">
        <Link to={url} className="w-action" aria-label="Respostas"><MessageCircle size={17} /><span>{post.reply_count || 0}</span></Link>
        <LikeButton post={post} />
        <button type="button" className="w-action" onClick={() => share(url)} aria-label="Compartilhar"><Share size={16} /></button>
      </div>
    </div>
  </article>;
}

function Composer({ channel, onPosted, material }) {
  const { user } = useAuth();
  const { refreshOverview } = useCommunity();
  const [form, setForm] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);
  if (!user) return <div className="w-composer guest"><span>Junte-se à comunidade para publicar e responder.</span><JoinButton /></div>;
  if (channel === "anuncios" && user.role !== "admin") return null;
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post(ROOT + "/posts", { ...form, channel, resource_slug: material || null });
      setForm({ title: "", body: "" }); onPosted(); refreshOverview(); toast.success("Publicado");
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  return <form className="w-composer" onSubmit={submit}>
    <Avatar name={user.name} size={40} />
    <div className="w-composer-main">
      {channel === "anuncios" && <input className="w-composer-title" aria-label="Título" placeholder="Título" maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />}
      <textarea aria-label="Sua publicação" required minLength={2} maxLength={8000} rows={2} placeholder={CHANNELS[channel].placeholder} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
      <div className="w-composer-foot"><small>Nada de senhas ou dados de clientes.</small><button className="w-btn w-btn-primary" disabled={busy || form.body.trim().length < 2}>{busy ? "Publicando…" : "Publicar"}</button></div>
    </div>
  </form>;
}

function Feed({ channel }) {
  const [params] = useSearchParams();
  const material = params.get("material") || "";
  const [offset, setOffset] = useState(0);
  const feed = useCommunityData(`/posts?channel=${channel}&offset=${offset}` + (material ? "&resource_slug=" + encodeURIComponent(material) : ""));
  const info = CHANNELS[channel];
  return <>
    <ChannelBar path={channel} />
    <div className="w-feed-col">
      <div className="w-channel-intro"><h1>{info.title}</h1><p>{info.description}</p></div>
      {material && <div className="w-filter-note">Conversas sobre um material específico · <Link to={`/comunidade/${channel}`}>ver todas</Link></div>}
      <Composer channel={channel} material={material} onPosted={() => { setOffset(0); feed.refresh(); }} />
      <State {...feed} retry={feed.refresh}>{feed.data?.items.length ? <div className="w-feed">{feed.data.items.map(p => <Post key={p.id} post={p} channel={channel} />)}</div>
        : <div className="w-empty">{channel === "apresente-se" ? "Ninguém se apresentou ainda. Seja a primeira pessoa." : channel === "anuncios" ? "Nenhum anúncio ainda." : "A primeira conversa pode ser sua."}</div>}
        <div className="w-pagination">{offset > 0 && <button className="w-btn w-btn-soft" onClick={() => setOffset(n => Math.max(0, n - 20))}>Anteriores</button>}{feed.data?.has_more && <button className="w-btn w-btn-soft" onClick={() => setOffset(n => n + 20)}>Mais publicações</button>}</div>
      </State>
    </div>
  </>;
}

function Thread({ channel }) {
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshOverview } = useCommunity();
  const [offset, setOffset] = useState(0);
  const query = useCommunityData(`/posts/${id}?offset=${offset}`);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const p = query.data?.post;
  const back = `/comunidade/${channel}`;
  const execute = async fn => { setBusy(true); try { await fn(); query.refresh(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } };
  const remove = (url, isPost = false) => { if (window.confirm("Remover esta publicação da comunidade?")) execute(async () => { await api.delete(ROOT + url); if (isPost) nav(back); }); };
  const reply = e => { e.preventDefault(); execute(async () => { await api.post(`${ROOT}/posts/${id}/replies`, { body }); setBody(""); refreshOverview(); toast.success("Resposta publicada"); }); };
  return <>
    <ChannelBar path={channel} />
    <div className="w-feed-col">
      <Link to={back} className="w-back"><ArrowLeft size={16} />{CHANNELS[channel].title}</Link>
      <State {...query} retry={query.refresh}>{p && <>
        <Post post={p} channel={channel} thread onRemove={() => remove("/posts/" + id, true)} />
        {user?.role === "admin" && <div className="w-row w-moderation">
          <button className="w-btn w-btn-soft" disabled={busy} onClick={() => execute(() => api.patch(`${ROOT}/posts/${id}/moderation`, { pinned: !p.pinned, locked: p.locked }))}>{p.pinned ? "Desafixar" : "Fixar"}</button>
          <button className="w-btn w-btn-soft" disabled={busy} onClick={() => execute(() => api.patch(`${ROOT}/posts/${id}/moderation`, { pinned: p.pinned, locked: !p.locked }))}>{p.locked ? "Reabrir conversa" : "Encerrar conversa"}</button>
        </div>}
        <div className="w-replies">
          {query.data.replies.map(r => <div key={r.id} className="w-reply">
            <Avatar name={r.author.name} size={32} />
            <div className="w-post-main">
              <div className="w-post-head"><span className="w-post-name">{r.author.name}</span>{r.author.role === "admin" && <span className="w-badge-team">Equipe</span>}<span className="w-post-sub">{handleOf(r.author.name)} · <RelDate value={r.created_at} /></span>
                {user && (user.role === "admin" || r.author.user_id === user.user_id) && <button className="w-icon-btn w-post-menu" disabled={busy} onClick={() => remove(`/posts/${id}/replies/${r.id}`)} aria-label="Remover resposta"><Trash2 size={14} /></button>}</div>
              <div className="w-post-text">{r.body}</div>
            </div>
          </div>)}
          {!query.data.replies.length && <div className="w-empty small">Ainda não há respostas.</div>}
          <div className="w-pagination">{offset > 0 && <button className="w-btn w-btn-soft" onClick={() => setOffset(n => n - 50)}>Respostas anteriores</button>}{query.data.has_more && <button className="w-btn w-btn-soft" onClick={() => setOffset(n => n + 50)}>Mais respostas</button>}</div>
        </div>
        {!user ? <div className="w-composer guest"><span>Junte-se para responder.</span><JoinButton /></div>
          : p.locked ? <div className="w-empty small"><LockKeyhole size={16} /> Esta conversa foi encerrada pela equipe.</div>
          : <form className="w-composer" onSubmit={reply}><Avatar name={user.name} size={32} /><div className="w-composer-main"><textarea aria-label="Sua resposta" required maxLength={5000} rows={2} value={body} onChange={e => setBody(e.target.value)} placeholder="Escreva uma resposta" /><div className="w-composer-foot"><span /><button className="w-btn w-btn-primary" disabled={busy || !body.trim()}>{busy ? "Publicando…" : "Responder"}</button></div></div></form>}
      </>}</State>
    </div>
  </>;
}
