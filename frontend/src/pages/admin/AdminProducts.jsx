import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, X } from "lucide-react";

const empty = { title: "", short_description: "", description: "", category_id: "", type: "free", price: 0, thumbnail: "", checkout_url: "", download_url: "", tags: "", featured: false };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/products").then((r) => { setProducts(r.data); setLoading(false); });
  useEffect(() => { load(); api.get("/categories").then((r) => setCategories(r.data)); }, []);

  const openNew = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (p) => { setForm({ ...p, tags: (p.tags || []).join(", ") }); setEditId(p.id); setOpen(true); };

  const save = async () => {
    setSaving(true);
    const payload = { ...form, price: parseFloat(form.price) || 0, tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [] };
    try {
      if (editId) await api.put(`/products/${editId}`, payload);
      else await api.post("/products", payload);
      toast.success(editId ? "Produto atualizado" : "Produto criado");
      setOpen(false); load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Excluir este produto?")) return;
    await api.delete(`/products/${id}`);
    toast.success("Produto excluído"); load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="font-display text-2xl">Produtos</h1><p className="text-white/50 text-sm">{products.length} itens</p></div>
        <button onClick={openNew} data-testid="new-product-btn" className="bg-[#FF7A59] text-black font-medium px-4 py-2.5 rounded-full hover:bg-white transition-colors flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Novo produto
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#FF7A59] animate-spin" /></div> : (
        <div className="rounded-xl border border-white/10 overflow-x-auto" data-testid="products-table">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-white/5 text-white/50 text-xs uppercase font-mono-code">
              <tr><th className="text-left px-4 py-3">Produto</th><th className="text-left px-4 py-3 hidden md:table-cell">Categoria</th><th className="text-left px-4 py-3">Tipo</th><th className="text-right px-4 py-3">Ações</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={p.thumbnail} alt="" className="w-10 h-10 rounded object-cover bg-white/5" /><span className="line-clamp-1">{p.title}</span></div></td>
                  <td className="px-4 py-3 text-white/50 hidden md:table-cell">{p.category_name}</td>
                  <td className="px-4 py-3">{p.type === "free" ? <span className="text-white/60 text-xs">Grátis</span> : <span className="text-[#ff7a59] text-xs font-mono-code">R$ {p.price}</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-[#FF7A59] transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => del(p.id)} data-testid={`delete-product-${p.id}`} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-[#FF3B30] transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0A0A0F] border border-white/10 p-6" onClick={(e) => e.stopPropagation()} data-testid="product-form">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl">{editId ? "Editar produto" : "Novo produto"}</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-3">
              <F label="Título" v={form.title} on={(v) => setForm({ ...form, title: v })} t="prod-title" />
              <F label="Descrição curta" v={form.short_description} on={(v) => setForm({ ...form, short_description: v })} t="prod-short" />
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Descrição completa</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} data-testid="prod-desc"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50 transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Categoria</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} data-testid="prod-cat"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50">
                    <option value="" className="bg-[#0A0A0F]">Selecione</option>
                    {categories.map((c) => <option key={c.id} value={c.id} className="bg-[#0A0A0F]">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} data-testid="prod-type"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50">
                    <option value="free" className="bg-[#0A0A0F]">Grátis</option>
                    <option value="paid" className="bg-[#0A0A0F]">Pago</option>
                  </select>
                </div>
              </div>
              {form.type === "paid" ? (
                <>
                  <F label="Preço (R$)" v={form.price} on={(v) => setForm({ ...form, price: v })} t="prod-price" type="number" />
                  <F label="URL de Checkout" v={form.checkout_url} on={(v) => setForm({ ...form, checkout_url: v })} t="prod-checkout" />
                </>
              ) : (
                <F label="URL de Download" v={form.download_url} on={(v) => setForm({ ...form, download_url: v })} t="prod-download" />
              )}
              <F label="URL da Thumbnail" v={form.thumbnail} on={(v) => setForm({ ...form, thumbnail: v })} t="prod-thumb" />
              <F label="Tags (separadas por vírgula)" v={form.tags} on={(v) => setForm({ ...form, tags: v })} t="prod-tags" />
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="prod-featured" className="accent-[#FF7A59]" /> Destacar produto
              </label>
              <button onClick={save} disabled={saving || !form.title} data-testid="save-product-btn"
                className="w-full bg-[#FF7A59] text-black font-medium px-6 py-3 rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const F = ({ label, v, on, t, type = "text" }) => (
  <div>
    <label className="text-sm text-white/60 mb-1.5 block">{label}</label>
    <input type={type} value={v} onChange={(e) => on(e.target.value)} data-testid={t}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50 transition-colors" />
  </div>
);
