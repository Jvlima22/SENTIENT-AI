"""
Serviço de Ingestão e Sincronização de Skills de Alta Pontuação do GitHub
para o SENTIENT-AI.

Garante que cada skill pertença a um repositório público ÚNICO do GitHub,
com contagem real de estrelas (⭐), autor, descrição e link direto.
"""
import os
import logging
import asyncio
from typing import List, Dict, Any
import requests

logger = logging.getLogger("sentient-ai.github-skills")

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

# Repositórios explicitamente excluídos conforme solicitação do usuário
EXCLUDED_REPOS = {
    "f/awesome-chatgpt-prompts",
    "f/prompts.chat",
    "Jvlima22/SENTIENT-AI",
    "prompts.chat",
}

def get_github_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "SENTIENT-AI-Hub/1.0",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


CATEGORY_KEYWORDS = {
    "Desenvolvimento": ["code", "refactor", "debug", "test", "git", "api", "architecture", "review", "sql", "backend", "frontend", "dev", "program", "transformer", "serving", "inference"],
    "Marketing": ["copy", "marketing", "content", "ad", "launch", "seo", "sales", "audience", "campaign", "social", "multimodal", "reader"],
    "Dados": ["data", "sql", "analytics", "dashboard", "insights", "metrics", "pandas", "visualization", "bi", "rag", "retrieval", "vector"],
    "Produtividade": ["summary", "notes", "organize", "email", "meeting", "wisdom", "extract", "tasks", "workflow", "research", "copilot", "local"],
    "Negócios": ["business", "contract", "legal", "strategy", "startup", "pitch", "negotiation", "finance", "proposal", "agents", "company"],
    "Comunicação": ["support", "customer", "message", "translate", "presentation", "speech", "communication", "search", "persona", "chat"],
    "Automação": ["automation", "mcp", "workflow", "script", "bot", "pipeline", "tool", "browser", "agent"],
    "Educação": ["tutorial", "teach", "explain", "learn", "study", "guide", "education", "course", "prompt-engineering"],
}


def detect_category(title: str, description: str, tags: List[str]) -> str:
    text = f"{title} {description} {' '.join(tags)}".lower()
    scores = {}
    for cat, kws in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in text)
        scores[cat] = score
    
    best = max(scores.items(), key=lambda x: x[1])
    return best[0] if best[1] > 0 else "Desenvolvimento"


def detect_target_ais(title: str, description: str, command: str, tags: List[str]) -> List[str]:
    text = f"{title} {description} {command} {' '.join(tags)}".lower()
    ais = []
    if "claude" in text or "<thinking>" in command or "<artifact" in command or "anthropic" in text:
        ais.append("claude")
    if "chatgpt" in text or "gpt" in text or "openai" in text:
        ais.append("chatgpt")
    if "mcp" in text or "tool" in text or "cursor" in text or "vscode" in text:
        ais.append("cursor")
    if "gemini" in text or "google" in text:
        ais.append("gemini")
    if "perplexity" in text or "search" in text or "research" in text:
        ais.append("perplexity")
    
    if not ais:
        return ["universal", "claude", "chatgpt", "gemini", "perplexity", "cursor"]
    
    if "universal" not in ais:
        ais.insert(0, "universal")
    return ais


