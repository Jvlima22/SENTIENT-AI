# Plano de execução 30–60–90 dias — SENTIENT-AI

**Data de referência:** 26 de agosto de 2026  
**Objetivo:** transformar o MVP em uma oferta validada de serviço gerenciado de automação para os primeiros clientes da TGL Solutions.

## 1. Decisão que orienta os próximos passos

Durante os próximos 90 dias, o SENTIENT-AI deve ser tratado como **software próprio da TGL Solutions usado para entregar um serviço gerenciado de automação**. Não devemos tentar vender imediatamente um SaaS aberto e multiempresa.

A razão é objetiva: o MVP já permite demonstrar a árvore operacional, registrar execuções e acompanhar agentes, mas ainda não possui isolamento por cliente, cobrança recorrente integrada, onboarding self-service, gestão granular de equipes, armazenamento completo de segredos ou integração efetiva com webhooks do n8n. O produto pode ser demonstrado e usado em pilotos assistidos; a venda precisa deixar esse escopo claro.

> **Resultado esperado ao final dos 90 dias:** três pilotos pagos concluídos ou em operação, um playbook de implantação repetível, um caso de sucesso mensurável e evidência suficiente para decidir se vale investir em multi-tenancy e SaaS.

## 2. Ordem de prioridade

A ordem correta é **validar uma dor, vender um piloto, entregar resultado, repetir o processo e só então ampliar a plataforma**. Construir novas telas antes de testar a oferta aumentaria o risco de desenvolver funcionalidades que o cliente não considera valiosas.

| Prioridade | Decisão ou entrega | Por que vem agora |
| --- | --- | --- |
| 1 | Escolher um nicho e um único processo inicial | Evita uma proposta genérica e facilita medir valor |
| 2 | Operar o próprio funil da TGL | Gera demonstração real e linha de base |
| 3 | Criar diagnóstico e roteiro comercial | Converte conversa em descoberta de problema |
| 4 | Fechar três pilotos pagos | Testa disposição a pagar e esforço de implantação |
| 5 | Implementar somente os requisitos técnicos dos pilotos | Evita construir SaaS antes da validação |
| 6 | Medir resultado e margem | Decide se o modelo é repetível e sustentável |
| 7 | Investir em multi-tenancy e planos | Só após evidência de repetição e retenção |

## 3. Primeiro foco recomendado

O foco inicial deve ser **agências de marketing, consultorias comerciais e empresas B2B de serviços que recebem leads pelo WhatsApp e usam CRM, planilhas, formulários ou e-mail em conjunto**. Para reduzir ainda mais o escopo, o primeiro caso de uso deve ser:

> **Captura, qualificação e encaminhamento de leads**, com registro no CRM ou planilha, alerta para o responsável e acompanhamento das falhas.

Esse processo é recomendado porque é fácil de explicar para o comprador, tem impacto próximo da receita, pode ser medido e não exige começar com uma automação crítica. Outros casos, como atendimento autônomo completo, campanhas em massa ou decisões sem supervisão humana, devem ficar para depois.

## 4. Plano dos primeiros 7 dias

### Dia 1 — Fechar a tese e o recorte

Escolher formalmente um nicho inicial, um processo e o comprador. A decisão sugerida é “agências e consultorias que gerenciam leads de clientes pelo WhatsApp”, com o proprietário ou diretor comercial como comprador e o gestor de operações como usuário.

O entregável é uma frase de posicionamento, uma descrição do problema em cinco linhas e uma lista de sinais de qualificação. Não devemos usar “automação para qualquer empresa” como mensagem comercial.

### Dia 2 — Criar a demonstração

Preparar um roteiro de demonstração de 10 minutos usando o hub atual. A demonstração deve mostrar uma entrada de lead, o fluxo de qualificação, o registro no destino, um caso de falha e o reprocessamento ou encaminhamento para uma pessoa.

A árvore deve ser apresentada como **visibilidade e controle da operação**, não como o produto isolado. O comprador precisa entender qual problema é reduzido e qual indicador será acompanhado.

### Dia 3 — Operar internamente

Escolher um fluxo real da TGL Solutions, como captura de leads do marketplace, distribuição de um material gratuito ou follow-up inicial. Registrar uma linha de base antes de ativar a automação: volume, tempo manual, tempo de resposta, erros e quantidade de oportunidades perdidas.

O objetivo é obter um primeiro antes/depois que possa ser mostrado sem depender de dados fictícios.

