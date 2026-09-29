import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginPrompt, State, useCommunity } from "./shared";
import { ChannelBar } from "./Channel";

const ACTIONS = {
  "apresente-se": ["/comunidade/apresente-se", "Escrever apresentação"],
  material: ["/comunidade/biblioteca", "Abrir recursos gratuitos"],
  conversa: ["/comunidade/chat", "Ir para o chat"],
  reacao: ["/comunidade/chat", "Ver publicações"],
};
const PREVIEW = ["Apresente-se para a comunidade", "Baixe ou copie seu primeiro material", "Participe de uma conversa no chat", "Reaja a uma publicação"];

export default function Onboarding() {
  const { user } = useAuth();
  const { overview, refreshOverview } = useCommunity();
  useEffect(() => { if (user) refreshOverview(); }, [user, refreshOverview]);
  const steps = user ? overview?.onboarding : PREVIEW.map((label, i) => ({ key: "p" + i, label, done: false }));
  const done = steps?.filter(s => s.done).length ?? 0;
  return <>
    <ChannelBar path="onboarding" />
    <div className="w-feed-col">
      <div className="w-channel-intro"><h1>Onboarding</h1><p>Quatro passos para sair do vídeo e colocar sua primeira automação para rodar.</p></div>
      <State loading={!steps}>{steps && <>
        {user && <p className="w-count">{done === steps.length ? "Tudo feito. Agora é construir e compartilhar o resultado." : `${done} de ${steps.length} concluídos`}</p>}
        <ol className="w-checklist">{steps.map((s, i) => <li key={s.key} className={s.done ? "done" : ""}>
          {s.done ? <CheckCircle2 size={22} aria-label="Concluído" /> : <Circle size={22} aria-label="Pendente" />}
          <div><small>Passo {i + 1}</small><strong>{s.label}</strong></div>
          {user && !s.done && <Link to={ACTIONS[s.key][0]} className="w-link">{ACTIONS[s.key][1]} <ChevronRight size={15} /></Link>}
        </li>)}</ol>
        {!user && <LoginPrompt title="Comece seu onboarding">Crie sua conta grátis e acompanhe seu progresso aqui.</LoginPrompt>}
      </>}</State>
      <section className="w-guidelines" id="convivencia"><h2>Como participamos</h2><p>Respeite as pessoas e compartilhe o contexto. Use dados fictícios em exemplos e nunca publique senhas, tokens ou informações de clientes. Evite divulgação repetitiva e ofertas fora de contexto.</p><p>A equipe pode remover conteúdo inadequado e encerrar conversas. Dúvidas são bem-vindas: explique o que tentou para facilitar a ajuda.</p></section>
    </div>
  </>;
}