# ---------------------------------------------------------------------------
# CATÁLOGO CURADO DE REPOSITÓRIOS PÚBLICOS ÚNICOS DO GITHUB
# Cada skill tem seu PRÓPRIO repositório oficial exclusivo.
# ---------------------------------------------------------------------------
TOP_GITHUB_CURATED_SKILLS = [
    # --- AUTOMAÇÃO ---
    {
        "title": "Execução Autônoma de Objetivos (AutoGPT)",
        "category": "Automação",
        "kind": "Agente Autônomo",
        "level": "Avançado",
        "github_stars": 171000,
        "github_repo": "Significant-Gravitas/AutoGPT",
        "github_url": "https://github.com/Significant-Gravitas/AutoGPT",
        "author": "Significant-Gravitas",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "cursor"],
        "tags": ["automacao", "autogpt", "agentes", "autonomous", "top-rated"],
        "description": "Agente autônomo que decompõe metas em subtarefas, pesquisa na web e executa fluxos complexos sem supervisão.",
        "command": """Você é um Agente Autônomo de Execução no padrão AutoGPT.
Objetivo Principal: [DEFINA SEU OBJETIVO DE NEGÓCIO OU DESENVOLVIMENTO]

Execute o ciclo de raciocínio autônomo:
1. PENSAMENTO: Análise crítica do estado atual e próximos passos necessários.
2. RACIOCÍNIO: Por que essa linha de ação é a mais eficiente.
3. CRÍTICA: Quais riscos, armadilhas ou limitações existem.
4. PLANO DE AÇÃO: Lista estrita de 3 a 5 comandos/tarefas executáveis em sequência.
5. RESULTADO ESPERADO: Critério mensurável de conclusão."""
    },
    {
        "title": "Workflows de Automação & Nós de IA (n8n)",
        "category": "Automação",
        "kind": "Workflow",
        "level": "Intermediário",
        "github_stars": 54200,
        "github_repo": "n8n-io/n8n",
        "github_url": "https://github.com/n8n-io/n8n",
        "author": "n8n-io",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt"],
        "tags": ["automacao", "n8n", "webhooks", "integracao", "top-rated"],
        "description": "Desenha a arquitetura passo a passo e nós lógicos para fluxos de automação com LLMs e webhooks no n8n.",
        "command": """Você é um Especialista em Automação de Processos e Arquiteto de Workflows n8n.
Para o seguinte processo:
[DESCREVA O PROCESSO QUE DESEJA AUTOMATIZAR]

Entregue:
1. **Diagrama Lógico do Fluxo**: Gatilhos (Webhook / Schedule), nós de transformação, nós de IA (LLM Chain / Tool Calling) e saídas.
2. **Configuração dos Nós**: Parâmetros essenciais, expressões JSON e tratamento de falhas.
3. **Código do Nó de Função (Code Node)**: Script JavaScript/Python para formatar os dados intermediários."""
    },
    {
        "title": "Conversação Multi-Agente & Orquestração (AutoGen)",
        "category": "Automação",
        "kind": "Multi-Agente",
        "level": "Avançado",
        "github_stars": 38900,
        "github_repo": "microsoft/autogen",
        "github_url": "https://github.com/microsoft/autogen",
        "author": "microsoft",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "cursor"],
        "tags": ["automacao", "autogen", "microsoft", "multi-agent"],
        "description": "Cria ecossistemas multi-agente onde múltiplos especialistas conversam entre si para resolver problemas colaborativamente.",
        "command": """Atue como um Engenheiro de Agentes Conversacionais usando o padrão Microsoft AutoGen.
Defina um sistema multi-agente para a seguinte tarefa:
[DESCREVA A TAREFA COMPLEXA]

Estruture:
1. **UserProxyAgent**: Instruções e política de execução de código e feedback humano.
2. **AssistantAgent 1 (Especialista Técnico)**: System prompt e capacidades específicas.
3. **AssistantAgent 2 (Crítico / Revisor de Qualidade)**: Critérios de validação e aprovação.
4. **GroupChat & Manager**: Regras de transição de turno e condição de parada (TERMINATE)."""
    },
    {
        "title": "Navegação e Ação Web Autônoma (Browser-Use)",
        "category": "Automação",
        "kind": "Automação Web",
        "level": "Avançado",
        "github_stars": 31500,
        "github_repo": "browser-use/browser-use",
        "github_url": "https://github.com/browser-use/browser-use",
        "author": "browser-use",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["automacao", "browser", "scraping", "agentes"],
        "description": "Instrui agentes de IA a navegar por páginas web complexas, preencher formulários e extrair dados dinâmicos.",
        "command": """Você é um Agente de Automação de Navegador Web no padrão browser-use.
Objetivo no navegador: [DESCREVA O SITE E O QUE DEVE SER FEITO / EXTRAÍDO]

Gere o plano de execução passo a passo do agente:
1. Navegação inicial e verificação de seletores de página.
2. Ações de clique, digitação e espera de renderização assíncrona.
3. Estratégia de extração do payload estruturado em JSON.
4. Tratamento de pop-ups, captchas e paginação."""
    },
    {
        "title": "Servidores & Ferramentas Model Context Protocol (MCP)",
        "category": "Automação",
        "kind": "Servidor MCP",
        "level": "Avançado",
        "github_stars": 29400,
        "github_repo": "modelcontextprotocol/servers",
        "github_url": "https://github.com/modelcontextprotocol/servers",
        "author": "modelcontextprotocol",
        "source": "github",
        "target_ais": ["cursor", "claude", "universal"],
        "tags": ["mcp", "automacao", "ferramentas", "cursor", "claude-desktop"],
        "description": "Especificações e código Python/TypeScript para servidores MCP conectando IAs a ferramentas e bancos locais.",
        "command": """Você é um Engenheiro de Sistemas especialista no Model Context Protocol (MCP) da Anthropic.
Preciso criar uma ferramenta/servidor MCP para conectar minha IA ao seguinte serviço ou API:
[DESCREVA A FERRAMENTA / API EXTERNA]

Forneça:
1. **Definição de Tools e Schemas**: JSON Schema detalhado para cada ferramenta, parâmetros obrigatórios e tipos.
2. **Implementação do Servidor**: Código completo em Python (usando o SDK oficial `mcp`) ou TypeScript.
3. **Tratamento de Erros e Segurança**: Sanitização de entradas e logs.
4. **Configuração `mcpServers`**: Bloco JSON pronto para adicionar no Claude Desktop / Cursor."""
    },

    # --- DESENVOLVIMENTO ---
    {
        "title": "Pipelines & Modelos com Transformers (Hugging Face)",
        "category": "Desenvolvimento",
        "kind": "Machine Learning",
        "level": "Avançado",
        "github_stars": 139000,
        "github_repo": "huggingface/transformers",
        "github_url": "https://github.com/huggingface/transformers",
        "author": "huggingface",
        "source": "github",
        "target_ais": ["universal", "claude", "cursor", "chatgpt"],
        "tags": ["dev", "ml", "transformers", "nlp", "top-rated"],
        "description": "Constrói pipelines eficientes de NLP, embeddings e classificação usando a biblioteca padrão da Hugging Face.",
        "command": """Atue como um Engenheiro de Machine Learning especialista em Hugging Face Transformers.
Crie uma solução completa para a tarefa: [CLASSIFICAÇÃO / EXTRAÇÃO / EMBEDDINGS / GERAÇÃO]

Entregue:
1. Escolha do modelo open-source ideal no Hugging Face Hub com base em precisão e latência.
2. Código Python com `pipeline`, tokenização com padding/truncation e suporte a GPU (CUDA/MPS).
3. Otimização com quantização (bitsandbytes int8/int4) e ONNX Runtime.
4. Tratamento de batches para inferência em produção."""
    },
    {
        "title": "Orquestração de Chains & RAG Avançado (LangChain)",
        "category": "Desenvolvimento",
        "kind": "Framework RAG",
        "level": "Avançado",
        "github_stars": 104000,
        "github_repo": "langchain-ai/langchain",
        "github_url": "https://github.com/langchain-ai/langchain",
        "author": "langchain-ai",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["dev", "langchain", "rag", "chains", "top-rated"],
        "description": "Estrutura fluxos de RAG, LCEL (LangChain Expression Language), recuperação contextual e guardrails de LLMs.",
        "command": """Atue como um Arquiteto de Software especialista em LangChain e LCEL.
Para a seguinte necessidade de aplicação com LLM:
[DESCREVA A APLICAÇÃO E FONTES DE DADOS]

Forneça:
1. **Estrutura LCEL**: Cadeia modular com `RunnablePassthrough`, `PromptTemplate`, `ChatModel` e `StrOutputParser`.
2. **Estratégia de Retrieval**: Chunking semântico, VectorStore e re-ranking contextual.
3. **Memória e Sessões**: Histórico conversacional persistente por usuário.
4. **Tratamento de Exceções**: Fallback para modelos alternativos e limites de tokens."""
    },
    {
        "title": "Raciocínio de Próxima Geração (DeepSeek-V3)",
        "category": "Desenvolvimento",
        "kind": "Arquitetura MoE",
        "level": "Avançado",
        "github_stars": 98000,
        "github_repo": "deepseek-ai/DeepSeek-V3",
        "github_url": "https://github.com/deepseek-ai/DeepSeek-V3",
        "author": "deepseek-ai",
        "source": "github",
        "target_ais": ["universal", "claude", "cursor", "chatgpt"],
        "tags": ["dev", "deepseek", "moe", "reasoning", "top-rated"],
        "description": "Explora padrões de raciocínio profundo, otimização de Mixture-of-Experts (MoE) e benchmark de código.",
        "command": """Atue como um Pesquisador de IA especialista na arquitetura DeepSeek-V3 e modelos MoE.
Analise a seguinte questão complexa de algoritmo ou lógica de sistema:
[COLE O PROBLEMA OU DESAFIO DE CÓDIGO]

Entregue uma solução com cadeia profunda de pensamento:
1. **Desconstrução Matemática/Lógica**: Invariantes, casos de borda e restrições fundamentais.
2. **Exploração de Hipóteses**: Análise comparativa de diferentes abordagens com seus trade-offs.
3. **Implementação Otimizada**: Código com complexidade mínima de tempo O(N) e espaço O(1).
4. **Verificação Formal e Testes**: Prova de corretude passo a passo."""
    },
    {
        "title": "Agente Autônomo de Engenharia de Software (OpenHands)",
        "category": "Desenvolvimento",
        "kind": "Agente Dev",
        "level": "Avançado",
        "github_stars": 46000,
        "github_repo": "All-Hands-AI/OpenHands",
        "github_url": "https://github.com/All-Hands-AI/OpenHands",
        "author": "All-Hands-AI",
        "source": "github",
        "target_ais": ["cursor", "claude", "universal"],
        "tags": ["dev", "openhands", "coding-agent", "git"],
        "description": "Coordena agentes que navegam em codebases, executam testes, corrigem bugs e geram pull requests.",
        "command": """Você é um Agente Autônomo de Desenvolvimento de Software no estilo OpenHands.
Analise o repositório/tarefa: [DESCREVA O PROBLEMA OU FEATURE]

Execute:
1. **Inspeção de Contexto**: Identificação dos arquivos relevantes e dependências afetadas.
2. **Plano de Modificação Mínima**: Alterações focadas preservando retrocompatibilidade.
3. **Execução de Testes**: Scripts para validar a correção e prevenir regressões.
4. **Mensagem de Commit e Resumo de PR**: Documentação técnica detalhada das mudanças."""
    },
    {
        "title": "Serving de LLMs de Alto Rendimento (vLLM)",
        "category": "Desenvolvimento",
        "kind": "Infraestrutura IA",
        "level": "Avançado",
        "github_stars": 42000,
        "github_repo": "vllm-project/vllm",
        "github_url": "https://github.com/vllm-project/vllm",
        "author": "vllm-project",
        "source": "github",
        "target_ais": ["universal", "cursor"],
        "tags": ["dev", "vllm", "serving", "gpu", "pagedattention"],
        "description": "Configura servidores de inferência de LLMs de alta performance com PagedAttention, continuous batching e FastAPI.",
        "command": """Atue como um Engenheiro de Infraestrutura de IA e MLOps especialista em vLLM.
Para o modelo [NOME DO MODELO] no hardware [DESCRIÇÃO DA GPU / VRAM]:

Forneça:
1. Comando de inicialização otimizado do servidor vLLM com flags de GPU memory utilization, tensor parallel size e max model len.
2. Configuração de continuous batching e prefix caching para redução drástica de latência de primeiro token (TTFT).
3. Exemplo de cliente assíncrono em Python consumindo o endpoint compatível com OpenAI."""
    },
    {
        "title": "Proxy Universal de IAs & Load Balancer (LiteLLM)",
        "category": "Desenvolvimento",
        "kind": "API Proxy",
        "level": "Intermediário",
        "github_stars": 24600,
        "github_repo": "BerriAI/litellm",
        "github_url": "https://github.com/BerriAI/litellm",
        "author": "BerriAI",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "gemini", "perplexity"],
        "tags": ["dev", "litellm", "proxy", "multi-llm"],
        "description": "Padroniza chamadas para 100+ provedores de LLMs (OpenAI, Anthropic, Gemini, Ollama) em um único formato unificado.",
        "command": """Atue como um Arquiteto de APIs de IA usando LiteLLM.
Crie a arquitetura de roteamento unificado para as seguintes IAs: [LISTE OS MODELOS/PROVEDORES]

Entregue:
1. Arquivo de configuração `config.yaml` com modelos, fallbacks automáticos, load balancing e limites de taxa (rate limits).
2. Código Python usando `completion()` com streaming, tratamento universal de erros e tracking de custos por chamada.
3. Configuração de chaves de API virtuais e orçamentos por usuário/equipe."""
    },
    {
        "title": "SDK de Agentes e Plugins Corporativos (Semantic Kernel)",
        "category": "Desenvolvimento",
        "kind": "SDK Corporativo",
        "level": "Avançado",
        "github_stars": 23800,
        "github_repo": "microsoft/semantic-kernel",
        "github_url": "https://github.com/microsoft/semantic-kernel",
        "author": "microsoft",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "cursor"],
        "tags": ["dev", "semantic-kernel", "microsoft", "enterprise"],
        "description": "Integra LLMs modernos com aplicações C#, Python e Java através de plugins semânticos, memória vetorial e planejadores.",
        "command": """Atue como um Arquiteto de Software Corporativo especialista em Microsoft Semantic Kernel.
Crie um plugin semântico e nativo para resolver: [DESCREVA O FLUXO EMPRESARIAL]

Estrutura:
1. **Native Plugins**: Funções Python/C# tipadas com decorators de descrição semântica para Function Calling.
2. **Semantic Functions**: Prompts parametrizados com controle de temperatura e max tokens.
3. **Planners & Filters**: Orquestração automática de plugins para alcançar objetivos dinâmicos."""
    },
    {
        "title": "Assistente de Código Open-Source para IDEs (Continue)",
        "category": "Desenvolvimento",
        "kind": "Extensão Dev",
        "level": "Intermediário",
        "github_stars": 23200,
        "github_repo": "continuedev/continue",
        "github_url": "https://github.com/continuedev/continue",
        "author": "continuedev",
        "source": "github",
        "target_ais": ["cursor", "claude", "chatgpt"],
        "tags": ["dev", "continue", "ide", "vscode", "autocomplete"],
        "description": "Configura assistentes de código inteligentes dentro do VS Code / JetBrains com contexto de codebase e modelos locais.",
        "command": """Você é um Especialista em Produtividade de Desenvolvimento com Continue.dev.
Configure o ambiente de IA para o projeto: [STACK DO PROJETO]

Forneça:
1. Arquivo `config.json` do Continue configurado com modelos de Chat, Tab Autocomplete e Embeddings.
2. Definição de Context Providers (`@codebase`, `@docs`, `@folder`, `@diff`) para maximizar a precisão.
3. Prompts customizados de slash commands (`/review`, `/test`, `/doc`) adaptados para o estilo de código do time."""
    },
    {
        "title": "Engenharia de Prompt Claude com XML & Thinking",
        "category": "Desenvolvimento",
        "kind": "Engenharia de Prompt",
        "level": "Avançado",
        "github_stars": 18900,
        "github_repo": "anthropics/claude-prompt-library",
        "github_url": "https://github.com/anthropics/claude-prompt-library",
        "author": "anthropics",
        "source": "github",
        "target_ais": ["claude", "universal"],
        "tags": ["claude", "xml", "prompt-engineering", "anthropic"],
        "description": "Gera prompts otimizados no padrão oficial da Anthropic com delimitação precisa por tags XML e raciocínio encadeado.",
        "command": """Você é um especialista sênior em Engenharia de Prompt para o Claude (Anthropic).
Vou fornecer uma tarefa que quero resolver:
[DESCREVA A TAREFA DESEJADA]

Gere um prompt otimizado seguindo as melhores práticas oficiais da Anthropic:
- Definição clara de papel e objetivo
- Delimitação de contexto e variáveis usando tags XML (<context>, <instructions>, <rules>, <output_format>)
- Etapa de raciocínio encadeado (<thinking>)
- Exemplos Few-Shot se aplicável
- Restrições explícitas de formatação"""
    },

    # --- PRODUTIVIDADE ---
    {
        "title": "Execução Local de Modelos de Linguagem (Ollama)",
        "category": "Produtividade",
        "kind": "Ambiente Local",
        "level": "Iniciante",
        "github_stars": 118000,
        "github_repo": "ollama/ollama",
        "github_url": "https://github.com/ollama/ollama",
        "author": "ollama",
        "source": "github",
        "target_ais": ["universal", "cursor"],
        "tags": ["produtividade", "ollama", "local-llm", "privacidade", "top-rated"],
        "description": "Executa modelos de linguagem avançados (Llama 3, Mistral, Qwen, DeepSeek) localmente com total privacidade.",
        "command": """Você é um Especialista em Infraestrutura de IA Local com Ollama.
Para a tarefa de [DESCREVA O CASO DE USO: CÓDIGO / RESUMO / CHAT / RAG]:

Forneça:
1. O modelo recomendado da biblioteca Ollama (com base no equilíbrio entre parâmetros e VRAM).
2. Arquivo `Modelfile` customizado com System Prompt, Parâmetros (temperature, top_p, stop tokens) e Template.
3. Comandos CLI para criar, rodar e servir a API local em `http://localhost:11434`."""
    },
    {
        "title": "Extração de Sabedoria & Padrões Modulares (Fabric)",
        "category": "Produtividade",
        "kind": "Síntese",
        "level": "Intermediário",
        "github_stars": 34800,
        "github_repo": "danielmiessler/fabric",
        "github_url": "https://github.com/danielmiessler/fabric",
        "author": "danielmiessler",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "gemini"],
        "tags": ["fabric", "resumo", "insights", "sabedoria", "top-rated"],
        "description": "Extrai sabedoria profunda, citações memoráveis, conceitos e hábitos acionáveis de textos densos ou vídeos.",
        "command": """Você é um extrator especialista de sabedoria e ideias fundamentais no padrão Fabric.
Analise o texto/transcrição abaixo e extraia:
1. RESUMO EXECUTIVO (1 parágrafo denso e direto)
2. IDEIAS PRINCIPAIS (10 a 20 bullet points com os conceitos centrais)
3. CITAÇÕES MEMORÁVEIS (trechos mais impactantes na íntegra)
4. HÁBITOS E AÇÕES RECOMENDADAS (o que começar a fazer hoje)
5. FATOS E ESTATÍSTICAS RELEVANTES

Texto para análise:
[COLE O TEXTO OU TRANSCRIÇÃO AQUI]"""
    },
    {
        "title": "Pesquisador Autônomo & Relatórios Web (GPT-Researcher)",
        "category": "Produtividade",
        "kind": "Pesquisa Web",
        "level": "Intermediário",
        "github_stars": 18400,
        "github_repo": "assafelovic/gpt-researcher",
        "github_url": "https://github.com/assafelovic/gpt-researcher",
        "author": "assafelovic",
        "source": "github",
        "target_ais": ["universal", "perplexity", "claude", "chatgpt"],
        "tags": ["produtividade", "pesquisa", "relatorios", "web-research"],
        "description": "Conduz pesquisas abrangentes na web agregando mais de 20 fontes com referências bibliográficas estruturadas.",
        "command": """Você é um Pesquisador Acadêmico e Analista de Inteligência de Mercado no padrão GPT-Researcher.
Tema da pesquisa: [TEMA OU PERGUNTA DE PESQUISA]

Entregue um Relatório Abrangente de Pesquisa:
1. **Resumo Executivo & Conclusões Chave**: Síntese direta dos achados.
2. **Análise Detalhada por Tópicos**: Fatos comprovados, dados quantitativos e consensos/divergências do setor.
3. **Perspectivas Futuras e Riscos**: Tendências projetadas para os próximos 12 a 24 meses.
4. **Fontes & Referências**: Citações explícitas de entidades, relatórios e autores."""
    },
    {
        "title": "Copilots de IA Embutidos em Aplicações React (CopilotKit)",
        "category": "Produtividade",
        "kind": "Copilot UI",
        "level": "Intermediário",
        "github_stars": 16800,
        "github_repo": "CopilotKit/CopilotKit",
        "github_url": "https://github.com/CopilotKit/CopilotKit",
        "author": "CopilotKit",
        "source": "github",
        "target_ais": ["cursor", "universal"],
        "tags": ["produtividade", "react", "copilot", "ui", "frontend"],
        "description": "Adiciona assistentes de IA contextuais, barras laterais de chat e autocomplete inteligente dentro de apps web.",
        "command": """Atue como um Engenheiro Frontend especialista em CopilotKit e React.
Crie um assistente contextual embutido para o componente/tela: [DESCREVA A TELA E O QUE A IA DEVE CONTROLAR]

Entregue:
1. Código com `CopilotSidebar` ou `CopilotPopup` integrado com o tema da aplicação.
2. Implementação de `useCopilotReadable` para fornecer estado da tela em tempo real à IA.
3. Implementação de `useCopilotAction` para permitir que a IA execute ações (ex: preencher formulário, atualizar dados)."""
    },

    # --- DADOS & ANALYTICS ---
    {
        "title": "Indexação e Conectores de Dados RAG (LlamaIndex)",
        "category": "Dados",
        "kind": "Data Framework",
        "level": "Avançado",
        "github_stars": 41500,
        "github_repo": "run-llama/llama_index",
        "github_url": "https://github.com/run-llama/llama_index",
        "author": "run-llama",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["dados", "llamaindex", "rag", "knowledge-graphs", "top-rated"],
        "description": "Conecta fontes de dados estruturadas e não-estruturadas a LLMs usando índices vetoriais e grafos de conhecimento.",
        "command": """Atue como um Engenheiro de Dados de IA especialista em LlamaIndex.
Para o seguinte conjunto de dados: [PDFS / BANCO SQL / NOTION / ARQUIVOS]

Entregue:
1. Pipeline de ingestão com `SimpleDirectoryReader` e `SentenceSplitter` semântico.
2. Criação de `VectorStoreIndex` e `PropertyGraphIndex` com embeddings adequados.
3. Configuração do `QueryEngine` com `SimilarityPostprocessor` e sintetizador de respostas com citações de fonte."""
    },
    {
        "title": "Dashboards Interativos e Apps de IA em Python (Streamlit)",
        "category": "Dados",
        "kind": "Data Viz",
        "level": "Iniciante",
        "github_stars": 38000,
        "github_repo": "streamlit/streamlit",
        "github_url": "https://github.com/streamlit/streamlit",
        "author": "streamlit",
        "source": "github",
        "target_ais": ["universal", "cursor", "chatgpt"],
        "tags": ["dados", "streamlit", "dashboard", "python", "analytics"],
        "description": "Cria aplicações web interativas para visualização de dados, métricas e interfaces de chat de IA em poucas linhas de Python.",
        "command": """Atue como um Engenheiro de Analytics e Desenvolvedor Streamlit.
Crie um dashboard completo para o seguinte caso de uso: [DESCREVA AS MÉTRICAS OU DADOS A EXIBIR]

Forneça:
1. Código Python completo com layout em colunas (`st.columns`), métricas (`st.metric`) e gráficos (`plotly.express`).
2. Filtros interativos na sidebar (`st.sidebar.selectbox`, `st.sidebar.slider`).
3. Interface de Chat com histórico (`st.chat_message`, `st.chat_input`) conectada a uma IA."""
    },
    {
        "title": "Motor RAG com Compreensão Profunda de Documentos (RAGFlow)",
        "category": "Dados",
        "kind": "RAG Engine",
        "level": "Avançado",
        "github_stars": 32800,
        "github_repo": "infiniflow/ragflow",
        "github_url": "https://github.com/infiniflow/ragflow",
        "author": "infiniflow",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt"],
        "tags": ["dados", "ragflow", "ocr", "documentos", "tabelas"],
        "description": "Extrai e recupera informações precisas de PDFs complexos, tabelas financeiras e documentos digitalizados com OCR.",
        "command": """Você é um Especialista em Processamento de Documentos e RAG baseada em RAGFlow.
Para o documento: [DESCREVA O TIPO DE ARQUIVO: RELATÓRIO / CONTRATO / TABELA EXCEL]

Gere a estratégia de extração e resposta:
1. Método de parsing ideal (Document Structure Understanding para preservar hierarquia visual).
2. Segmentação por tabelas e figuras evitando perda de contexto numérico.
3. Prompt de extração estrita fundamentada puramente no texto delimitado com tolerância zero a alucinações."""
    },
    {
        "title": "Parser, Transpilador & Otimizador de SQL (SQLGlot)",
        "category": "Dados",
        "kind": "Otimização SQL",
        "level": "Intermediário",
        "github_stars": 8400,
        "github_repo": "tobymao/sqlglot",
        "github_url": "https://github.com/tobymao/sqlglot",
        "author": "tobymao",
        "source": "github",
        "target_ais": ["universal", "cursor", "chatgpt"],
        "tags": ["dados", "sql", "sqlglot", "postgres", "bigquery"],
        "description": "Transpila, valida e otimiza queries SQL entre diferentes dialetos (PostgreSQL, BigQuery, Snowflake, MySQL).",
        "command": """Você é um DBA Sênior e Especialista em Compilação de SQL usando conceitos do SQLGlot.
Analise a consulta SQL abaixo:
[COLE A QUERY SQL]
Dialeto de Origem: [DIALETO DE ORIGEM] -> Dialeto Alvo: [DIALETO ALVO]

Entregue:
1. A query convertida perfeitamente para o dialeto alvo.
2. Otimizações de desempenho aplicadas (CTEs eficientes, remoção de subconsultas redundantes).
3. Índices recomendados e avisos sobre diferenças semânticas entre os bancos."""
    },

    # --- NEGÓCIOS & ESTRATÉGIA ---
    {
        "title": "Simulação de Empresa Multi-Agente (MetaGPT)",
        "category": "Negócios",
        "kind": "Simulação Empresarial",
        "level": "Avançado",
        "github_stars": 48500,
        "github_repo": "geekan/MetaGPT",
        "github_url": "https://github.com/geekan/MetaGPT",
        "author": "geekan",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt"],
        "tags": ["negocios", "metagpt", "empresa", "produto", "top-rated"],
        "description": "Modela o fluxo completo de uma empresa de tecnologia com papéis de Product Manager, Arquiteto, Engenheiro e QA.",
        "command": """Você é uma Equipe Completa de Software no padrão MetaGPT.
Ideia de Produto: [DESCREVA SUA IDEIA DE PRODUTO OU STARTUP]

Gere os entregáveis de cada papel:
1. **Product Manager (PRD)**: Problema, personas, requisitos funcionais e critérios de sucesso.
2. **Arquiteto de Sistemas**: Design técnico, tecnologias escolhidas e estrutura de arquivos.
3. **Engenheiro Líder**: Código dos componentes centrais e endpoints.
4. **Engenheiro de QA**: Casos de teste automatizados cobrindo fluxos críticos."""
    },
    {
        "title": "Orquestração de Equipes de Agentes de Negócios (CrewAI)",
        "category": "Negócios",
        "kind": "Orquestração de Processos",
        "level": "Intermediário",
        "github_stars": 29800,
        "github_repo": "crewAIInc/crewAI",
        "github_url": "https://github.com/crewAIInc/crewAI",
        "author": "crewAIInc",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt"],
        "tags": ["negocios", "crewai", "agentes", "processos"],
        "description": "Coordena agentes autônomos com papéis, objetivos e ferramentas específicas trabalhando em colaboração sequencial ou hierárquica.",
        "command": """Você é um Arquiteto de Agentes de Negócios usando o padrão CrewAI.
Para a seguinte operação de negócios:
[DESCREVA O PROCESSO DE NEGÓCIOS: EX: PROSPECÇÃO DE LEADS / ANÁLISE COMPETITIVA]

Estruture a equipe (Crew):
1. **Agente 1 (Pesquisador/Analista)**: Role, Goal, Backstory e Ferramentas atribuídas.
2. **Agente 2 (Estrategista/Redator)**: Role, Goal, Backstory e Ferramentas atribuídas.
3. **Tarefas (Tasks)**: Descrição clara, formato esperado de saída (Expected Output) e dependências entre tarefas.
4. **Processo de Execução**: Sequencial ou Hierárquico com Manager LLM."""
    },
    {
        "title": "Desenvolvimento Colaborativo com Agentes Virtuais (ChatDev)",
        "category": "Negócios",
        "kind": "Desenvolvimento Colaborativo",
        "level": "Intermediário",
        "github_stars": 26300,
        "github_repo": "OpenBMB/ChatDev",
        "github_url": "https://github.com/OpenBMB/ChatDev",
        "author": "OpenBMB",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude"],
        "tags": ["negocios", "chatdev", "colaboracao", "desenvolvimento"],
        "description": "Ambiente virtualizado onde agentes com papéis de negócio e código interagem em fases (Design, Coding, Testing, Documentation).",
        "command": """Atue como o ecossistema ChatDev para planejar a execução do seguinte software:
[DESCREVA O SOFTWARE OU FERRAMENTA]

Execute a fase de diálogo colaborativo:
1. **Design Phase**: Diálogo entre CEO e CPO alinhando escopo e público.
2. **Coding Phase**: Diálogo entre CTO e Programador definindo bibliotecas e código-base.
3. **Testing Phase**: Diálogo entre Programador e Revisor corrigindo falhas encontradas.
4. **Documentation Phase**: Manual de usuário e guia de instalação gerados pelo time."""
    },
    {
        "title": "Aplicações Prontas & Modelos de Negócio em IA (Awesome LLM Apps)",
        "category": "Negócios",
        "kind": "Aplicações Práticas",
        "level": "Intermediário",
        "github_stars": 22100,
        "github_repo": "Shubhamsaboo/awesome-llm-apps",
        "github_url": "https://github.com/Shubhamsaboo/awesome-llm-apps",
        "author": "Shubhamsaboo",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "gemini"],
        "tags": ["negocios", "llm-apps", "monetizacao", "mvp"],
        "description": "Estrutura modelos de negócio, monetização e arquitetura para produtos e MVPs baseados em IA Generativa.",
        "command": """Atue como um Consultor de Produtos de IA e Growth.
Para a seguinte ideia de SaaS / Ferramenta de IA: [DESCREVA O PRODUTO]

Entregue:
1. **Arquitetura Mínima do MVP**: Componentes essenciais de IA, banco e UI para lançar em 7 dias.
2. **Modelo de Precificação & Custos de Inferência**: Cálculo de margem considerando tokens gastos por usuário.
3. **Estratégia de Go-to-Market (GTM)**: Canais de aquisição orgânica e ativação de usuários."""
    },

    # --- MARKETING & CONTEÚDO ---
    {
        "title": "Leitor de Web & Otimização de Conteúdo para IA e SEO (Jina Reader)",
        "category": "Marketing",
        "kind": "SEO & Web Scraping",
        "level": "Intermediário",
        "github_stars": 24000,
        "github_repo": "jina-ai/reader",
        "github_url": "https://github.com/jina-ai/reader",
        "author": "jina-ai",
        "source": "github",
        "target_ais": ["universal", "perplexity", "claude", "chatgpt"],
        "tags": ["marketing", "seo", "jina", "web", "markdown"],
        "description": "Converte páginas da web em markdown limpo e estruturado para alimentar IAs com contexto de mercado e concorrentes.",
        "command": """Atue como um Especialista em Inteligência Competitiva e SEO usando a abordagem do Jina Reader.
Analise a página/concorrente abaixo:
[COLE A URL OU CONTEÚDO DA PÁGINA DO CONCORRENTE]

Entregue:
1. **Estrutura Semântica Extraída**: Proposta de valor principal, palavras-chave alvo e tom de voz.
2. **Matriz de Gaps de Conteúdo**: O que o concorrente deixou de abordar e onde podemos superar.
3. **Plano de Conteúdo Contra-Ataque**: Headline, tópicos H2/H3 e ângulos inovadores para ranquear acima."""
    },
    {
        "title": "Análise Multimodal de Campanhas e Visão (LAVIS)",
        "category": "Marketing",
        "kind": "IA Multimodal",
        "level": "Avançado",
        "github_stars": 9200,
        "github_repo": "salesforce/LAVIS",
        "github_url": "https://github.com/salesforce/LAVIS",
        "author": "salesforce",
        "source": "github",
        "target_ais": ["universal", "gemini", "chatgpt", "claude"],
        "tags": ["marketing", "multimodal", "visao", "salesforce", "branding"],
        "description": "Analisa imagens publicitárias, layouts e criativos visuais para extrair insights de branding e legendas de alto impacto.",
        "command": """Você é um Diretor de Arte e Especialista em IA Multimodal no padrão Salesforce LAVIS.
Analise a descrição ou elementos do criativo visual abaixo:
[DESCREVA OS ELEMENTOS VISUAIS DO ANÚNCIO OU POST]

Forneça:
1. **Análise de Hierarquia Visual**: Foco visual, psicologia das cores e clareza do produto.
2. **3 Variações de Copy Alinhadas**: Textos para anúncio com sinergia total entre imagem e texto.
3. **Recomendações de Teste A/B**: Quais elementos gráficos alterar para aumentar CTR."""
    },

    # --- COMUNICAÇÃO & ATENDIMENTO ---
    {
        "title": "Criação de Personas e Chat Interativo (Text-Generation-WebUI)",
        "category": "Comunicação",
        "kind": "Personas de Chat",
        "level": "Iniciante",
        "github_stars": 41200,
        "github_repo": "oobabooga/text-generation-webui",
        "github_url": "https://github.com/oobabooga/text-generation-webui",
        "author": "oobabooga",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude"],
        "tags": ["comunicacao", "persona", "chat", "atendimento", "top-rated"],
        "description": "Estrutura personas de atendimento e conversação com tom de voz consistente, diretrizes de empatia e limites claros.",
        "command": """Você é um Designer de Personas Conversacionais para IA.
Crie a persona completa para o seguinte canal: [ATENDIMENTO AO CLIENTE / VENDAS / SUPORTE TÉCNICO]
Empresa: [NOME DA EMPRESA E VALORES]

Entregue:
1. **Identidade e Tom de Voz**: Personalidade, vocabulário característico e tom emocional.
2. **Diretrizes Estritas de Resposta**: Como agir em situações de crise, reembolsos ou dúvidas técnicas.
3. **Exemplos de Interações (Few-Shot)**: 3 exemplos de diálogo demonstrando a postura ideal da persona."""
    },
    {
        "title": "Motor de Busca Inteligente e Pesquisa Multi-Passo (MindSearch)",
        "category": "Comunicação",
        "kind": "Busca Inteligente",
        "level": "Intermediário",
        "github_stars": 6300,
        "github_repo": "InternLM/MindSearch",
        "github_url": "https://github.com/InternLM/MindSearch",
        "author": "InternLM",
        "source": "github",
        "target_ais": ["perplexity", "universal", "claude"],
        "tags": ["comunicacao", "busca", "mindsearch", "pesquisa"],
        "description": "Decompõe perguntas complexas em grafos de busca multi-passo gerando respostas analíticas completas.",
        "command": """Você é um Agente de Busca Cognitiva Multi-Passo no padrão MindSearch.
Pergunta complexa: [COLE SUA DÚVIDA OU TEMA MULTIFACETADO]

Execute a decomposição da busca:
1. **Grafo de Sub-Consultas**: Divisão da dúvida em 3 a 5 perguntas atômicas independentes.
2. **Síntese Cruzada**: Comparação e validação cruzada das informações obtidas em cada etapa.
3. **Resposta Estruturada Final**: Apresentação clara com conclusões objetivas e fontes."""
    },

    # --- EDUCAÇÃO & ENSINO ---
    {
        "title": "Guia Completo de Engenharia de Prompt (Prompt-Engineering-Guide)",
        "category": "Educação",
        "kind": "Guia Educacional",
        "level": "Iniciante",
        "github_stars": 59000,
        "github_repo": "dair-ai/Prompt-Engineering-Guide",
        "github_url": "https://github.com/dair-ai/Prompt-Engineering-Guide",
        "author": "dair-ai",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "gemini", "perplexity"],
        "tags": ["educacao", "prompt-engineering", "guia", "dair-ai", "top-rated"],
        "description": "Ensina técnicas avançadas de prompt: Chain-of-Thought, ReAct, Directional Stimulus e Tree of Thoughts.",
        "command": """Atue como um Professor de Engenharia de Prompt com base no Prompt Engineering Guide (DAIR.AI).
Explique e aplique a técnica [CHAIN-OF-THOUGHT / REACT / TREE OF THOUGHTS] para o problema:
[DESCREVA O PROBLEMA OU TAREFA]

Entregue:
1. **Conceito Teórico**: Como a técnica funciona na arquitetura dos LLMs.
2. **Exemplo Prático Antes vs Depois**: Demonstração clara da melhoria de acurácia.
3. **Template Reutilizável**: Estrutura de prompt pronta para copiar e aplicar."""
    },
    {
        "title": "Currículo Prático de Inteligência Artificial (ML For Beginners)",
        "category": "Educação",
        "kind": "Ensino Prático",
        "level": "Iniciante",
        "github_stars": 72000,
        "github_repo": "microsoft/ML-For-Beginners",
        "github_url": "https://github.com/microsoft/ML-For-Beginners",
        "author": "microsoft",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "gemini"],
        "tags": ["educacao", "machine-learning", "microsoft", "curso"],
        "description": "Explica conceitos fundamentais de Inteligência Artificial, regressão, classificação e redes neurais de forma didática.",
        "command": """Você é um Instrutor de Ciência de Dados e IA com a metodologia didática do Microsoft ML-For-Beginners.
Explique o conceito: [CONCEITO: EX: REGRESSÃO LINEAR / GRADIENT DESCENT / ATTENTION / OVERFITTING]

Estrutura da aula:
1. **A Grande Analogia do Dia a Dia**: Comparação prática e intuitiva sem fórmulas matemáticas pesadas.
2. **O Mecanismo Passo a Passo**: Como o algoritmo calcula e aprende iterativamente.
3. **Exemplo Prático em Python**: Código simples com Scikit-Learn / PyTorch ilustrando o funcionamento.
4. **Desafio Rápido de Fixação**: Pergunta de múltipla escolha com explicação da resposta correta."""
    },
    {
        "title": "Treinamento Instrucional e Síntese de Conhecimento (InstructLab)",
        "category": "Educação",
        "kind": "Fine-Tuning",
        "level": "Avançado",
        "github_stars": 5100,
        "github_repo": "instructlab/instructlab",
        "github_url": "https://github.com/instructlab/instructlab",
        "author": "instructlab",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt"],
        "tags": ["educacao", "instructlab", "fine-tuning", "synthetic-data"],
        "description": "Gera pares de dados sintéticos instrucionais de alta qualidade (Q&A) para fine-tuning e alinhamento de modelos abertos.",
        "command": """Atue como um Engenheiro de Dados de Treinamento no padrão InstructLab.
A partir do seguinte conhecimento ou documentação técnica:
[COLE O CONTEXTO OU MANUAL TÉCNICO]

Gere um dataset sintético de 5 pares instrucionais:
1. Pergunta realista e desafiadora formulada pelo usuário.
2. Resposta detalhada, precisa e estritamente ancorada no documento.
3. Contexto e atributos taxonômicos para fine-tuning supervisionado (SFT)."""
    }
]