### Dia 4 — Preparar a oferta-piloto

Criar uma página ou documento de uma página com: problema, escopo do piloto, o que o cliente precisa fornecer, prazo estimado, entregáveis, limites, suporte, indicadores e preço. O piloto deve ter um processo, até dois conectores e um período de acompanhamento definido.

A faixa de teste sugerida é implantação de **R$ 1.500 a R$ 3.000**, mais recorrência de **R$ 490 a R$ 990**, deixando claro que os valores são hipóteses comerciais a serem calibradas pelo esforço real.

### Dia 5 — Montar a lista de prospecção

Criar uma lista de pelo menos 20 empresas com o perfil escolhido, priorizando contatos com indicação, relacionamento existente ou acesso direto ao decisor. A lista deve registrar segmento, contato, canal, dor percebida, número estimado de operadores e ferramentas usadas.

A meta inicial não é vender para todos. É realizar conversas suficientes para descobrir se a dor existe, como é tratada hoje e qual consequência financeira ou operacional ela produz.

### Dias 6 e 7 — Fazer as primeiras entrevistas

Realizar pelo menos cinco conversas de descoberta. Não começar apresentando a árvore. Perguntar como o lead chega, onde é registrado, quem responde, quando uma falha é percebida, quanto retrabalho existe e o que já foi tentado.

Ao final de cada conversa, classificar o contato como: problema urgente, problema reconhecido sem prioridade, curiosidade técnica ou sem aderência. Só os dois primeiros grupos devem receber uma proposta de piloto.

## 5. Plano de 30 dias — validar e fechar

Até o 30º dia, a TGL deve ter um recorte de mercado confirmado, um fluxo interno operando, cinco a dez entrevistas, pelo menos três propostas enviadas e idealmente o primeiro piloto pago iniciado.

| Frente | Entrega até o dia 30 | Critério de conclusão |
| --- | --- | --- |
| Posicionamento | Mensagem e nicho definidos | Qualquer pessoa da TGL explica o produto da mesma forma |
| Descoberta | Cinco a dez entrevistas | As conversas revelam uma dor recorrente e mensurável |
| Comercial | One-pager, roteiro e proposta | O cliente entende escopo, preço, prazo e responsabilidades |
| Operação própria | Um fluxo real monitorado | Existe linha de base e primeiro resultado comparável |
| Piloto | Primeiro contrato ou carta de intenção | O escopo é fechado e há um responsável do cliente |
| Técnico | Ambiente segregado para o piloto | Dados do cliente não se misturam com dados internos |
| Governança | Termos, privacidade e limites documentados | O cliente sabe o que está e não está incluído |

## 6. Plano de 60 dias — entregar e repetir

Entre os dias 31 e 60, a prioridade passa a ser entregar o primeiro piloto com qualidade e iniciar mais dois. Toda demanda que surgir deve ser classificada em “necessária para o resultado do piloto”, “necessária para segurança” ou “desejável para o futuro”. Só as duas primeiras categorias entram no ciclo imediato.

### Requisitos técnicos mínimos

A integração com o provedor de automação precisa ser real para qualquer promessa de produção. O mínimo é um fluxo de teste, health check do conector, logs com correlação, política de retry, idempotência para evitar duplicidades e alerta quando houver falha. O n8n não deve ser descrito como conectado apenas porque existe um campo de URL na interface.

O acesso dos clientes deve continuar separado do `/admin` interno até que haja workspace, papéis e isolamento implementados. Para os pilotos, a alternativa mais segura é usar uma instância ou banco separado por cliente e conceder acesso somente ao relatório ou à experiência de acompanhamento preparada pela TGL.

### Requisitos de entrega

Cada piloto deve ter um documento de início, um mapa do processo atual, checklist de acessos, critérios de aceite, plano de teste, registro de mudanças, rotina de suporte e relatório de resultado. A implantação só termina quando o cliente consegue explicar o que foi automatizado, o que exige aprovação humana e como uma falha será tratada.

### Metas de validação até o dia 60

A meta é ter três pilotos pagos contratados ou, no mínimo, dois em operação e um terceiro em negociação avançada. Pelo menos dois clientes devem conseguir apontar um ganho objetivo, como redução de trabalho manual, redução do tempo de resposta, aumento de leads processados ou diminuição do tempo para identificar falhas.

## 7. Plano de 90 dias — decidir o próximo investimento

