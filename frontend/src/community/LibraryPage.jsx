import React, { useEffect, useRef, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Copy, Download, LifeBuoy, MessageCircle, MoreHorizontal, Play, PlayCircle, Search, Smartphone } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CommunityMark, errorMessage, Field, handleOf, LoginPrompt, RelDate, ROOT, SaveButton, State, useCommunityData } from "./shared";
import { COMMUNITY_HANDLE, COMMUNITY_NAME } from "./nav";
import { ChannelBar } from "./Channel";
import Markdown from "./Markdown";

export default function LibraryPage() { return <Routes><Route index element={<Library />} /><Route path=":slug" element={<Resource />} /></Routes>; }

// Cada material aparece como uma publicação da equipe, como no canal "Recursos Gratuitos" da referência.
export function ResourcePost({ item }) {
  const { user } = useAuth();
  const url = "/comunidade/biblioteca/" + item.slug;
  return <article className="w-post">
    <CommunityMark size={40} />
    <div className="w-post-main">
      <div className="w-post-head"><span className="w-post-name">{COMMUNITY_NAME}</span><span className="w-badge-team">Equipe</span><span className="w-post-sub">{handleOf(COMMUNITY_HANDLE)} · {item.updated_at ? <RelDate value={item.updated_at} /> : "novo"}</span><span className="w-post-menu" aria-hidden="true"><MoreHorizontal size={16} /></span></div>
      <h2 className="w-post-title"><Link to={url}>{item.title}</Link></h2>
      <div className="w-post-text">{item.summary}</div>
      {item.outcomes?.length > 0 && <ul className="w-arrows">{item.outcomes.map((o, i) => <li key={i}>→ {o}</li>)}</ul>}
      <div className="w-tags">{item.keyword && <span className="w-tag accent">#{item.keyword}</span>}<span className="w-tag">{item.kind}</span><span className="w-tag">{item.level}</span><span className={"w-tag " + (item.status === "ready" ? "ok" : "")}>{item.status === "ready" ? "Disponível" : "Em preparação"}</span></div>
      <Link to={url} className="w-media" aria-label={"Abrir " + item.title}>
        {item.video_url ? <video src={item.video_url + "#t=1"} muted playsInline preload="metadata" tabIndex={-1} /> : <div className="w-media-fallback"><span>{item.title}</span></div>}
        <span className="w-play"><Play size={22} fill="currentColor" /></span>
      </Link>
      <Link to={url} className="w-more">{user ? "Abrir material" : "Junte-se para abrir o material"}</Link>
    </div>
  </article>;
}

function Library() {
  const query = useCommunityData("/resources");
  const [search, setSearch] = useState("");
  const normalize = v => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const filtered = query.data?.filter(r => normalize(r.title + " " + r.summary + " " + (r.keyword || "") + " " + r.category).includes(normalize(search)));
  return <>
    <ChannelBar path="biblioteca" />
    <div className="w-feed-col">
      <div className="w-channel-banner"><span>RECURSOS GRATUITOS</span><small>Fluxos, guias e templates dos vídeos, com passo a passo</small></div>
      <label className="w-search"><Search size={17} /><input aria-label="Buscar materiais" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por assunto ou pela palavra do vídeo (ex.: CNPJ)" /></label>
      <State {...query} retry={query.refresh}>{filtered?.length ? <div className="w-feed">{filtered.map(item => <ResourcePost key={item.slug} item={item} />)}</div>
        : <div className="w-empty">Nenhum material encontrado. <button className="w-link" onClick={() => setSearch("")}>Limpar busca</button></div>}</State>
    </div>
  </>;
}

const PHONE = "(max-width: 700px)";
function useIsPhone() {
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia(PHONE).matches);
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const update = () => setPhone(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return phone;
}

// React não escreve o atributo `muted` no HTML inicial; sem ele o Safari/iOS bloqueia o autoplay. Garantimos pela ref.
function LoopVideo({ src, title }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute("muted", "");
    v.play().catch(() => { /* o navegador bloqueou; os controles continuam disponíveis */ });
  }, [src]);
  return <video ref={ref} src={src} autoPlay loop muted playsInline controls preload="auto" aria-label={"Vídeo: " + title} />;
}

// Celular recebe o corte 9:16 (o mesmo do Reel); telas largas recebem o 16:9. Só um dos dois é carregado.
function Video({ wide, tall, title }) {
  const phone = useIsPhone();
  const vertical = phone ? !!tall : !wide;
  const url = vertical ? tall : wide;
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  const cls = "c-video" + (vertical ? " vertical" : "");
  // Na página do material o vídeo roda sozinho, em loop e sem som (navegadores só permitem autoplay mudo); os controles deixam ativar o som.
  if (yt) return <div className={cls}><iframe src={`https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&playlist=${yt[1]}&playsinline=1`} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /></div>;
  if (/\.(mp4|webm)(\?|$)/i.test(url)) return <div className={cls}><LoopVideo key={url} src={url} title={title} /></div>;
  return <a className="c-video-link" href={url} target="_blank" rel="noopener noreferrer"><PlayCircle size={22} />Assistir ao vídeo</a>;
}