async def fetch_github_topic_skills(topic: str = "ai-agents", min_stars: int = 500) -> List[Dict[str, Any]]:
    """Consulta repositórios públicos dinamicamente na API do GitHub garantindo unicidade."""
    url = f"https://api.github.com/search/repositories?q=topic:{topic}+stars:>={min_stars}&sort=stars&order=desc&per_page=15"
    skills = []
    
    try:
        def _fetch():
            return requests.get(url, headers=get_github_headers(), timeout=15)
            
        res = await asyncio.to_thread(_fetch)
        if res.status_code == 200:
            data = res.json()
            for item in data.get("items", []):
                repo = item.get("full_name", "")
                if not repo or repo in EXCLUDED_REPOS or "prompts.chat" in repo or "awesome-chatgpt-prompts" in repo:
                    continue
                
                title = item.get("name", "").replace("-", " ").replace("_", " ").title()
                desc = item.get("description") or f"Repositório oficial {repo} com alta pontuação no GitHub."
                stars = item.get("stargazers_count", 0)
                github_url = item.get("html_url", f"https://github.com/{repo}")
                author = item.get("owner", {}).get("login", "")
                tags = item.get("topics", [])
                category = detect_category(title, desc, tags)
                target_ais = detect_target_ais(title, desc, "", tags)
                
                skills.append({
                    "title": title,
                    "category": category,
                    "kind": "GitHub Repo",
                    "level": "Intermediário",
                    "github_stars": stars,
                    "github_repo": repo,
                    "github_url": github_url,
                    "author": author,
                    "source": "github",
                    "target_ais": target_ais,
                    "tags": tags[:5] + ["github-top"],
                    "description": desc,
                    "command": f"Consulte e utilize os recursos do repositório oficial {repo} ({github_url}) com {stars:,} estrelas no GitHub para executar sua tarefa.\n\nDescrição: {desc}"
                })
        else:
            logger.warning(f"GitHub API retornou status {res.status_code}: {res.text[:100]}")
    except Exception as e:
        logger.warning(f"Não foi possível consultar a API do GitHub: {e}")
        
    return skills


async def get_all_top_github_skills() -> List[Dict[str, Any]]:
    """Retorna lista de skills onde cada item tem um repositório GitHub público ÚNICO."""
    all_skills = []
    seen_repos = set(EXCLUDED_REPOS)
    
    # 1. Adiciona catálogo curado garantindo que cada repo seja único
    for skill in TOP_GITHUB_CURATED_SKILLS:
        repo = skill.get("github_repo")
        if repo and repo not in seen_repos:
            all_skills.append(skill)
            seen_repos.add(repo)
    
    # 2. Tenta complementar dinamicamente com repositórios adicionais sem duplicatas
    try:
        dynamic_skills = await fetch_github_topic_skills("llm-tools", min_stars=500)
        for ds in dynamic_skills:
            repo = ds.get("github_repo")
            if repo and repo not in seen_repos:
                all_skills.append(ds)
                seen_repos.add(repo)
    except Exception as e:
        logger.info(f"Usando catálogo curado de skills do GitHub: {e}")
        
    all_skills.sort(key=lambda x: x.get("github_stars", 0), reverse=True)
    return all_skills