Entre os dias 61 e 90, comparar os pilotos em uma mesma matriz. O objetivo não é apenas saber se a tecnologia funciona, mas se a entrega pode ser repetida com margem e se o cliente percebe valor suficiente para continuar pagando.

| Pergunta de decisão | Evidência necessária |
| --- | --- |
| A dor é recorrente? | Pelo menos dois clientes do mesmo perfil relatam o mesmo problema |
| O cliente paga? | Pelo menos três pilotos pagos ou contratos equivalentes |
| O resultado é mensurável? | Indicador antes/depois em pelo menos dois casos |
| A implantação é repetível? | Playbook utilizado sem recomeçar o projeto do zero |
| O suporte é sustentável? | Registro de horas, incidentes e mudanças por cliente |
| O modelo tem margem? | Receita recorrente e esforço de suporte conhecidos |
| Há demanda por escala? | Clientes solicitam equipe, workspace, mais automações ou parceiros |

### Decisão A — continuar como serviço gerenciado

Escolher esta opção se os clientes valorizarem o resultado, mas cada operação ainda exigir configuração intensa. Nesse caso, a prioridade é melhorar playbooks, templates verticais e capacidade de suporte, mantendo a plataforma como infraestrutura própria da TGL.

### Decisão B — construir workspace multiempresa

Escolher esta opção se o mesmo playbook se repetir em pelo menos três clientes, houver demanda por acesso separado e o custo de operação manual começar a limitar a margem. As primeiras features são `workspace_id`, isolamento de consultas, convite de usuários, papéis, auditoria, limites e relatórios por cliente.

### Decisão C — interromper ou reposicionar

Escolher esta opção se os contatos não reconhecerem a dor, se não houver disposição a pagar ou se os resultados não forem mensuráveis. O aprendizado deve ser usado para reposicionar o produto para outro segmento ou para vender implantação de automações sem tentar transformar o hub em produto independente.

## 8. Playbook de implantação que devemos criar agora

O próximo ativo mais importante não é uma nova tela; é o **playbook de implantação**. Ele deve possuir os seguintes documentos:

| Documento | Conteúdo |
| --- | --- |
| Roteiro de diagnóstico | Perguntas, sinais de dor, processo atual e ferramentas existentes |
| Mapa de processo | Entrada, decisões, ações automáticas, ações humanas e destinos |
| Checklist de acessos | Contas, permissões, tokens, ambientes e responsáveis |
| Matriz de risco | Duplicidade, privacidade, indisponibilidade, aprovação e rollback |
| Critérios de aceite | Cenários que precisam passar antes da publicação |
| Relatório mensal | Execuções, falhas, tempo economizado, leads processados e próximos ajustes |
| Registro de mudança | O que mudou, por que mudou, quem aprovou e como reverter |
| Encerramento ou expansão | Resultado, renovação, novo fluxo e transferência de conhecimento |

## 9. O que não devemos fazer agora

Não devemos construir cobrança automática, marketplace de templates, editor visual completo, dezenas de conectores, campanhas genéricas, white-label ou multi-tenancy antes de provar que três clientes semelhantes pagam pelo mesmo resultado. Também não devemos prometer atendimento autônomo por IA, disponibilidade contínua ou redução de custos sem definir limites, supervisão humana e métricas verificáveis.

Não devemos fornecer a clientes o acesso administrativo atual apenas para parecer que existe um produto SaaS. O `/admin` é uma ferramenta interna do proprietário e deve continuar protegido até que o produto tenha segregação de dados, papéis e experiência de cliente adequadas.

## 10. Próxima ação concreta

A próxima reunião de trabalho deve terminar com quatro decisões: **qual nicho será priorizado, qual fluxo será usado no piloto, quem serão os 20 primeiros contatos e qual indicador definirá sucesso**. Com essas decisões tomadas, a TGL pode iniciar as cinco entrevistas de descoberta e transformar a proposta em uma oferta real.

A recomendação padrão, caso ainda não exista outro relacionamento comercial prioritário, é começar por **agências de marketing e consultorias comerciais que operam leads pelo WhatsApp**, usando como piloto a captura, qualificação e encaminhamento de leads.

## Referência

Este plano foi derivado da [Proposta de negócio do SENTIENT-AI](./proposta-negocio-sentient-ai.md), que define o posicionamento como cockpit operacional, o modelo inicial de serviço gerenciado, as regras de negócio e o roadmap até multi-tenancy.
