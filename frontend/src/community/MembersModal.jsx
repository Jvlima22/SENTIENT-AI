import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, errorMessage, handleOf, ROOT } from "./shared";

// Lista de membros aberta pelo "Juntado por", com o botão de seguir (como na referência do Whop).
export default function MembersModal({ open, onOpenChange }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, has_more: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (offset = 0) => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get(`${ROOT}/members?offset=${offset}`);
      setItems(list => offset ? [...list, ...data.items] : data.items);
      setMeta({ total: data.total, has_more: data.has_more });
    } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };
  useEffect(() => { if (open) load(0); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
      <DialogPrimitive.Content className="w-members fixed left-1/2 top-1/2 z-[81] -translate-x-1/2 -translate-y-1/2" aria-describedby={undefined}>
        <div className="w-members-head">
          <DialogPrimitive.Title className="w-members-title">Membros{meta.total ? <span> · {meta.total}</span> : null}</DialogPrimitive.Title>
          <DialogPrimitive.Close className="w-icon-btn w-members-close" aria-label="Fechar"><X size={20} /></DialogPrimitive.Close>
        </div>
        <div className="w-members-list">
          {items.map(m => <MemberRow key={m.user_id} member={m} onClose={() => onOpenChange(false)} />)}
          {loading && <div className="w-members-state"><Loader2 className="c-spin" size={20} /></div>}
          {error && <div className="w-members-state">{error} <button className="w-link" onClick={() => load(items.length)}>Tentar de novo</button></div>}
          {!loading && !error && !items.length && <div className="w-members-state">Ainda não há membros.</div>}
          {meta.has_more && !loading && <div className="w-members-state"><button className="w-btn w-btn-soft" onClick={() => load(items.length)}>Ver mais membros</button></div>}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

function MemberRow({ member, onClose }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [following, setFollowing] = useState(member.following);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    if (!user) { onClose(); nav("/cadastro", { state: { from: loc.pathname } }); return; }
    setBusy(true);
    try { const { data } = await api[following ? "delete" : "put"](`${ROOT}/follows/${member.user_id}`); setFollowing(data.following); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return <div className="w-member-row">
    <Avatar name={member.name} picture={member.picture} size={40} />
    <div className="w-member-text"><strong>{member.name}</strong><span>{handleOf(member.name)}</span></div>
    {!member.is_me && <button className={"w-btn " + (following ? "w-btn-soft" : "w-btn-primary")} onClick={toggle} disabled={busy} aria-pressed={following}>{following ? "Seguindo" : "Seguir"}</button>}
  </div>;
}
