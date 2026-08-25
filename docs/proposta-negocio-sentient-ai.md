# Proposta de negócio — SENTIENT-AI

**Versão:** 0.1  
**Data:** 25 de agosto de 2026  
**Proprietário do produto:** TGL Solutions / jotadev

## 1. Tese recomendada

O SENTIENT-AI deve ser posicionado como um **cockpit operacional de automações e agentes de IA para empresas de serviços que captam, qualificam e atendem leads por canais digitais, especialmente WhatsApp**. A plataforma não deve ser apresentada inicialmente como mais um catálogo de ferramentas de IA nem como um editor genérico de workflows. Seu valor está em transformar automações espalhadas em uma operação visível, monitorável e governável.

A recomendação comercial é começar como **serviço gerenciado de automação com software próprio**. A TGL Solutions instala, configura e acompanha o ambiente do cliente; o cliente compra resultado operacional, não apenas acesso a uma tela. Depois de validar os processos, a solução pode evoluir para SaaS multiempresa com autoatendimento.

> **Posicionamento em uma frase:** “O SENTIENT-AI centraliza seus agentes, integrações e automações em um cockpit operacional que mostra o que está funcionando, o que falhou e onde a equipe deve agir.”

Essa decisão é importante porque o MVP atual já possui a experiência visual do hub, a persistência da árvore e o registro de execuções, mas ainda não possui isolamento multiempresa, faturamento, onboarding self-service ou integração efetiva com webhooks do n8n. Portanto, ele já é adequado para **pilotos assistidos e operação interna**, mas ainda não deve ser vendido como SaaS autônomo para vários clientes.

## 2. De onde o produto parte

O projeto nasceu com duas frentes complementares. A primeira é o marketplace público de produtos digitais, automações, templates, skills e ferramentas da TGL Solutions. A segunda é a camada administrativa de operação, agora representada pela árvore de conexões, que organiza agentes, conectores, status e execuções em uma visão única.[^1]

O documento estratégico existente descreve o marketplace como um motor de geração de leads, com captura de contatos em conteúdos gratuitos, redirecionamento para checkout em conteúdos pagos e possibilidade de upsell para produtos e consultoria.[^2] A árvore de conexões amplia essa visão: ela pode se tornar a infraestrutura que executa e monitora o funil, em vez de apenas apresentar os ativos.

| Camada | Função atual ou planejada | Papel na proposta comercial |
| --- | --- | --- |
| Marketplace | Distribuir produtos digitais, templates, skills e automações | Aquisição, prova de autoridade e geração de leads |
| Hub operacional | Visualizar agentes, integrações, status e execuções | Entrega do serviço e demonstração de valor |
| Backend persistido | Guardar usuários, catálogo, nós e históricos | Fonte de dados, auditoria e continuidade operacional |
| Integrações | Conectar WhatsApp, CRM, IA, banco de dados e n8n | Automatizar processos do cliente |
| TGL Solutions | Configurar, monitorar e evoluir a operação | Receita de implantação, recorrência e consultoria |

## 3. Problema que o SENTIENT-AI resolve

Pequenas e médias empresas normalmente acumulam ferramentas sem possuir uma camada de operação. O marketing capta o lead em um canal, o atendimento responde em outro, o CRM fica desatualizado, os agentes de IA são configurados de forma isolada e ninguém consegue responder rapidamente se uma automação falhou ou se os dados chegaram ao destino correto.

O problema comercial não é simplesmente “falta de uma automação”. É a combinação de **baixa visibilidade, dependência de pessoas específicas, falhas silenciosas, ausência de histórico e dificuldade de medir o retorno da operação automatizada**. O SENTIENT-AI deve vender a redução dessa incerteza.

A proposta de valor deve ser demonstrada por indicadores operacionais, e não por promessas abstratas de inteligência artificial. Os principais indicadores são tempo de resposta ao lead, tempo para identificar uma falha, taxa de execução bem-sucedida, quantidade de tarefas manuais eliminadas, volume de leads processados e horas economizadas pela equipe.

## 4. Para quem fornecer a ferramenta

### 4.1 Cliente principal recomendado