// "**Instalar o Docker.** resto" -> título "Instalar o Docker" + descrição. Sem negrito no início, vira "Passo N".
function splitStep(text, index) {
  const m = text.match(/^\*\*(.+?)\*\*\s*/);
  return m ? { title: m[1].replace(/[.:]\s*$/, ""), body: text.slice(m[0].length) } : { title: `Passo ${index + 1}`, body: text };
}

// Um botão por passo; só a descrição do passo escolhido aparece, com anterior/próximo.
// Marcador que o texto de um passo pode usar para exibir os botões do arquivo naquele ponto.
const DOWNLOAD_MARK = /^\[\[baixar-json\]\]$/m;

function StepBody({ source, fileButtons }) {
  if (!fileButtons || !DOWNLOAD_MARK.test(source)) return <Markdown source={source} />;
  const [before, after] = source.split(DOWNLOAD_MARK);
  return <><Markdown source={before} /><div className="w-step-file">{fileButtons}</div><Markdown source={after} /></>;
}

function Stepper({ steps, fileButtons }) {
  const [active, setActive] = useState(0);
  const tabsRef = useRef(null);
  const items = steps.map(splitStep);
  const current = items[Math.min(active, items.length - 1)];
  const go = i => {
    setActive(i);
    const tab = tabsRef.current?.children[i];
    if (tab && tabsRef.current) tabsRef.current.scrollLeft += tab.getBoundingClientRect().left - tabsRef.current.getBoundingClientRect().left - 8;
  };
  const onKey = e => {
    if (e.key === "ArrowRight" && active < items.length - 1) { go(active + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft" && active > 0) { go(active - 1); e.preventDefault(); }
  };
  return <div className="w-stepper">
    <div className="w-step-tabs" role="tablist" aria-label="Passos do tutorial" ref={tabsRef} onKeyDown={onKey}>
      {items.map((s, i) => <button key={i} role="tab" id={`step-tab-${i}`} aria-selected={i === active} aria-controls="step-panel" tabIndex={i === active ? 0 : -1}
        className={"w-step-tab" + (i === active ? " active" : "") + (i < active ? " done" : "")} onClick={() => go(i)}>
        <span className="w-step-num">{i + 1}</span><span className="w-step-label"><small>Passo {i + 1}</small>{s.title}</span>
      </button>)}
    </div>
    <div className="w-step-panel" role="tabpanel" id="step-panel" aria-labelledby={`step-tab-${active}`}>
      <p className="w-step-count">Passo {active + 1} de {items.length}</p>
      <h3>{current.title}</h3>
      <StepBody source={current.body} fileButtons={fileButtons} />
      <div className="w-step-nav">
        {active > 0 ? <button className="w-btn w-btn-soft" onClick={() => go(active - 1)}><ArrowLeft size={15} />{`Passo ${active}`}</button> : <span />}
        {active < items.length - 1 && <button className="w-btn w-btn-primary" onClick={() => go(active + 1)}>Próximo: {items[active + 1].title}<ArrowRight size={15} /></button>}
      </div>
    </div>
  </div>;
}

function Resource() {
  const { slug } = useParams();
  const { user } = useAuth();
  return <>
    <ChannelBar path="biblioteca" />
    <div className="w-feed-col">
      <Link className="w-back" to="/comunidade/biblioteca"><ArrowLeft size={16} />Recursos Gratuitos</Link>
      {user ? <ResourceDetail slug={slug} /> : <LockedResource slug={slug} />}
    </div>
  </>;
}

// Quem não entrou vê o card do material (título, resumo, vídeo) e o convite; o conteúdo completo exige conta.
function LockedResource({ slug }) {
  const list = useCommunityData("/resources");
  const item = list.data?.find(r => r.slug === slug);
  return <State {...list} retry={list.refresh}>{item ? <>
    <div className="w-detail-head">{item.keyword && <span className="w-tag accent">#{item.keyword}</span>}<h1>{item.title}</h1><p>{item.summary}</p></div>
    {(item.video_url || item.video_vertical_url) && <figure className="c-video-figure"><Video wide={item.video_url} tall={item.video_vertical_url} title={item.title} /></figure>}
    <LoginPrompt title="Junte-se para acessar o material" to={"/comunidade/biblioteca/" + slug}>O passo a passo, os requisitos e o arquivo ficam na comunidade. É grátis e leva menos de um minuto.</LoginPrompt>
  </> : <div className="w-empty">Material não encontrado.</div>}</State>;
}

function ResourceDetail({ slug }) {
  const query = useCommunityData("/resources/" + slug);
  const { user } = useAuth();
  const [busy, setBusy] = useState("");
  const [manualCopy, setManualCopy] = useState("");
  const item = query.data;
  const getFile = async action => {
    setBusy(action); setManualCopy("");
    try {
      const { data } = await api.post(ROOT + "/resources/" + slug + "/download");
      if (action === "copy") {
        try { await navigator.clipboard.writeText(data.content); toast.success("Fluxo copiado. Cole no canvas do n8n."); }
        catch { setManualCopy(data.content); toast.info("Selecione o conteúdo abaixo para copiar."); }
        api.post(ROOT + "/activity", { event: "copy", resource_slug: slug }).catch(() => {});
      } else {
        const url = URL.createObjectURL(new Blob([data.content], { type: data.mime }));
        const a = document.createElement("a"); a.href = url; a.download = data.filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success("Download iniciado");
      }
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(""); }
  };
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.origin + window.location.pathname); toast.success("Link copiado para abrir no computador"); } catch { toast.info("Copie o endereço desta página na barra do navegador."); } };
  const ready = item?.status === "ready";
  // Botões usados dentro do passo "Instalar o workflow": baixam/copiam o mesmo arquivo do painel de acesso.
  const fileButtons = ready
    ? <div className="w-row"><button className="w-btn w-btn-primary" disabled={!!busy} onClick={() => getFile("download")}><Download size={16} />{busy === "download" ? "Preparando…" : "Baixar .json"}</button>
        {item?.kind === "Fluxo" && <button className="w-btn w-btn-soft" disabled={!!busy} onClick={() => getFile("copy")}><Copy size={16} />{busy === "copy" ? "Copiando…" : "Copiar fluxo"}</button>}</div>
    : <div className="w-row"><button className="w-btn w-btn-primary" disabled><Download size={16} />Baixar .json</button><small className="w-step-file-note">O arquivo está em revisão. O botão é liberado assim que ele for publicado; o aviso chega em Anúncios.</small></div>;
  return <State {...query} retry={query.refresh}>{item && <>
    <div className="w-detail-head"><div className="w-tags">{item.keyword && <span className="w-tag accent">#{item.keyword}</span>}<span className="w-tag">{item.category}</span><span className="w-tag">{item.kind}</span><span className="w-tag">{item.level}</span></div><h1>{item.title}</h1><p>{item.summary}</p></div>
    {(item.video_url || item.video_vertical_url) && <figure className="c-video-figure"><Video wide={item.video_url} tall={item.video_vertical_url} title={item.title} /><figcaption>{ready ? "Material da SENTIENT-AI COMMUNITY" : "Visão geral proposta • arquivo em revisão"}</figcaption></figure>}
    {item.outcomes?.length > 0 && <ul className="w-arrows big">{item.outcomes.map((o, i) => <li key={i}>→ {o}</li>)}</ul>}
    <div className="w-access">
      {ready ? <><div><strong>Tudo pronto, {user.name?.split(" ")[0]}</strong><span>Consulte o tutorial antes de executar e teste com dados fictícios.</span></div>
        <div className="w-row">{item.kind === "Fluxo" && <button className="w-btn w-btn-primary" disabled={!!busy} onClick={() => getFile("copy")}><Copy size={16} />{busy === "copy" ? "Copiando…" : "Copiar fluxo"}</button>}
          <button className={"w-btn " + (item.kind === "Fluxo" ? "w-btn-soft" : "w-btn-primary")} disabled={!!busy} onClick={() => getFile("download")}><Download size={16} />{busy === "download" ? "Preparando…" : item.kind === "Fluxo" ? "Baixar .json" : "Baixar guia"}</button><SaveButton slug={slug} /></div></>
        : <><div><strong>O arquivo sai em breve</strong><span>Estamos revisando o fluxo. O aviso chega em Anúncios assim que for liberado.</span></div><div className="w-row"><SaveButton slug={slug} /></div></>}
    </div>
    <p className="w-phone-hint"><Smartphone size={15} /> No celular? A instalação é no computador. <button className="w-link" onClick={copyLink}>Copiar link da página</button></p>
    {manualCopy && <Field label="Conteúdo para copiar"><textarea className="c-copy-fallback" rows={12} readOnly value={manualCopy} onFocus={e => e.target.select()} /></Field>}
    <section className="c-reading"><h2>O que você vai construir</h2><Markdown source={item.body} /></section>
    <section className="c-reading"><h2>Antes de começar</h2><Markdown source={item.requirements || "Os requisitos serão adicionados pela equipe."} /><h3>Custos envolvidos</h3><Markdown source={item.costs || "Consulte os requisitos antes de usar o material."} /></section>
    <section className="c-reading"><h2>{item.steps.length ? "Passo a passo" : "Tutorial em preparação"}</h2>{item.steps.length ? <Stepper steps={item.steps} fileButtons={fileButtons} /> : <p>O passo a passo será publicado junto do arquivo validado.</p>}</section>
    {item.troubleshooting?.length > 0 && <section className="c-reading"><h2>Se algo der errado</h2><div className="c-faq">{item.troubleshooting.map((t, i) => <details key={i}><summary><LifeBuoy size={16} />{t.problem}</summary><Markdown source={t.fix} /></details>)}</div></section>}
    <div className="w-callout"><MessageCircle size={20} /><div><strong>Uma dúvida sobre este material?</strong><span>Converse com quem está implementando também.</span></div><Link className="w-btn w-btn-soft" to={"/comunidade/chat?material=" + slug}>Abrir no chat</Link></div>
    <p className="w-version">Versão {item.version}</p>
  </>}</State>;
}
