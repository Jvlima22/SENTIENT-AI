import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Loader2, Mail, Phone } from "lucide-react";

const STATUS = ["new", "contacted", "converted", "lost"];
const LABEL = { new: "Novo", contacted: "Contactado", converted: "Convertido", lost: "Perdido" };
const COLOR = { new: "text-[#00F0FF]", contacted: "text-[#FFB800]", converted: "text-[#22C55E]", lost: "text-white/40" };

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => api.get("/admin/leads").then((r) => { setLeads(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => { await api.put(`/admin/leads/${id}`, { status }); toast.success("Status atualizado"); load(); };
  const del = async (id) => { if (!window.confirm("Excluir lead?")) return; await api.delete(`/admin/leads/${id}`); toast.success("Excluído"); load(); };

  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Leads</h1>
      <p className="text-white/50 text-sm mb-6">{leads.length} leads capturados</p>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" /></div> : leads.length === 0 ? (
        <p className="text-white/40 py-16 text-center">Nenhum lead capturado ainda.</p>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-x-auto" data-testid="leads-table">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-white/5 text-white/50 text-xs uppercase font-mono-code">
              <tr><th className="text-left px-4 py-3">Lead</th><th className="text-left px-4 py-3">Contato</th><th className="text-left px-4 py-3">Interesse</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-white/5 hover:bg-white/5" data-testid={`lead-row-${l.id}`}>
                  <td className="px-4 py-3"><p className="text-white/90">{l.name}</p><p className="text-xs text-white/35 font-mono-code">{new Date(l.created_at).toLocaleDateString("pt-BR")}</p></td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1.5 text-white/60 text-xs"><Mail className="w-3.5 h-3.5" /> {l.email}</p>
                    {l.phone && <p className="flex items-center gap-1.5 text-white/60 text-xs mt-1"><Phone className="w-3.5 h-3.5" /> {l.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-white/50">{l.product_title || "—"}</td>
                  <td className="px-4 py-3">
                    <select value={l.status || "new"} onChange={(e) => updateStatus(l.id, e.target.value)} data-testid={`lead-status-${l.id}`}
                      className={`bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none ${COLOR[l.status] || COLOR.new}`}>
                      {STATUS.map((s) => <option key={s} value={s} className="bg-[#0A0A0F] text-white">{LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right"><button onClick={() => del(l.id)} data-testid={`delete-lead-${l.id}`} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-[#FF3B30] transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