O primeiro segmento deve ser composto por **empresas brasileiras de serviços, com operação comercial baseada em leads, que utilizam WhatsApp e pelo menos duas outras ferramentas digitais, mas não possuem uma equipe dedicada de automação ou operações**. O foco inicial deve privilegiar empresas com processos repetitivos e impacto direto em vendas ou atendimento.

O melhor “beachhead” para os primeiros pilotos é formado por **agências de marketing, consultorias comerciais e empresas B2B de serviços que gerenciam ou recebem leads pelo WhatsApp**. Esses clientes entendem o valor de funil, já convivem com integrações e podem se tornar multiplicadores quando a solução for usada em vários clientes finais.

| Critério do cliente ideal | Sinal de aderência |
| --- | --- |
| Volume operacional | Recebe leads ou solicitações diariamente e perde tempo com triagem, follow-up ou atualização de sistemas |
| Complexidade | Utiliza WhatsApp, formulário, CRM, planilha, e-mail, calendário ou ferramenta de IA em conjunto |
| Dor financeira | Perde oportunidades por demora, esquecimento ou falta de acompanhamento |
| Maturidade | Já tentou usar automações, mas não possui monitoramento e documentação adequados |
| Decisão | Proprietário, diretor comercial, gestor de marketing ou responsável por operações consegue aprovar a compra |
| Capacidade de compra | Aceita pagar implantação para adaptar a operação e mensalidade para mantê-la funcionando |

### 4.2 Comprador, usuário e beneficiário

O comprador não é necessariamente a pessoa que clica na árvore. O proprietário ou diretor compra previsibilidade e redução de perda operacional; o gestor de marketing ou vendas compra velocidade e rastreabilidade; o operador acompanha execuções, corrige falhas e solicita mudanças; e a equipe de atendimento recebe leads mais bem classificados.

| Persona | O que precisa ouvir | O que fará no produto |
| --- | --- | --- |
| Proprietário ou diretor | “Você terá uma visão do que sua operação automatizada está entregando e onde há risco.” | Aprova investimento, acompanha indicadores e revisa resultados |
| Gestor de marketing ou vendas | “Os leads serão processados, classificados e encaminhados sem depender de planilhas manuais.” | Acompanha volume, qualidade e velocidade do funil |
| Operador ou analista | “Você saberá qual automação falhou, quando falhou e qual ação tomar.” | Inspeciona nós, executa novamente e trata incidentes |
| TGL Solutions | “A mesma base permite implantar processos repetíveis para vários clientes.” | Configura, monitora, presta suporte e evolui playbooks |
| Cliente final de uma agência | “Sua operação continua funcionando sem exigir conhecimento técnico de n8n.” | Consome resultados e recebe relatórios, sem administrar a infraestrutura |

### 4.3 Quem não deve ser o foco inicial

O SENTIENT-AI não deve começar tentando atender consumidores finais, usuários que querem apenas conversar com uma IA, grandes empresas com exigências complexas de segurança e governança, ou negócios cujo processo automatizado tenha risco crítico sem supervisão humana. Também não é recomendável vender a tela atual diretamente para qualquer pessoa como se fosse um produto pronto de autoatendimento.

## 5. Oferta e modelo de fornecimento

### 5.1 Fase inicial: serviço gerenciado

A oferta inicial deve ser uma **implantação de automação acompanhada pela TGL Solutions**, com um workspace dedicado por cliente ou uma instância separada. O cliente fornece os processos, acessos e objetivos; a TGL mapeia o fluxo, configura os agentes e conectores, testa os cenários, acompanha o período inicial e apresenta os indicadores.

Nesse formato, o cliente não precisa acessar o `/admin` atual. A área administrativa permanece interna, enquanto o cliente recebe uma experiência de acompanhamento, relatórios e reuniões de revisão. Isso evita expor uma interface ainda orientada ao proprietário do sistema e cria uma separação clara entre infraestrutura da TGL e operação do cliente.

O fluxo de entrega recomendado é: diagnóstico do processo, desenho do fluxo, configuração dos conectores, aprovação do cliente, teste controlado, entrada em produção, acompanhamento assistido e revisão mensal. Cada implantação deve começar com um processo de alto impacto e baixa complexidade, como captura e qualificação de leads, follow-up inicial ou sincronização de CRM.

