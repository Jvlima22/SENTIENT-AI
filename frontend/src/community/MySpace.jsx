import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Avatar, DateLabel, handleOf, State, useCommunityData } from "./shared";
import { ResourcePost } from "./LibraryPage";

export default function MySpace() {
  const { user, logout } = useAuth();
  const mine = useCommunityData("/me");
  const resources = useCommunityData("/resources");
  const saved = resources.data?.filter(r => mine.data?.saved.some(s => s.slug === r.slug));
  return <div className="w-feed-col">
    <div className="w-me-head"><Avatar name={user.name} size={64} /><div><h1>{user.name}</h1><span>{handleOf(user.name)}</span></div>
      <div className="w-row"><Link className="w-btn w-btn-soft" to="/conta">Editar perfil</Link>{logout && <button className="w-btn w-btn-ghost" onClick={logout}>Sair</button>}</div></div>
    <State loading={mine.loading || resources.loading} error={mine.error || resources.error} retry={() => { mine.refresh(); resources.refresh(); }}>
      <h2 className="w-subtitle">Materiais salvos</h2>
      {saved?.length ? <div className="w-feed">{saved.map(item => <ResourcePost key={item.slug} item={item} />)}</div> : <div className="w-empty">Use o botão Salvar na página de um material para guardá-lo aqui. <Link className="w-link" to="/comunidade/biblioteca">Ver recursos</Link></div>}
      <h2 className="w-subtitle">Seus downloads</h2>
      {mine.data?.downloads.length ? <div className="w-list">{mine.data.downloads.map(d => <div key={d.slug} className="w-list-row"><span>{d.title}</span><DateLabel value={d.downloaded_at} />{resources.data?.some(r => r.slug === d.slug) ? <Link className="w-link" to={"/comunidade/biblioteca/" + d.slug}>Abrir</Link> : <small>Retirado do catálogo</small>}</div>)}</div>
        : <div className="w-empty">Os materiais que você baixar vão aparecer aqui.</div>}
    </State>
  </div>;
}
