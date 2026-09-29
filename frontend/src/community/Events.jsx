import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Video } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { errorMessage, ROOT, State, useCommunityData } from "./shared";
import { ChannelBar } from "./Channel";

export default function Events() {
  return <><ChannelBar path="encontros" /><div className="w-feed-col"><div className="w-channel-intro"><h1>Encontros</h1><p>Tempo reservado para construir, tirar dúvidas e aprender junto.</p></div><EventList /></div></>;
}

// A agenda é pública; o link da sala e a gravação só aparecem para membros.
export function EventList() {
  const query = useCommunityData("/events");
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [access, setAccess] = useState({});
  const [busy, setBusy] = useState("");
  const open = async id => {
    if (!user) { nav("/cadastro", { state: { from: loc.pathname } }); return; }
    setBusy(id);
    try { const { data } = await api.get(ROOT + "/events/" + id + "/access"); setAccess(a => ({ ...a, [id]: data })); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(""); }
  };
  const end = e => new Date(e.starts_at).getTime() + e.duration_minutes * 60000;
  const upcoming = query.data?.filter(e => end(e) >= Date.now());
  const past = query.data?.filter(e => end(e) < Date.now()).reverse();
  const render = e => <article className="w-event" key={e.id}>
    <div className="w-event-date"><strong>{new Date(e.starts_at).getDate()}</strong><span>{new Date(e.starts_at).toLocaleDateString("pt-BR", { month: "short" })}</span></div>
    <div className="w-event-body"><h3>{e.title}</h3><p>{e.description}</p><small>{new Date(e.starts_at).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })} · {e.duration_minutes} min · horário do seu dispositivo</small></div>
    <div className="w-event-actions">{access[e.id] ? <>{access[e.id].join_url && <a className="w-btn w-btn-primary" href={access[e.id].join_url} target="_blank" rel="noreferrer">Entrar no encontro</a>}{access[e.id].recording_url && <a className="w-btn w-btn-soft" href={access[e.id].recording_url} target="_blank" rel="noreferrer"><Video size={15} />Gravação</a>}{!access[e.id].join_url && !access[e.id].recording_url && <small>O link será adicionado pela equipe.</small>}</>
      : <button className="w-btn w-btn-soft" disabled={busy === e.id} onClick={() => open(e.id)}>{busy === e.id ? "Carregando…" : user ? "Acessar" : "Junte-se para acessar"}</button>}</div>
  </article>;
  return <State {...query} retry={query.refresh}>
    <h2 className="w-subtitle">Próximos encontros</h2>
    {upcoming?.length ? upcoming.map(render) : <div className="w-empty"><CalendarDays size={20} /> O próximo encontro ainda será marcado. Sugira um tema no chat.</div>}
    {past?.length > 0 && <><h2 className="w-subtitle">Encontros anteriores</h2>{past.map(render)}</>}
  </State>;
}
