import { Briefcase, CalendarDays, Crown, GraduationCap, Hand, LayoutTemplate, Library, ListChecks, Megaphone, MessageCircle, MessagesSquare, Phone, Trophy, Video } from "lucide-react";

export const COMMUNITY_NAME = "SENTIENT-AI COMMUNITY";
export const COMMUNITY_HANDLE = "sentientai";
export const COMMUNITY_TAGLINE = "IA aplicada a automação";

// Criador da comunidade. Redes sem link não aparecem no cartão.
export const CREATOR = {
  name: "Josué Lima",
  photo: "/community/josue-lima.webp",
  socials: [
    { network: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/josu%C3%A9-lima-67b2843b3/" },
    { network: "instagram", label: "Instagram", url: "https://www.instagram.com/jotadev.ai/" },
    { network: "youtube", label: "YouTube", url: "https://www.youtube.com/channel/UCr2EZb9NH-w2SovBG7mCMJA" },
  ],
};

// Canais gratuitos, na ordem do menu lateral (como os "apps" de uma comunidade no Whop).
export const CHANNEL_LIST = [
  { path: "onboarding", icon: ListChecks, label: "Onboarding", color: "#ff7a59" },
  { path: "apresente-se", icon: Hand, label: "Apresente-se", color: "#f5a524" },
  { path: "anuncios", icon: Megaphone, label: "Anúncios", color: "#e5484d" },
  { path: "chat", icon: MessagesSquare, label: "Chat", color: "#1754d8" },
  { path: "biblioteca", icon: Library, label: "Recursos Gratuitos", color: "#218358" },
  { path: "encontros", icon: CalendarDays, label: "Encontros", color: "#8e4ec6" },
];

export const CHANNELS = {
  anuncios: { title: "Anúncios", description: "Novos conteúdos, encontros e avisos da equipe.", placeholder: "Escreva um anúncio para toda a comunidade" },
  "apresente-se": { title: "Apresente-se", description: "Conte quem você é, o que faz e o que quer automatizar.", placeholder: "Oi! Sou… trabalho com… e quero automatizar…" },
  chat: { title: "Chat", description: "Dúvidas, resultados e conversa sobre o que você está construindo.", placeholder: "Compartilhe uma dúvida, um resultado ou uma ideia" },
};

export const channelInfo = path => CHANNEL_LIST.find(c => c.path === path);

// Plano VIP: aparece com cadeado até a assinatura existir.
export const VIP_PLAN = { slug: "membro-vip", icon: Crown, label: "Membro VIP", pitch: "Acesso a tudo que está com cadeado: cursos, templates, chat direto e lives.", color: "#b8860b" };
export const VIP = [
  { slug: "mini-cursos", icon: GraduationCap, label: "Mini-Cursos", pitch: "Trilhas curtas para sair do zero ao fluxo rodando em produção.", color: "#218358" },
  { slug: "templates-e-skills", icon: LayoutTemplate, label: "Templates e Skills", pitch: "Biblioteca completa de fluxos, prompts e skills prontos para adaptar.", color: "#218358" },
  { slug: "chat-vip", icon: MessageCircle, label: "Chat VIP", pitch: "Conversa direta com o Jota e com quem está implementando em empresa.", color: "#218358" },
  { slug: "oportunidades", icon: Briefcase, label: "Oportunidades VIP", pitch: "Projetos e vagas de automação compartilhados com os membros.", color: "#218358" },
  { slug: "lives-gravadas", icon: Video, label: "Lives Gravadas", pitch: "Todas as lives de implementação para assistir quando quiser.", color: "#218358" },
  { slug: "conquistas", icon: Trophy, label: "Conquistas", pitch: "Reconhecimento pelo que você entrega e compartilha.", color: "#218358" },
  { slug: "grupo-whatsapp", icon: Phone, label: "Grupo WhatsApp", pitch: "Avisos e conversa rápida no seu celular.", color: "#218358" },
];
export const vipItem = slug => (slug === VIP_PLAN.slug ? VIP_PLAN : VIP.find(v => v.slug === slug));