### 5.2 Fase seguinte: workspace multiempresa

Depois de três a cinco pilotos pagos e de um playbook repetível, o produto pode evoluir para um modelo de workspace por empresa. Cada cliente teria usuários, automações, conectores, execuções, limites e relatórios isolados. A TGL poderia manter um workspace de suporte com acesso delegado, sem misturar dados de clientes.

### 5.3 Fase SaaS

O SaaS self-service deve ser a terceira etapa, não a primeira. Ele só faz sentido quando a configuração de uma automação puder ser feita por um cliente sem intervenção constante da TGL, quando o produto possuir recuperação de senha e gestão de equipe, quando houver cobrança recorrente, controle de limites, logs suficientes e uma integração estável com os provedores externos.

| Modelo | O que é vendido | Quando usar |
| --- | --- | --- |
| Interno | Eficiência e controle da operação da TGL | Agora, para validar os próprios fluxos |
| Serviço gerenciado | Implantação, monitoramento e melhoria contínua | Primeiro produto comercial |
| Workspace dedicado | Ambiente isolado com acompanhamento da TGL | Pilotos com empresas e agências |
| SaaS self-service | Acesso recorrente com configuração pelo próprio cliente | Após validar playbooks e multi-tenancy |
| White-label para agências | Infraestrutura operada pela TGL para a agência revender | Após comprovar estabilidade e suporte |

## 6. Regras de negócio

As regras abaixo devem ser tratadas como contrato do produto. Elas impedem que a interface seja apenas uma visualização bonita sem governança operacional.

### 6.1 Workspace e isolamento

Cada empresa deve possuir um `workspace_id`. Usuários, automações, conectores, execuções, logs e métricas precisam carregar esse identificador. Nenhuma consulta ou mutação pode retornar dados de outro workspace. No MVP atual, como ainda não existe multi-tenancy, a utilização comercial deve ser feita com instância ou banco separado por cliente, até que o isolamento seja implementado.

### 6.2 Papéis de usuário

O sistema deve evoluir do papel único de `admin` para quatro papéis: **Owner**, que controla assinatura e acessos; **Admin/Ops**, que configura automações e conectores; **Operator**, que acompanha e reprocessa execuções; e **Viewer**, que apenas consulta status e relatórios. O cliente final não deve receber permissões de infraestrutura por padrão.

### 6.3 Ciclo de vida da automação

Uma automação deve seguir estados explícitos: `draft`, `pending_approval`, `active`, `paused`, `error` e `archived`. Uma automação nova começa como rascunho; só pode entrar em produção após aprovação; uma falha repetida pode movê-la para erro; uma automação pausada não pode ser disparada por eventos; e uma automação arquivada permanece no histórico, mas não aceita novos disparos.

### 6.4 Execução manual e em lote

O usuário pode executar manualmente uma automação ativa ou o conjunto de automações elegíveis. A execução em lote não deve parar na primeira falha. O backend precisa retornar o resultado de cada item, distinguindo `success`, `error` e `blocked`. A interface deve exibir a quantidade de sucessos, falhas e itens bloqueados, mantendo o histórico individual.

Uma automação em `pending_approval`, `paused`, `error` ou `archived` não deve ser executada automaticamente sem uma ação de governança. O reprocessamento deve usar uma chave de idempotência quando o evento puder chegar mais de uma vez, para evitar duplicidade de mensagens, leads ou registros no CRM.

### 6.5 Conectores

Cada conector deve possuir proprietário, ambiente, data da última verificação, estado de saúde e escopos de permissão. Tokens e segredos nunca devem ser exibidos no frontend ou gravados em texto puro. Quando um conector estiver expirado ou indisponível, as automações dependentes devem ser marcadas como degradadas e o operador deve receber um alerta acionável.

### 6.6 Falhas, tentativas e aprovação humana

O produto deve ter uma política de tentativas configurável, com limite, intervalo e motivo do último erro. Falhas que possam duplicar uma ação externa devem exigir idempotência antes de uma nova tentativa. Ações com impacto comercial, como envio de campanha, alteração de preço, exclusão de dados ou publicação externa, devem admitir aprovação humana no fluxo.

