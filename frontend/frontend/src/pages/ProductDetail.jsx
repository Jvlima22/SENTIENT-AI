import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { ArrowLeft, Download, ShoppingCart, Eye, Check, Loader2, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLead, setShowLead] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "" });
  const [submitting, setSubmitting] = useState(false);
  const [unlocked, setUnlocked] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => { setProduct(r.data); setLoading(false); })
      .catch(() => { toast.error("Produto não encontrado"); nav("/"); });
    // `nav` (useNavigate) mantém referência estável entre renders; recarregar apenas quando `id` muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user && product) setForm((f) => ({ ...f, name: user.name || "", email: user.email || "", phone: user.phone || "" }));
  }, [user, product]);

  const handleFree = () => {
    if (!user) { toast.info("Faça login para acessar o recurso gratuito"); nav("/login", { state: { from: `/produto/${id}` } }); return; }
    setShowLead(true);
  };

  const submitLead = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/leads", { ...form, product_id: id });
      setUnlocked(data.download_url || product.download_url);
      setShowLead(false);
      toast.success("Acesso liberado! Confira abaixo.");
    } catch { toast.error("Erro ao enviar formulário"); }
    finally { setSubmitting(false); }
  };

  const handleBuy = async () => {
    if (user) { try { await api.post("/purchases/track", { product_id: id }); } catch {} }
    if (product.checkout_url) window.open(product.checkout_url, "_blank");
    else toast.info("Checkout indisponível no momento");
  };

  if (loading || !product)
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" /></div>;

  const isFree = product.type === "free";

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#00F0FF] mb-8 transition-colors" data-testid="back-link">
        <ArrowLeft className="w-4 h-4" /> Voltar ao marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-wide text-[#00F0FF] font-mono-code">{product.category_name}</span>
            {isFree ? (
              <span className="border border-white/25 text-white/70 text-xs rounded-full px-2.5 py-1 font-mono-code">{t("free")}</span>
            ) : (
              <span className="bg-[#FFF000] text-black font-bold text-xs rounded-full px-2.5 py-1 font-mono-code">R$ {product.price}</span>
            )}
          </div>
          <h1 className="font-display font-700 text-3xl md:text-4xl leading-tight tracking-tight mb-4" data-testid="product-title">{product.title}</h1>
          <div className="flex items-center gap-4 text-sm text-white/40 mb-8 font-mono-code">
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {product.views || 0} visualizações</span>
            {isFree && <span className="flex items-center gap-1.5"><Download className="w-4 h-4" /> {product.downloads || 0} downloads</span>}
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10 mb-8">
            <img src={product.thumbnail} alt={product.title} className="w-full aspect-video object-cover" />
          </div>
          <h2 className="font-display text-xl mb-3">Descrição</h2>
          <p className="text-white/65 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-full px-3 py-1 font-mono-code">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl glass p-6 border border-white/10">
            {isFree ? (
              <>
                <p className="text-3xl font-display font-700 mb-1">Grátis</p>
                <p className="text-sm text-white/50 mb-6">Cadastre-se para liberar o acesso imediato.</p>
                {unlocked ? (
                  <a href={unlocked} target="_blank" rel="noreferrer" data-testid="download-link"
                    className="w-full bg-[#22C55E] text-black font-medium px-6 py-3.5 rounded-full flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                    <Download className="w-5 h-5" /> Baixar agora
                  </a>
                ) : (
                  <button onClick={handleFree} data-testid="get-free-btn"
                    className="w-full bg-[#00F0FF] text-black font-medium px-6 py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-white transition-colors">
                    <Download className="w-5 h-5" /> {t("get_free")}
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-3xl font-display font-700 mb-1">R$ {product.price}</p>
                <p className="text-sm text-white/50 mb-6">Pagamento seguro via checkout externo.</p>
                <button onClick={handleBuy} data-testid="buy-btn"
                  className="w-full bg-[#FFF000] text-black font-bold px-6 py-3.5 rounded-full flex items-center justify-center gap-2 hover:brightness-110 transition-all premium-glow">
                  <ShoppingCart className="w-5 h-5" /> {t("buy_now")} <ExternalLink className="w-4 h-4" />
                </button>
              </>
            )}
            <div className="mt-6 space-y-3 text-sm text-white/60">
              {["Acesso imediato após confirmação", "Salvo em Minha Conta", "Suporte pela comunidade"].map((f) => (
                <div key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00F0FF]" /> {f}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showLead} onOpenChange={setShowLead}>
        <DialogContent className="bg-[#0A0A0F] border-white/10 text-white" data-testid="lead-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Liberar acesso gratuito</DialogTitle>
            <DialogDescription className="text-white/50">Preencha para receber {product.title}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} testid="lead-name" />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} testid="lead-email" type="email" />
            <Field label="WhatsApp (opcional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} testid="lead-phone" placeholder="+55 11 99999-9999" />
            <button onClick={submitLead} disabled={submitting || !form.name || !form.email} data-testid="lead-submit"
              className="w-full bg-[#00F0FF] text-black font-medium px-6 py-3 rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Liberar acesso
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Field = ({ label, value, onChange, testid, type = "text", placeholder }) => (
  <div>
    <label className="text-sm text-white/60 mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#00F0FF]/50 transition-colors" />
  </div>
);
