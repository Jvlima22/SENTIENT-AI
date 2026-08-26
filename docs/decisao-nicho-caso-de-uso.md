# Decisão inicial — nicho e caso de uso do SENTIENT-AI

**Decisão recomendada:** começar com **agências de marketing e consultorias comerciais que gerenciam leads pelo WhatsApp**, oferecendo um piloto de **captura, qualificação e encaminhamento de leads**.

## 1. Critérios usados

A decisão foi feita a partir do estado atual do produto e do modelo de serviço gerenciado definido na proposta. O melhor primeiro segmento não é necessariamente o maior mercado; é o grupo que combina acesso comercial, dor clara, capacidade de implantação e resultado fácil de medir.

| Critério | Pergunta de decisão | Peso recomendado |
| --- | --- | ---: |
| Acesso comercial | Conseguimos falar com o decisor nas próximas semanas? | 25% |
| Dor e urgência | O problema provoca perda, atraso ou retrabalho visível? | 25% |
| Entrega com o MVP | Conseguimos implantar sem construir um produto novo? | 20% |
| Resultado mensurável | Existe um antes/depois simples de acompanhar? | 20% |
| Repetibilidade | O mesmo playbook pode servir para outros clientes? | 10% |

Os pesos favorecem venda e entrega, não tamanho de mercado. Nesta fase, três pilotos pagos e bem documentados valem mais do que uma audiência ampla sem conversão.

## 2. Comparação de nichos

As notas abaixo são qualitativas, em uma escala de 1 a 5, para orientar a decisão. Elas não representam pesquisa estatística; devem ser atualizadas depois das entrevistas comerciais.

| Nicho candidato | Acesso | Dor | Entrega | Medição | Repetição | Total ponderado | Decisão |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Agências de marketing | 5 | 4 | 5 | 5 | 5 | **4,75** | Prioridade 1 |
| Consultorias comerciais | 4 | 5 | 4 | 5 | 4 | **4,45** | Prioridade 1B |
| Empresas B2B de serviços | 3 | 4 | 4 | 5 | 4 | **3,90** | Segundo ciclo |
| Clínicas e negócios locais | 3 | 4 | 3 | 4 | 3 | **3,45** | Depois do playbook |
| E-commerce | 3 | 3 | 3 | 4 | 4 | **3,25** | Não começar aqui |
| Grandes empresas | 1 | 5 | 2 | 3 | 3 | **2,80** | Evitar no início |

### Por que agências vencem

Agências já vendem marketing, geração de demanda ou gestão de canais. Elas entendem a linguagem de funil, possuem vários clientes com dores semelhantes e podem se tornar um canal de distribuição para a TGL. A implantação pode começar na própria agência e, depois, ser repetida em um cliente final.

O risco é a agência pedir muitos clientes, integrações e customizações antes de existir um modelo de isolamento. Por isso, o primeiro contrato deve limitar claramente um workspace, um processo e poucos conectores.

### Por que consultorias comerciais ficam como alternativa forte

Consultorias comerciais sentem diretamente o problema de velocidade de resposta, follow-up e registro de oportunidades. Podem ter uma dor mais urgente que a agência, mas tendem a exigir maior adaptação ao processo de cada operação. São uma boa alternativa caso a TGL já tenha relacionamento com algum decisor desse segmento.

### Por que não começar por grandes empresas ou e-commerce

Grandes empresas costumam exigir segurança, procurement, integrações, SLA e governança que o MVP ainda não possui. E-commerce tem grande volume, mas exige maior profundidade de integrações, pedidos, estoque, pagamentos e pós-venda. Esses segmentos podem ser avaliados depois que o playbook e a camada técnica estiverem mais maduros.

## 3. Comparação de casos de uso

| Caso de uso | Valor percebido | Complexidade | Risco operacional | Facilidade de medir | Decisão |
| --- | ---: | ---: | ---: | ---: | --- |
| Captura, qualificação e encaminhamento de leads | 5 | 3 | 3 | 5 | **Começar aqui** |
| Follow-up automático de leads | 5 | 4 | 4 | 4 | Segunda etapa |
| Sincronização CRM–planilha–e-mail | 4 | 3 | 2 | 4 | Pode entrar no piloto |
| Atendimento autônomo por IA | 5 | 5 | 5 | 2 | Não começar aqui |
| Campanhas em massa | 4 | 4 | 5 | 3 | Evitar no MVP |
| Relatórios executivos automáticos | 3 | 2 | 1 | 4 | Complementar |

### Definição do caso de uso inicial

O caso de uso escolhido deve ser descrito assim:

> “Quando um lead chegar por formulário, anúncio, WhatsApp ou outro canal acordado, o sistema registra o contato, aplica uma qualificação simples, encaminha a oportunidade para o responsável correto, registra o evento no destino e sinaliza falhas ou casos que exigem aprovação humana.”

