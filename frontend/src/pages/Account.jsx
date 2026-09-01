import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Bookmark, Download, ShoppingBag, User, ExternalLink, Loader2, Save } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Account() {
  const { user, setUser } = useAuth();
  const [downloads, setDownloads] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name || "", phone: user.phone || "" });
    Promise.all([api.get("/account/downloads"), api.get("/account/purchases"), api.get("/account/collection")])
      .then(([d, p, c]) => { setDownloads(d.data); setPurchases(p.data); setCollection(c.data); })
      .finally(() => setLoading(false));
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", profile);
      setUser(data);
      toast.success("Perfil atualizado");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-12">
      <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
        <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full bg-[#FF7A59]/10 border border-[#FF7A59]/30 flex items-center justify-center overflow-hidden">
          {user.picture ? <img src={user.picture} alt="" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-[#FF7A59]" />}
        </div>
        <div>
          <h1 className="font-display text-lg sm:text-2xl md:text-3xl">{user.name}</h1>
          <p className="text-white/50 text-xs sm:text-sm font-mono-code break-all">{user.email}</p>
        </div>
      </div>

      <Tabs defaultValue="downloads" className="w-full">
        <TabsList className="w-full max-w-full overflow-x-auto justify-start no-scrollbar bg-white/5 border border-white/10 rounded-full p-1 mb-8">
          <TabsTrigger value="downloads" data-testid="tab-downloads" className="rounded-full data-[state=active]:bg-[#FF7A59] data-[state=active]:text-black px-5">
            <Download className="w-4 h-4 mr-2" /> Downloads
          </TabsTrigger>
          <TabsTrigger value="purchases" data-testid="tab-purchases" className="rounded-full data-[state=active]:bg-[#FF7A59] data-[state=active]:text-black px-5">
            <ShoppingBag className="w-4 h-4 mr-2" /> Compras
          </TabsTrigger>
          <TabsTrigger value="collection" data-testid="tab-collection" className="rounded-full data-[state=active]:bg-[#FF7A59] data-[state=active]:text-black px-5">
            <Bookmark className="w-4 h-4 mr-2" /> Coleção
          </TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile" className="rounded-full data-[state=active]:bg-[#FF7A59] data-[state=active]:text-black px-5">
            <User className="w-4 h-4 mr-2" /> Perfil
          </TabsTrigger>
        </TabsList>

        {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#FF7A59] animate-spin" /></div> : (
          <>
            <TabsContent value="downloads" data-testid="downloads-panel">
              {downloads.length === 0 ? <Empty text="Nenhum download ainda. Explore o marketplace!" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {downloads.map((d) => <HistoryRow key={d.id} item={d} action={<a href={d.download_url} target="_blank" rel="noreferrer" className="text-[#FF7A59] flex items-center gap-1 text-sm hover:underline"><Download className="w-4 h-4" /> Baixar</a>} />)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="purchases" data-testid="purchases-panel">
              {purchases.length === 0 ? <Empty text="Nenhuma compra registrada ainda." /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchases.map((p) => <HistoryRow key={p.id} item={p} action={<span className="text-[#ff7a59] text-sm font-mono-code">R$ {p.price}</span>} />)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="collection" data-testid="collection-panel">
              {collection.length === 0 ? <Empty text="Sua coleção está vazia. Salve as skills que quiser consultar depois." link="/skills" label="Explorar skills" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collection.map((skill) => <CollectionCard key={skill.id} skill={skill} />)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="profile" data-testid="profile-panel">
              <div className="max-w-md space-y-4 rounded-2xl glass p-4 sm:p-6 border border-white/10">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Nome</label>
                  <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} data-testid="profile-name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">WhatsApp</label>
                  <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} data-testid="profile-phone"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#FF7A59]/50 transition-colors" />
                </div>
                <button onClick={saveProfile} disabled={saving} data-testid="profile-save"
                  className="bg-[#FF7A59] text-black font-medium px-6 py-2.5 rounded-full hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

const HistoryRow = ({ item, action }) => (
  <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-[#0F0F13] border border-white/10 p-3">
    <img src={item.thumbnail} alt="" className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-lg object-cover bg-white/5" />
    <div className="flex-1 min-w-0">
      <Link to={`/produto/${item.product_id}`} className="font-display text-sm hover:text-[#FF7A59] transition-colors line-clamp-1">{item.product_title}</Link>
      <p className="text-xs text-white/40 font-mono-code mt-1">{new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
    </div>
    {action}
  </div>
);

const Empty = ({ text, link = "/", label = "Ir ao marketplace" }) => (
  <div className="text-center py-16">
    <p className="text-white/40 mb-4">{text}</p>
    <Link to={link} className="text-[#FF7A59] hover:underline inline-flex items-center gap-1">{label} <ExternalLink className="w-4 h-4" /></Link>
  </div>
);

const CollectionCard = ({ skill }) => (
  <Link to={`/skills/${skill.public_id || skill.id}`} className="block rounded-xl bg-[#0F0F13] border border-white/10 p-5 hover:border-[#FF7A59]/45 transition-colors">
    <div className="flex items-start justify-between gap-3"><span className="text-[10px] uppercase tracking-[0.13em] text-[#FF7A59] font-mono-code">{skill.category}</span><Bookmark className="w-4 h-4 text-[#1689E8] fill-current" /></div>
    <h3 className="font-display text-base mt-3">{skill.title}</h3>
    <p className="text-sm text-white/50 mt-2 line-clamp-2">{skill.description}</p>
    <p className="text-xs text-white/35 mt-4">Salva em {new Date(skill.saved_at).toLocaleDateString("pt-BR")}</p>
  </Link>
);