### 6.7 Dados e leads

O SENTIENT-AI deve coletar somente os dados necessários para entregar o fluxo e medir o resultado. Toda captura deve indicar finalidade, origem e status do contato. O produto deve oferecer exclusão e exportação dos dados conforme a política de privacidade definida pela TGL e validada juridicamente. A plataforma não deve ser vendida como ferramenta para armazenar dados sensíveis sem controles adicionais.

### 6.8 Templates e propriedade intelectual

Templates, skills, prompts e playbooks desenvolvidos pela TGL devem possuir autor, versão, licença de uso e escopo de distribuição. O cliente pode receber direito de uso do fluxo configurado, mas isso não implica transferência automática do template-base, do código interno ou da propriedade intelectual da TGL.

### 6.9 Suporte e mudança de escopo

A mensalidade deve incluir monitoramento, correções dentro do fluxo contratado e uma quantidade definida de revisões. Novas integrações, novas automações e mudanças que alterem o processo original devem ser tratadas como evolução comercial separada. Toda alteração relevante deve possuir registro, responsável, data e possibilidade de reversão.

## 7. Pacotes comerciais para testar

Os valores abaixo são **faixas iniciais de hipótese**, não uma tabela definitiva. O objetivo é testar disposição a pagar e calibrar o esforço real de implantação, suporte e consumo de provedores.

| Pacote | Entrega | Faixa inicial sugerida |
| --- | --- | --- |
| Piloto | Diagnóstico, uma automação de alto impacto, até dois conectores, acompanhamento inicial e relatório | Implantação de R$ 1.500 a R$ 3.000 + recorrência de R$ 490 a R$ 990 |
| Operação | Até três automações, painel, monitoramento, revisão mensal e suporte operacional | Implantação de R$ 3.000 a R$ 7.000 + recorrência de R$ 1.200 a R$ 2.500 |
| Growth | Fluxos multicanal, agentes de IA, mais conectores, indicadores e prioridade de suporte | Proposta customizada a partir de R$ 5.000 de implantação |
| Agência parceira | Playbooks replicáveis, workspace por cliente e suporte para a agência | Licença ou recorrência negociada por workspace ativo |

A cobrança deve separar **implantação** de **operação recorrente**. A implantação remunera diagnóstico, desenho, configuração, testes e treinamento. A recorrência remunera disponibilidade, monitoramento, correções, relatórios e evolução acordada. Custos de provedores externos, mensagens, modelos de IA, hospedagem e serviços de terceiros devem ser explicitamente classificados como incluídos, repassados ou pagos diretamente pelo cliente.

## 8. O que o MVP atual permite vender

O estado atual permite demonstrar a visão operacional, registrar nós e execuções, selecionar agentes, visualizar métricas, executar agentes individuais e executar um lote com tratamento de itens bloqueados. Isso é suficiente para uma demonstração técnica e para um piloto interno ou assistido.

Ele ainda não deve ser anunciado como uma plataforma SaaS completa. Antes de abrir acesso para múltiplas empresas, a TGL deve implementar isolamento por workspace, integração real com n8n, armazenamento seguro de credenciais, convite de usuários, recuperação de conta, auditoria, limites de uso, experiência de cliente e observabilidade de ponta a ponta.

| Capacidade | Estado | Decisão comercial |
| --- | --- | --- |
| Árvore visual e painel operacional | Disponível no MVP | Usar em demonstrações e operação assistida |
| Persistência em MongoDB | Disponível no MVP | Usar em piloto controlado |
| Execução local persistida | Disponível no MVP | Vender como prova de conceito, não como automação externa completa |
| Integração efetiva com n8n | Preparada no contrato, ainda não concluída | Implementar antes de prometer conexão em produção |
| Multi-tenancy | Não disponível | Não compartilhar a mesma instância entre clientes |
| Billing e planos | Não disponível | Cobrar implantação e recorrência manualmente no início |
| Editor de nova automação | Placeholder | Fazer implantação assistida pela TGL |
| Auditoria e permissões granulares | Parcial | Restringir acesso ao time interno durante os pilotos |