O fluxo não deve prometer que a IA substituirá o vendedor. No primeiro piloto, a IA pode classificar, resumir e sugerir a próxima ação; a decisão comercial e a mensagem sensível permanecem sob supervisão humana.

## 4. Escopo fechado do primeiro piloto

Para evitar que o piloto vire um projeto sem fim, o contrato inicial deve conter:

| Incluído | Limite sugerido |
| --- | --- |
| Um processo comercial | Captura, qualificação e encaminhamento |
| Uma origem de leads | Formulário, WhatsApp ou canal escolhido |
| Um destino principal | CRM, planilha ou caixa de atendimento |
| Até dois conectores | Além do próprio ambiente de automação |
| Uma regra de qualificação | Campos e critérios definidos na descoberta |
| Um fluxo de aprovação humana | Para casos ambíguos ou de maior risco |
| Um painel operacional | Status, execuções, falhas e histórico |
| Um período de acompanhamento | 14 a 30 dias após entrada em produção |
| Uma revisão de resultado | Comparação com a linha de base |

Ficam fora do primeiro piloto: atendimento autônomo completo, campanhas em massa, múltiplas unidades, integrações ilimitadas, CRM customizado, cobrança automática, white-label e acesso irrestrito ao `/admin`.

## 5. Perfil exato do primeiro cliente

O primeiro cliente ideal deve cumprir pelo menos cinco dos seguintes sinais: recebe leads diariamente; usa WhatsApp como canal de atendimento; registra oportunidades em mais de uma ferramenta; já perdeu ou atrasou follow-ups; possui uma pessoa responsável por operações ou vendas; consegue fornecer acessos e regras de negócio; aceita participar de uma implantação assistida; e consegue medir tempo de resposta ou volume de leads encaminhados.

O decisor recomendado é o proprietário, diretor comercial ou gestor de operações. O operador do piloto deve ser uma pessoa que conhece o processo diário e possa validar os cenários. Sem um responsável do cliente, a implantação deve ser adiada.

## 6. Perguntas para validar a decisão

Nas entrevistas, devemos testar a hipótese sem apresentar a solução cedo demais:

1. Quantos leads chegam por semana e por quais canais?
2. Onde cada lead é registrado hoje?
3. Quanto tempo passa entre a chegada e a primeira resposta?
4. Em que momento um lead deixa de ser acompanhado?
5. Quantas pessoas participam da triagem e do encaminhamento?
6. O que acontece quando uma integração ou planilha falha?
7. Que ferramenta já foi tentada e por que não resolveu?
8. Qual indicador faria o cliente dizer que o piloto funcionou?
9. Quem pode fornecer os acessos e aprovar as mensagens?
10. O cliente pagaria por uma implantação assistida e uma mensalidade de monitoramento?

A hipótese deve ser considerada validada somente quando o entrevistado descreve um problema atual, reconhece uma consequência, aceita medir uma linha de base e demonstra disposição para avaliar um piloto pago.

## 7. Plano de validação em 14 dias

| Período | Atividade | Meta |
| --- | --- | --- |
| Dias 1–2 | Selecionar empresas e contatos | 20 contatos qualificados |
| Dias 3–6 | Fazer entrevistas de descoberta | 5 conversas concluídas |
| Dias 7–8 | Escolher os melhores candidatos | 2–3 empresas com dor e decisor |
| Dias 9–10 | Apresentar diagnóstico e escopo | 2 propostas enviadas |
| Dias 11–14 | Negociar e fechar o piloto | 1 piloto pago ou aprendizado documentado |

A primeira abordagem deve vender uma conversa de diagnóstico. A mensagem pode ser: “Estamos ajudando empresas que recebem leads pelo WhatsApp a reduzir o tempo de triagem e evitar que oportunidades fiquem sem encaminhamento. Posso entender como esse processo funciona hoje e verificar se um piloto de duas semanas faria sentido?”

## 8. Critério de mudança de decisão

A recomendação deve ser alterada se a TGL não conseguir entrevistar decisores do nicho, se a dor não for reconhecida, se o fluxo depender de integrações que o MVP não suporta, se o resultado não puder ser medido ou se os clientes não aceitarem pagar implantação. Nesse cenário, o próximo nicho deve ser escolhido por evidência de acesso e urgência, não por preferência pessoal.

Se a TGL já possuir uma rede comercial mais forte em consultorias ou empresas B2B de serviços, essa vantagem pode superar a pontuação da matriz. O melhor nicho não é o escolhido em teoria; é aquele em que existe acesso real a compradores e um primeiro caso disposto a testar.

## Decisão final

Começar com **agências de marketing**, mantendo **consultorias comerciais** como alternativa imediata, e vender um piloto de **captura, qualificação e encaminhamento de leads**. O piloto deve ter escopo fechado, um canal de entrada, um destino principal, até dois conectores, supervisão humana e métricas antes/depois.

A próxima ação prática é montar a lista de 20 contatos e realizar cinco entrevistas. Não devemos iniciar uma nova grande frente técnica antes de obter esse feedback.
