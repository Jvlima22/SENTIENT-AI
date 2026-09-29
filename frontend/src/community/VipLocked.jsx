import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AppIcon, errorMessage, JoinButton, ROOT, useCommunity } from "./shared";
import { VIP, vipItem } from "./nav";

// Canal do plano VIP: bloqueado, com lista de espera até a assinatura existir.
export default function VipLocked() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { overview, refreshOverview } = useCommunity();
  const [busy, setBusy] = useState(false);
  const item = vipItem(slug);
  if (!item) return <div className="w-feed-col"><div className="w-empty">Canal não encontrado. <Link className="w-link" to="/comunidade">Voltar ao início</Link></div></div>;
  const join = async () => {
    setBusy(true);
    try { await api.put(ROOT + "/vip-waitlist"); await refreshOverview(); toast.success("Você está na lista do VIP."); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return <>
    <div className="w-channel-bar"><AppIcon icon={item.icon} color={item.color} size={24} /><strong>{item.label}</strong><Lock size={15} className="w-lock" /></div>
    <div className="w-feed-col"><div className="w-vip">
      <span className="w-vip-icon"><AppIcon icon={item.icon} color={item.color} size={64} /><Lock size={14} className="w-vip-lock" /></span>
      <span className="w-tag">Membro VIP · em breve</span>
      <h1>{item.label}</h1>
      <p>{item.pitch}</p>
      <ul className="w-vip-list">{VIP.map(v => <li key={v.slug} className={v.slug === slug ? "current" : ""}><AppIcon icon={v.icon} color={v.color} size={16} />{v.label}</li>)}</ul>
      {!user ? <JoinButton label="Junte-se grátis para entrar na lista" />
        : overview?.vip_waitlist ? <p className="w-ok"><Check size={17} /> Você está na lista de espera. O aviso chega para você antes de todo mundo.</p>
        : <button className="w-btn w-btn-primary" onClick={join} disabled={busy}>{busy ? "Entrando…" : "Entrar na lista de espera"}</button>}
      <Link to="/comunidade/biblioteca" className="w-link">Enquanto isso, veja os recursos gratuitos</Link>
    </div></div>
  </>;
}
