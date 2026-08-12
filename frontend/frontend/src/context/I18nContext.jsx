import React, { createContext, useContext, useState } from "react";

const dict = {
  pt: {
    marketplace: "Marketplace", skills: "Skills Claude", community: "Comunidade", faq: "FAQ",
    login: "Entrar", register: "Criar conta", account: "Minha Conta", admin: "Admin", logout: "Sair",
    hero_tag: "Hub de Ativos Digitais com IA",
    hero_title: "Descubra, acesse e escale com recursos digitais inteligentes",
    hero_sub: "Produtos, automações, templates, skills e ferramentas de IA em um só lugar. Grátis ou premium.",
    explore: "Explorar recursos", talk_ai: "Falar com a IA",
    all: "Todos", free: "Grátis", paid: "Pago", search: "Buscar recursos...",
    featured: "Em destaque", all_resources: "Todos os recursos", no_results: "Nenhum recurso encontrado.",
    view_details: "Ver detalhes", get_free: "Acessar grátis", buy_now: "Comprar agora",
    copy: "Copiar", copied: "Copiado!", copy_command: "Copiar comando",
    smart_search: "Busca inteligente", ai_placeholder: "Descreva o que você precisa...",
    recommend: "Recomendar", downloads: "Downloads", purchases: "Compras", profile: "Perfil",
  },
  en: {
    marketplace: "Marketplace", skills: "Claude Skills", community: "Community", faq: "FAQ",
    login: "Sign in", register: "Sign up", account: "My Account", admin: "Admin", logout: "Logout",
    hero_tag: "AI-Powered Digital Assets Hub",
    hero_title: "Discover, access and scale with smart digital resources",
    hero_sub: "Products, automations, templates, skills and AI tools in one place. Free or premium.",
    explore: "Explore resources", talk_ai: "Talk to AI",
    all: "All", free: "Free", paid: "Paid", search: "Search resources...",
    featured: "Featured", all_resources: "All resources", no_results: "No resources found.",
    view_details: "View details", get_free: "Get for free", buy_now: "Buy now",
    copy: "Copy", copied: "Copied!", copy_command: "Copy command",
    smart_search: "Smart search", ai_placeholder: "Describe what you need...",
    recommend: "Recommend", downloads: "Downloads", purchases: "Purchases", profile: "Profile",
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState("pt");
  const t = (key) => dict[lang][key] || key;
  const toggle = () => setLang((l) => (l === "pt" ? "en" : "pt"));
  return <I18nContext.Provider value={{ lang, t, toggle }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
