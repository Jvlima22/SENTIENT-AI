# Speed to Lead — especificação do Kit V1

## Objetivo do produto

Capturar um lead de uma landing page ou site, registrar o contato no CRM escolhido, classificar a prioridade com IA, iniciar o primeiro contato por e-mail e WhatsApp quando permitido, avisar o responsável comercial e impedir que oportunidades fiquem sem atendimento.

Promessa comercial:

> Todo lead do seu site chega ao CRM, recebe o primeiro contato e alcança o vendedor com contexto e prioridade em minutos.

## Escopo da versão 1

### Entrada

- Landing pages e sites via webhook n8n.
- Formulários suportados desde que consigam enviar `POST` para uma URL: site próprio, WordPress, Webflow, Framer, Typeform, RD Station ou equivalente.

### Destino selecionável pelo cliente

- HubSpot.
- Pipedrive.
- Kommo.
- Google Sheets como CRM simples.

### Canais de contato

- E-mail: primeiro contato imediato.
- WhatsApp Cloud API: módulo oficial opcional; primeiro contato apenas se houver consentimento e se as regras da Meta permitirem o envio.
- Evolution API: alternativa experimental e auto-hospedada para testes ou clientes que aceitarem o risco operacional; não é o conector oficial recomendado.
- Alerta interno: e-mail, Slack ou WhatsApp do vendedor, conforme a configuração escolhida.

### Não incluído nesta primeira versão

- Captação direta pelo Meta Lead Ads.
- Atendimento autônomo ou fechamento de vendas por IA.
- Disparo de WhatsApp sem consentimento ou fora das regras da API/provedor.
- Configuração de credenciais pelo time Sentient.

## Dados obrigatórios enviados pelo formulário

| Campo | Nome técnico | Regra |
| --- | --- | --- |
| Nome | `name` | obrigatório |
| E-mail | `email` | obrigatório |
| Telefone/WhatsApp | `phone` | recomendado |
| Empresa | `company` | opcional |
| Interesse | `interest` | recomendado |
| Mensagem | `message` | opcional |
| Origem | `source` | obrigatório; valor padrão `site` |
| Campanha | `utm_campaign` | opcional |
| Consentimento | `contact_consent` | obrigatório para WhatsApp |
| URL de origem | `page_url` | recomendado |

## Fluxo principal no n8n

```text
1. Webhook — recebe o formulário
2. Normalizar dados — limpa telefone, e-mail e valores vazios
3. Validar campos — encerra com resposta clara se nome/e-mail forem inválidos
4. Verificar duplicidade — procura o contato no CRM selecionado
5. Criar ou atualizar contato — CRM escolhido pelo comprador
6. Classificar com IA — interesse, urgência, resumo e sugestão de próximo passo
7. Atualizar CRM — grava classificação, resumo e origem
8. Enviar e-mail — confirmação/primeiro contato
9. Verificar consentimento de WhatsApp
10. Enviar WhatsApp — somente no caminho permitido
11. Notificar responsável — alerta com resumo e link do CRM
12. Criar tarefa de follow-up — prazo configurável, padrão de 15 minutos
13. Esperar o SLA — verifica se houve atendimento
14. Realertar ou redistribuir — caso o lead continue sem atendimento
15. Responder ao formulário — confirma recebimento sem expor dados internos
```

## Regras de negócio

### Canais da versão 1

- O e-mail é obrigatório no fluxo principal: garante retorno ao lead mesmo sem WhatsApp configurado.
- O módulo WhatsApp Cloud API é ativado somente quando o comprador informar credenciais válidas, número aprovado e consentimento do lead.
- O workflow não deve falhar se WhatsApp estiver desativado, indisponível ou recusar uma mensagem.
- Evolution API fica em uma pasta separada, identificada como `experimental`, e não integra a promessa principal da oferta.

### Deduplicação

1. Procurar primeiro por e-mail.
2. Na ausência de e-mail, procurar por telefone normalizado.
3. Se existir, atualizar contato e registrar uma nova atividade; nunca criar duplicata.
4. Preservar a origem original e registrar a origem mais recente em um histórico/campo separado.

### Priorização por IA

A IA recebe apenas os dados enviados pelo lead e devolve JSON estruturado:

```json
{
  "priority": "alta | média | baixa",
  "summary": "resumo curto para o vendedor",
  "interest": "produto ou necessidade identificada",
  "next_action": "ação comercial sugerida"
}
```

Se a IA estiver indisponível, o workflow continua com prioridade `média` e resumo padrão. Nenhum lead deve deixar de entrar no CRM por falha da IA.

### WhatsApp e consentimento

- Sem `contact_consent=true`, não enviar mensagem pelo WhatsApp.
- Usar somente integração oficial/provedor autorizado pelo cliente.
- O texto inicial deve ser configurável e não fazer alegações sobre o lead que não foram fornecidas.
- Fora da janela permitida pelo provedor, usar template aprovado ou não enviar.

### SLA comercial

- Prazo padrão: 15 minutos úteis.
- Se o responsável não registrar atendimento, enviar lembrete.
- Após um segundo prazo configurável, reenviar para gerente/fila de backup.
- Todo alerta deve ter link direto para o registro do CRM ou planilha.

## Estrutura de entrega ao comprador

```text
speed-to-lead-kit/
├── 00-comece-aqui/
│   ├── checklist-de-ativacao.pdf
│   └── pre-requisitos.md
├── 01-nucleo-captura-e-priorizacao/
│   ├── workflow.json
│   └── campos-do-formulario.md
├── 02-conectores-crm/
│   ├── hubspot.json
│   ├── pipedrive.json
│   ├── kommo.json
│   └── google-sheets.json
├── 03-canais-de-mensagem/
│   ├── email.json
│   └── whatsapp.json
├── 04-sla-e-alertas/
│   └── follow-up-e-realerta.json
└── videos/
    ├── 01-importar-o-workflow.mp4
    ├── 02-conectar-o-crm.mp4
    ├── 03-configurar-mensagens.mp4
    └── 04-testar-e-ativar.mp4
```

## Checklist visível na área do comprador

- [ ] Tenho uma instância n8n ativa.
- [ ] Meu formulário consegue enviar dados para um webhook.
- [ ] Escolhi e conectei meu CRM.
- [ ] Configurei o e-mail de primeiro contato.
- [ ] Configurei WhatsApp e confirmei o consentimento.
- [ ] Defini vendedor responsável e backup.
- [ ] Enviei um lead de teste.
- [ ] Confirmei CRM, mensagens e alerta.
- [ ] Ativei o workflow em produção.

## Ordem de construção

1. Criar o núcleo com webhook, validação, deduplicação e resposta de teste.
2. Integrar HubSpot como primeiro conector de referência.
3. Adicionar e-mail e alerta interno.
4. Adicionar classificação resiliente por IA.
5. Criar teste de SLA e redistribuição.
6. Extrair/adaptar os módulos Pipedrive, Kommo e Google Sheets.
7. Adicionar o módulo WhatsApp com regras de consentimento.
8. Gravar os quatro vídeos curtos e publicar a área pós-compra.

## Critérios de aceite da V1

- Um formulário de teste cria ou atualiza o contato sem duplicidade.
- O CRM escolhido recebe origem, interesse, resumo e prioridade.
- O lead recebe o e-mail configurado.
- WhatsApp só é enviado com consentimento e configuração válida.
- O vendedor recebe alerta com contexto e link do contato.
- Uma falha em IA ou WhatsApp não interrompe o registro no CRM.
- O cliente consegue ativar tudo seguindo o checklist sem alterar código.
