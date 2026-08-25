# SENTIENT-AI

O SENTIENT-AI é um hub de ativos digitais com uma camada administrativa de **orquestração operacional**. O MVP atual adiciona a tela **Árvore de conexões** em `/admin`, com topologia hierárquica, seleção de nós, painel de propriedades, histórico de execuções, status do sistema e ações de execução.

## Decisões do MVP

A árvore usa uma coleção própria no MongoDB (`automation_nodes`) como fonte de verdade. O repositório ainda não possui credenciais nem contrato de uma instância n8n; por isso, a execução manual é persistida pelo backend do SENTIENT-AI e o estado de integração n8n aparece como aguardando conexão até que `N8N_BASE_URL` seja configurada. Essa escolha mantém a feature funcional sem duplicar ou inventar uma API externa.

O comando **Executar tudo** executa os agentes ativos em sequência, não interrompe o lote em caso de falha e retorna um resumo com itens concluídos, falhos e bloqueados por aprovação. O botão **Nova automação** abre o placeholder de produto planejado para a V2, enquanto a criação e edição visual de workflows permanece fora do MVP. O minimapa também foi deixado fora do escopo inicial.

## Endpoints adicionados

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| `GET` | `/api/tree` | Retorna a árvore hierárquica de automações e conexões. |
| `GET` | `/api/nodes/{id}/stats` | Retorna métricas agregadas do nó selecionado. |
| `GET` | `/api/nodes/{id}/executions` | Retorna o histórico de execuções do nó. |
| `GET` | `/api/status` | Retorna os indicadores exibidos na sidebar e no footer. |
| `POST` | `/api/automations/{id}/run` | Executa um agente individual. |
| `POST` | `/api/automations/run-all` | Executa o lote de agentes ativos e informa falhas parciais. |

Todas as rotas administrativas exigem a autenticação de administrador já existente no projeto.

## Executar localmente

No backend, configure as variáveis de `backend/.env.example`, em especial `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `CORS_ORIGINS`. Em seguida, execute:

```bash
cd backend
uvicorn server:app --reload --port 8000
```

No frontend, configure `frontend/.env` com `REACT_APP_BACKEND_URL=http://localhost:8000` e execute:

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

O acesso ao hub é feito em `http://localhost:3000/admin` com uma conta administrativa. O seed cria os nós operacionais e o histórico inicial quando as coleções correspondentes estão vazias.

## Validação

O build de produção foi validado com `npm run build`. Como o repositório não possuía testes automatizados de frontend, o comando `CI=true npm test -- --watchAll=false --passWithNoTests` foi usado para confirmar que a suíte está configurada sem bloquear o build por ausência de arquivos de teste. A transformação do documento plano para a árvore hierárquica também foi validada com um teste local do contrato.
