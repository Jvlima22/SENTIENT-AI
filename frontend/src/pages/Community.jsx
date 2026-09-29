import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { CommunityContext, LoginPrompt, ROOT, State } from "@/community/shared";
import { clearCampaign, readCampaign } from "@/community/access";
import { MobileNav, Sidebar } from "@/community/Sidebar";
import Home from "@/community/Home";
import Onboarding from "@/community/Onboarding";
import Channel from "@/community/Channel";
import LibraryPage from "@/community/LibraryPage";
import Events from "@/community/Events";
import MySpace from "@/community/MySpace";
import VipLocked from "@/community/VipLocked";
import "@/community/community.css";
const Admin = lazy(() => import("@/community/Admin"));

// Comunidade no formato Whop: vitrine pública (canais e materiais visíveis), página do material e ações só com conta.
export default function Community() {
  const { user, loading } = useAuth();
  const [overview, setOverview] = useState(null);
  const member = !!user;
  const refreshOverview = useCallback(() => api.get(ROOT + "/overview").then(r => setOverview(r.data)).catch(() => {}), []);

  useEffect(() => {
    if (loading || user === null) return;
    if (!member) { refreshOverview(); return; }
    // Registra a entrada (com a origem do Reel, se houver) e a presença.
    const campaign = readCampaign();
    api.post(ROOT + "/join", campaign || {}).then(() => clearCampaign()).catch(() => {}).finally(refreshOverview);
    api.post(ROOT + "/activity", { event: "visit" }).catch(() => {});
  }, [loading, user, member, refreshOverview]);

  if (loading || user === null) return <div className="community-app"><State loading /></div>;
  const link = path => "/comunidade" + (path ? "/" + path : "");
  const onlyMembers = (el, title, text) => member ? el : <div className="w-page"><LoginPrompt title={title}>{text}</LoginPrompt></div>;

  return <CommunityContext.Provider value={{ overview, refreshOverview }}>
    <div className="community-app w-app">
      <a href="#community-main" className="c-skip">Pular para o conteúdo</a>
      <Sidebar />
      <main className="w-main" id="community-main" tabIndex={-1}>
        <MobileNav />
        <Suspense fallback={<State loading />}><Routes>
          <Route index element={<Home />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="apresente-se/*" element={<Channel channel="apresente-se" />} />
          <Route path="anuncios/*" element={<Channel channel="anuncios" />} />
          <Route path="chat/*" element={<Channel channel="chat" />} />
          <Route path="discussoes/*" element={<Navigate to="/comunidade/chat" replace />} />
          <Route path="comecar" element={<Navigate to="/comunidade/onboarding" replace />} />
          <Route path="biblioteca/*" element={<LibraryPage />} />
          <Route path="encontros" element={<Events />} />
          <Route path="meu-espaco" element={onlyMembers(<MySpace />, "Seu espaço", "Entre para ver seus materiais salvos e downloads.")} />
          <Route path="vip/:slug" element={<VipLocked />} />
          <Route path="admin" element={user?.role === "admin" ? <div className="w-page"><Admin /></div> : <div className="w-page"><div className="c-empty">Área exclusiva da equipe.</div></div>} />
          <Route path="*" element={<div className="w-page"><div className="c-empty"><h1>Página não encontrada</h1><Link to="/comunidade">Voltar ao início</Link></div></div>} />
        </Routes></Suspense>
      </main>
    </div>
  </CommunityContext.Provider>;
}
