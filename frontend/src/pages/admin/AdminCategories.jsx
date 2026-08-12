import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X } from "lucide-react";

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "layers" });
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/categories").then((r) => { setCats(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try { await api.post("/categories", form); toast.success("Categoria criada"); setOpen(false); setForm({ name: "", description: "", icon: "layers" }); load(); }
    catch { toast.error("Erro ao salvar"); } finally { setSaving(false); }
  };
  const del = async (id) => { if (!window.confirm("Excluir categoria?")) return; await api.delete(`/categories/${id}`); toast.success("Excluída"); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-2xl">Categorias</h1><p className="text-white/50 text-sm">{cats.length} categorias</p></div>
        <button onClick={() => setOpen(true)} data-testid="new-category-btn" className="bg-[#FF7A59] text-black font-medium px-4 py-2.5 rounded-full hover:bg-white transition-colors flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Nova</button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#FF7A59] animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="categories-grid">
          {cats.map((c) => (
            <div key={c.id} className="rounded-xl bg-[#0F0F13] border border-white/10 p-5 flex items-start justify-between">
              <div><h3 className="font-display text-base mb-1">{c.name}</h3><p className="text-sm text-white/50">{c.description}</p></div>
              <button onClick={() => del(c.id)} data-testid={`delete-category-${c.id}`} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-[#FF3B30] transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[#0A0A0F] border border-white/10 p-6" onClick={(e) => e.stopPropagation()} data-testid="category-form">
            <div className="flex items-center justify-between mb-5"><h2 className="font-display text-xl">Nova categoria</h2><button onClick={() => setOpen(false)}><X className="w-5 h-5 text-white/50" /></button></div>
            <div className="space-y-3">
              <div><label className="text-sm text-white/60 mb-1.5 block">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="cat-name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50 transition-colors" /></div>
              <div><label className="text-sm text-white/60 mb-1.5 block">Descrição</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="cat-desc" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50 transition-colors" /></div>
              <button onClick={save} disabled={saving || !form.name} data-testid="save-category-btn" className="w-full bg-[#FF7A59] text-black font-medium px-6 py-3 rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