## 9. Roadmap recomendado

### Fase 0 — Validação interna

Usar o hub para operar os próprios fluxos da TGL Solutions: captura de leads do marketplace, distribuição de conteúdos, follow-up, sincronização de CRM e relatórios. O objetivo é gerar um caso real com números antes de vender a solução.

### Fase 1 — Piloto assistido

Selecionar três empresas com perfil semelhante, mapear um processo por empresa e cobrar implantação. O foco deve ser provar redução de trabalho manual, aumento de velocidade ou diminuição de falhas. Não adicionar muitos conectores antes de saber qual playbook se repete.

### Fase 2 — Produto operacional vendável

Adicionar integração efetiva com n8n, health check dos conectores, logs de execução mais detalhados, alertas, aprovação humana, papéis de usuário, workspace isolado e uma página de onboarding. Nessa etapa, o produto pode ser vendido como serviço gerenciado com workspace dedicado.

### Fase 3 — Plataforma multiempresa

Implementar multi-tenancy real, convite de equipes, limites por plano, relatórios por cliente, cobrança recorrente e suporte a templates versionados. O admin interno da TGL deve conseguir enxergar saúde agregada sem misturar dados de clientes.

### Fase 4 — Ecossistema

Conectar o marketplace à operação: vender templates e playbooks, permitir que clientes contratem implantação, criar programa de parceiros para agências e transformar os fluxos mais repetidos em produtos verticais.

## 10. Métricas para provar valor

A validação deve começar com uma linha de base antes da automação. A TGL precisa registrar como o processo funcionava, quanto tempo consumia, quantos leads eram perdidos e quantas falhas eram descobertas tardiamente. Depois da implantação, os indicadores devem ser comparados em uma revisão objetiva.

| Métrica | Pergunta de negócio |
| --- | --- |
| Tempo médio de resposta | O cliente respondeu o lead mais rápido? |
| Taxa de execução bem-sucedida | O fluxo está funcionando sem intervenção recorrente? |
| Tempo para detectar e corrigir falha | O operador consegue agir antes que o problema vire perda? |
| Horas manuais economizadas | A equipe recuperou capacidade produtiva? |
| Leads processados e encaminhados | O funil está sendo atendido de forma mais consistente? |
| Reprocessamentos e duplicidades | O fluxo está seguro ou gerando retrabalho? |
| Retenção após 90 dias | O cliente percebe valor recorrente? |
| Margem por workspace | A operação é sustentável para a TGL? |

## 11. Mensagem comercial inicial

A conversa comercial não deve começar com a árvore, com o n8n ou com o nome de um modelo de IA. Deve começar pelo processo que está falhando.

> “Hoje seus leads, mensagens e tarefas passam por várias ferramentas, mas você consegue saber rapidamente o que falhou e quem precisa agir? O SENTIENT-AI organiza essa operação em um cockpit único, conecta os sistemas que você já usa e mostra, em tempo real, quais automações estão ativas, quais precisam de aprovação e quais exigem intervenção.”

A chamada para ação deve ser um **diagnóstico de automação**, não um cadastro genérico. O diagnóstico precisa produzir um mapa simples do processo atual, uma estimativa de ganho operacional, um primeiro fluxo prioritário e uma proposta de implantação com escopo fechado.

## 12. Decisão recomendada agora

A decisão mais segura é manter o SENTIENT-AI como **produto interno e serviço gerenciado da TGL Solutions**, selecionar um único segmento inicial — agências, consultorias e negócios B2B de serviços com operação de leads no WhatsApp — e executar três pilotos pagos antes de investir em SaaS multiempresa.

O próximo entregável não deve ser mais uma tela. Deve ser um **playbook de implantação** com entrevista de diagnóstico, mapa de processo, checklist de acessos, modelo de aprovação, indicador de sucesso e roteiro de revisão mensal. O produto passa a ser vendável quando a TGL conseguir repetir a implantação, demonstrar resultado e proteger os dados de cada cliente.

## Referências

[^1]: [README do projeto SENTIENT-AI](../README.md).
[^2]: [Documento estratégico do Hub Jotadev/TGL Solutions](../hub_jotadev_estrategia.pdf).
