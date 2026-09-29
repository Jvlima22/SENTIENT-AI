# Speed to Lead — núcleo de captura

## O que este workflow já faz

- Recebe leads por `POST` de uma landing page ou site.
- Normaliza nome, e-mail e telefone.
- Rejeita dados sem nome ou e-mail válido.
- Gera um identificador do lead e um contexto comercial inicial.
- Responde ao site sem expor dados internos.

## Como importar no n8n

1. Abra **Workflows** no n8n.
2. Escolha **Import from File**.
3. Selecione `workflow.json`.
4. Abra o nó **Receber lead do site** e copie a URL de teste.
5. Envie o payload do guia `docs/speed-to-lead-n8n-build.md` para essa URL.
6. Confirme a resposta de sucesso e os dados produzidos pelo nó **Preparar contexto comercial**.
7. Troque a URL de teste pela URL de produção apenas após o teste funcionar.

## Importante

O workflow está desativado e ainda não envia e-mail, WhatsApp nem dados ao CRM. Esses conectores entram como módulos para que o comprador escolha apenas as ferramentas que usa. O próximo módulo a ser criado é HubSpot.
