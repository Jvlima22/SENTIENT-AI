import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { SearchProvider } from "@/context/SearchContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";

import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Skills from "@/pages/Skills";
import Community from "@/pages/Community";
import FAQ from "@/pages/FAQ";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AuthCallback from "@/pages/AuthCallback";
import Account from "@/pages/Account";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminLeads from "@/pages/admin/AdminLeads";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;

  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/produto/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/skills" element={<Layout><Skills /></Layout>} />
      <Route path="/comunidade" element={<Layout><Community /></Layout>} />
      <Route path="/faq" element={<Layout><FAQ /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/conta" element={<ProtectedRoute><Layout><Account /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><AdminLayout /></Layout></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="produtos" element={<AdminProducts />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="leads" element={<AdminLeads />} />
      </Route>
    </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <SearchProvider>
            <AppRouter />
            <Toaster position="top-right" theme="dark" toastOptions={{ style: { background: "#0A0A0F", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" } }} />
          </SearchProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;