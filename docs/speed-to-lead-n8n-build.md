# Speed to Lead — roteiro de montagem no n8n

Este é o primeiro workflow a ser criado e testado. Ele não depende de CRM ou WhatsApp para funcionar na primeira etapa.

## Nome

`SENTIENT | Speed to Lead | Núcleo de Captura`

## Resultado da primeira entrega

Um formulário de teste envia um lead ao n8n. O n8n valida os dados, normaliza telefone/e-mail, cria um resumo simples, manda e-mail de confirmação, notifica o comercial e devolve uma resposta de sucesso ao site.

## Payload de teste

Use este JSON no Postman, Insomnia ou no próprio formulário de teste:

```json
{
  "name": "Ana Souza",
  "email": "ana@empresa.com",
  "phone": "+55 (11) 99999-9999",
  "company": "Empresa Exemplo",
  "interest": "Automação comercial",
  "message": "Quero integrar formulário, CRM e WhatsApp.",
  "source": "landing-page",
  "utm_campaign": "speed-to-lead",
  "contact_consent": true,
  "page_url": "https://exemplo.com/automacao"
}
```

## Nós, na ordem de construção

1. **Webhook**
   - Método: `POST`.
   - Caminho: `speed-to-lead`.
   - Resposta: usar o nó `Respond to Webhook` ao final.

2. **Set — Normalizar lead**
   - Manter somente os campos do contrato de dados.
   - Converter o e-mail para minúsculas.
   - Remover símbolos do telefone, preservando DDI `55` quando informado.
   - Definir `source` como `site` quando vier vazio.
   - Gerar `received_at` com data/hora atual.

3. **IF — Validar campos mínimos**
   - Exigir nome e e-mail válidos.
   - Caminho inválido: responder `400` com “Confira nome e e-mail e tente novamente”.

4. **Set — Criar contexto comercial**
   - Enquanto a IA não estiver conectada, usar:
     - `priority`: `média`;
     - `summary`: “Lead recebido pelo site. Interesse: {{interest}}.”;
     - `next_action`: “Responder e qualificar necessidade.”

5. **E-mail — Confirmação ao lead**
   - Assunto: `Recebemos seu contato, {{name}}`.
   - Conteúdo: confirmar recebimento e informar prazo realista de retorno.
   - Nunca incluir credenciais, URL de webhook ou dados internos.

6. **E-mail ou Slack — Alerta interno**
   - Enviar nome, contato, interesse, origem, prioridade e resumo.
   - Incluir link do CRM somente depois que o módulo CRM for adicionado.

7. **Respond to Webhook**
   - Status: `200`.
   - Corpo:

```json
{
  "ok": true,
  "message": "Recebemos seu contato. Em breve nossa equipe falará com você."
}
```

## Segunda etapa: HubSpot como conector de referência

Adicionar após a normalização:

1. Buscar contato pelo e-mail.
2. Se existir, atualizar campos e registrar nova interação.
3. Se não existir, criar contato.
4. Criar nota com origem, interesse, mensagem, resumo e prioridade.
5. Retornar URL/ID do contato para o alerta interno.

Essa implementação é a referência para os demais módulos: Pipedrive, Kommo e Google Sheets.

## Terceira etapa: IA resiliente

Inserir um nó de IA entre “Normalizar lead” e “HubSpot”. A saída deve ser JSON:

```json
{
  "priority": "alta",
  "summary": "Empresa busca automação comercial para integrar captação de leads e atendimento.",
  "interest": "Automação comercial",
  "next_action": "Agendar diagnóstico com o time comercial."
}
```

Se esse nó der erro ou demorar além do limite, encaminhar pelo caminho de fallback com prioridade `média`. A captação do lead nunca pode depender da IA.

## Quarta etapa: WhatsApp Cloud API

Adicionar como ramo opcional após o e-mail:

- Só continuar quando `contact_consent` for `true` e houver telefone válido.
- Usar template aprovado quando necessário.
- Em erro de envio, registrar o erro e seguir o fluxo; nunca interromper CRM, e-mail ou alerta interno.

## Teste de aceite

- [ ] Um lead válido recebe resposta `200`.
- [ ] Um lead inválido recebe resposta `400` sem criar ações posteriores.
- [ ] O e-mail chega ao endereço de teste.
- [ ] O alerta interno contém todos os dados úteis para o vendedor.
- [ ] O workflow segue funcionando se o nó de IA for desligado.
- [ ] O workflow não tenta enviar WhatsApp sem consentimento.
