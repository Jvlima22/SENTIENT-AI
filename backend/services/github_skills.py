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
    "Marketing": ["copy", "marketing", "content", "conteudo", "ad", "launch", "seo", "sales", "audience", "campaign", "social", "instagram", "reels", "feed", "branding", "design", "visual", "multimodal", "reader"],
    "Dados": ["data", "sql", "analytics", "dashboard", "insights", "metrics", "pandas", "spreadsheet", "excel", "planilha", "visualization", "bi", "scrap", "crawler", "crawl", "scraping", "realtime", "real-time", "rag", "retrieval", "vector"],
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
    },

    {
        "title": "Automação Visual de Processos (Activepieces)",
        "category": "Automação",
        "kind": "Workflow No-Code",
        "level": "Intermediário",
        "github_stars": 15000,
        "github_repo": "activepieces/activepieces",
        "github_url": "https://github.com/activepieces/activepieces",
        "author": "activepieces",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude"],
        "tags": ["automacao", "workflow", "no-code", "integracao", "webhook"],
        "description": "Converte processos repetitivos em fluxos visuais com gatilhos, ações, integrações, aprovações e tratamento de falhas.",
        "command": """Modele uma automação para [PROCESSO].
Gatilho: [EVENTO]. Sistemas envolvidos: [FERRAMENTAS]. Resultado: [RESULTADO].

Entregue o fluxo visual em etapas, payloads de entrada e saída, mapeamento de campos, validações, idempotência, retries, alertas, permissões e critérios de sucesso. Separe ações que exigem aprovação humana."""
    },
    {
        "title": "Agentes com Estado e Ferramentas (LangGraph)",
        "category": "Automação",
        "kind": "Orquestração de Agentes",
        "level": "Avançado",
        "github_stars": 22000,
        "github_repo": "langchain-ai/langgraph",
        "github_url": "https://github.com/langchain-ai/langgraph",
        "author": "langchain-ai",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "cursor"],
        "tags": ["automacao", "agentes", "workflow", "estado", "tool-calling"],
        "description": "Desenha agentes controláveis com estado, ferramentas, checkpoints, interrupções e supervisão humana para fluxos complexos.",
        "command": """Projete um grafo de agente para [OBJETIVO].
Entradas: [DADOS]. Ferramentas permitidas: [FERRAMENTAS]. Restrições: [REGRAS].

Defina nós, estado compartilhado, transições, condições de parada, validação de ferramentas, persistência, retries, observabilidade e pontos de aprovação humana. Inclua pseudocódigo executável e casos de erro."""
    },
    # --- DESIGN E CONTEÚDO (apresentados como skills normais em Marketing) ---
    {
        "title": "Direção de Arte e Layouts Digitais (Penpot)",
        "category": "Marketing",
        "kind": "Design de Conteúdo",
        "level": "Intermediário",
        "github_stars": 35000,
        "github_repo": "penpot/penpot",
        "github_url": "https://github.com/penpot/penpot",
        "author": "penpot",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "gemini"],
        "tags": ["design", "direcao-de-arte", "layout", "branding", "social"],
        "description": "Transforma objetivos de comunicação em direção visual, hierarquia, componentes e layouts consistentes para peças digitais.",
        "command": """Atue como diretor(a) de arte para conteúdo digital.\nBriefing: [OBJETIVO, PÚBLICO, OFERTA E CANAL]\n\nEntregue:\n1. Conceito visual e referência de direção.\n2. Hierarquia da informação, paleta, tipografia e sistema de espaçamento.\n3. Wireframe textual da peça e variações para feed, story e carrossel.\n4. Checklist de acessibilidade, legibilidade e consistência de marca."""
    },
    {
        "title": "Composição Visual para Posts e Carrosséis (Excalidraw)",
        "category": "Marketing",
        "kind": "Design de Conteúdo",
        "level": "Iniciante",
        "github_stars": 97000,
        "github_repo": "excalidraw/excalidraw",
        "github_url": "https://github.com/excalidraw/excalidraw",
        "author": "excalidraw",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "gemini"],
        "tags": ["design", "wireframe", "carrossel", "instagram", "social"],
        "description": "Planeja a composição de posts e carrosséis com wireframes simples, sequência narrativa e foco visual claro.",
        "command": """Crie o wireframe de um carrossel para Instagram sobre [TEMA].\nObjetivo: [OBJETIVO]. Público: [PÚBLICO]. Tom: [TOM].\n\nDefina para cada slide: título curto, mensagem principal, elemento visual, posição dos blocos, transição narrativa e CTA final. Mantenha uma ideia por slide e garanta leitura em tela pequena."""
    },
    {
        "title": "Planejamento Editorial para Feed Social (Postiz)",
        "category": "Marketing",
        "kind": "Conteúdo Social",
        "level": "Intermediário",
        "github_stars": 23000,
        "github_repo": "gitroomhq/postiz-app",
        "github_url": "https://github.com/gitroomhq/postiz-app",
        "author": "gitroomhq",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "gemini"],
        "tags": ["conteudo", "instagram", "feed", "calendario", "social"],
        "description": "Estrutura calendários editoriais e peças sociais com formatos, legendas, CTAs e variações adaptadas ao objetivo da marca.",
        "command": """Monte um calendário editorial de 30 dias para o feed do Instagram.\nNicho: [NICHO]. Oferta: [OFERTA]. Público: [PÚBLICO]. Objetivo: [OBJETIVO]. Frequência: [FREQUÊNCIA].\n\nPara cada publicação entregue: data, pilar, formato, ideia visual, gancho, legenda, CTA, hashtags e métrica de sucesso. Alterne educação, prova, relacionamento e conversão sem repetir ângulos."""
    },
    {
        "title": "Roteiros e Legendas com Voz de Marca (Dify)",
        "category": "Marketing",
        "kind": "Redação de Conteúdo",
        "level": "Intermediário",
        "github_stars": 75000,
        "github_repo": "langgenius/dify",
        "github_url": "https://github.com/langgenius/dify",
        "author": "langgenius",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "gemini"],
        "tags": ["texto", "copy", "legenda", "reels", "instagram"],
        "description": "Produz textos, roteiros e legendas consistentes com a voz de marca para diferentes formatos de conteúdo social.",
        "command": """Escreva 5 opções de legenda para [FORMATO] sobre [TEMA].\nVoz da marca: [ATRIBUTOS, PALAVRAS PREFERIDAS E RESTRIÇÕES]. Público: [PÚBLICO]. Objetivo: [OBJETIVO].\n\nCada opção deve ter gancho inicial, desenvolvimento escaneável, prova ou exemplo quando aplicável e CTA natural. Inclua uma versão curta, uma educativa e uma de conversão, sem promessas não verificadas."""
    },
    # --- SCRAPING E DADOS EM TEMPO REAL (apresentados como skills normais em Dados) ---
    {
        "title": "Coleta Web em Tempo Real com Crawlers (Crawl4AI)",
        "category": "Dados",
        "kind": "Scraping em Tempo Real",
        "level": "Avançado",
        "github_stars": 58000,
        "github_repo": "unclecode/crawl4ai",
        "github_url": "https://github.com/unclecode/crawl4ai",
        "author": "unclecode",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "perplexity"],
        "tags": ["scraping", "crawler", "tempo-real", "web", "dados"],
        "description": "Desenha crawlers assíncronos para extrair dados estruturados de páginas dinâmicas com rastreabilidade e controle de mudanças.",
        "command": """Projete um pipeline de coleta web em tempo real para [FONTES/URLS].\nDados necessários: [CAMPOS]. Frequência: [FREQUÊNCIA].\n\nEntregue arquitetura, estratégia de crawling respeitosa, seletores robustos, normalização do schema, deduplicação, retries com backoff, detecção de mudanças, logs, validações e limites de taxa. Não contorne autenticação, CAPTCHA ou regras de acesso."""
    },
    {
        "title": "Extração Estruturada de Sites (Firecrawl)",
        "category": "Dados",
        "kind": "Extração Web",
        "level": "Intermediário",
        "github_stars": 55000,
        "github_repo": "firecrawl/firecrawl",
        "github_url": "https://github.com/firecrawl/firecrawl",
        "author": "firecrawl",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "perplexity"],
        "tags": ["scraping", "extracao", "markdown", "web", "tempo-real"],
        "description": "Converte páginas web em Markdown ou dados estruturados para pesquisa, monitoramento e aplicações com IA.",
        "command": """Crie um plano de extração estruturada para [SITES/PÁGINAS].\nSchema de saída: [CAMPOS E TIPOS]. Uso: [RAG, MONITORAMENTO OU ANÁLISE].\n\nDefina escopo de URLs, regras de inclusão/exclusão, schema JSON, tratamento de páginas dinâmicas, validação de campos, atualização incremental, armazenamento do timestamp e verificação de fonte."""
    },
    {
        "title": "Pipelines de Scraping e Monitoramento (Scrapy)",
        "category": "Dados",
        "kind": "Pipeline de Dados",
        "level": "Avançado",
        "github_stars": 58000,
        "github_repo": "scrapy/scrapy",
        "github_url": "https://github.com/scrapy/scrapy",
        "author": "scrapy",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "cursor"],
        "tags": ["scraping", "scrapy", "pipeline", "dados", "crawler"],
        "description": "Planeja spiders e pipelines confiáveis para coleta, limpeza e persistência de dados públicos em escala.",
        "command": """Desenhe uma spider Scrapy para [DOMÍNIO E OBJETIVO].\nCampos: [CAMPOS]. Destino: [BANCO/ARQUIVO/API].\n\nForneça estrutura de itens, spider, paginação, pipelines de limpeza, validação, cache, retry, observabilidade, testes com fixtures e política de respeito a robots.txt e termos de uso."""
    },
    # --- PLANILHAS E EXCEL COM IA (apresentados como skills normais em Dados) ---
    {
        "title": "Análise de Planilhas com IA (PandasAI)",
        "category": "Dados",
        "kind": "Excel com IA",
        "level": "Intermediário",
        "github_stars": 21000,
        "github_repo": "sinaptik-ai/pandas-ai",
        "github_url": "https://github.com/sinaptik-ai/pandas-ai",
        "author": "sinaptik-ai",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude"],
        "tags": ["excel", "planilha", "pandas", "analise", "ia"],
        "description": "Transforma perguntas em linguagem natural em análises auditáveis de planilhas e DataFrames, com validação dos resultados.",
        "command": """Analise a planilha [NOME/ARQUIVO] como um analista de dados.\nObjetivo: [PERGUNTA DE NEGÓCIO]. Colunas: [DESCREVA AS COLUNAS].\n\nEntregue: limpeza necessária, métricas calculadas, código reproduzível, visualizações adequadas, achados com evidências, limitações e recomendações. Nunca invente linhas, colunas ou valores ausentes; sinalize ambiguidades."""
    },
    {
        "title": "Automação de Relatórios em Excel (Python)",
        "category": "Dados",
        "kind": "Automação de Planilhas",
        "level": "Intermediário",
        "github_stars": 36000,
        "github_repo": "pandas-dev/pandas",
        "github_url": "https://github.com/pandas-dev/pandas",
        "author": "pandas-dev",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "cursor"],
        "tags": ["excel", "xlsx", "planilha", "relatorio", "automacao"],
        "description": "Cria rotinas confiáveis para consolidar, validar e exportar relatórios Excel repetitivos com rastreabilidade.",
        "command": """Projete uma rotina Python para automatizar o relatório Excel [NOME].\nArquivos de entrada: [ARQUIVOS]. Abas e colunas: [ESTRUTURA]. Saída esperada: [RELATÓRIO].\n\nInclua ingestão, normalização, validação de tipos e duplicatas, regras de negócio, fórmulas ou tabelas agregadas, formatação, logs, tratamento de erros e um teste com dados de exemplo."""
    },

    # --- SKILLS ADICIONAIS CURADAS POR TEMA (skills normais) ---
    {
        "title": "Sistema de Design para Interfaces (UI UX Pro Max)",
        "category": "Marketing",
        "kind": "Design de Conteúdo",
        "level": "Avançado",
        "github_stars": 126327,
        "github_repo": "nextlevelbuilder/ui-ux-pro-max-skill",
        "github_url": "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill",
        "author": "nextlevelbuilder",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["design", "ui-ux", "paleta", "tipografia", "design-system"],
        "description": "Explora estilos, paletas, tipografia e diretrizes UX para criar interfaces e peças digitais consistentes.",
        "command": "Atue como especialista em UI/UX e direção visual usando o repositório UI UX Pro Max.\nBriefing: [OBJETIVO, PÚBLICO, CANAL E REFERÊNCIAS].\n\nEntregue: direção visual, estilo, paleta, tipografia, tokens, hierarquia, estados responsivos, critérios de acessibilidade e um checklist para evitar decisões genéricas ou AI-slop."
    },
    {
        "title": "Processo Completo de Design Visual (Designer Skills)",
        "category": "Marketing",
        "kind": "Design de Conteúdo",
        "level": "Avançado",
        "github_stars": 2593,
        "github_repo": "Owl-Listener/designer-skills",
        "github_url": "https://github.com/Owl-Listener/designer-skills",
        "author": "Owl-Listener",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["design", "design-system", "interacao", "critica-visual", "componentes"],
        "description": "Organiza UI design, design systems, interação e crítica visual em um processo reutilizável de criação e revisão.",
        "command": "Estruture o processo de design para [PEÇA OU INTERFACE].\n\nEntregue: grid, composição, cor, tipografia, tokens, componentes, estados, motion, acessibilidade e uma crítica visual objetiva com problemas, impacto, correções e critérios de aprovação."
    },
    {
        "title": "Copywriting e Copy-Editing para Conversão (Marketing Skills)",
        "category": "Marketing",
        "kind": "Copywriting",
        "level": "Avançado",
        "github_stars": 49167,
        "github_repo": "coreyhaines31/marketingskills",
        "github_url": "https://github.com/coreyhaines31/marketingskills",
        "author": "coreyhaines31",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "gemini"],
        "tags": ["texto", "copywriting", "copy-editing", "cta", "conversao"],
        "description": "Cria e revisa copy com contexto de público, oferta, objeções, benefícios, clareza, especificidade e CTAs.",
        "command": "Atue como copywriter e editor de conversão.\nContexto: [OFERTA, PÚBLICO, CANAL, OBJETIVO E PROVAS DISPONÍVEIS].\n\nEntregue: mensagem principal, benefícios verificáveis, estrutura por seção, headlines, CTA, objeções, alternativas de tom e revisão de clareza. Não invente métricas, depoimentos ou garantias."
    },
    {
        "title": "Copy para LinkedIn, Hooks e Repurposing",
        "category": "Marketing",
        "kind": "Conteúdo Social",
        "level": "Intermediário",
        "github_stars": 1418,
        "github_repo": "sergebulaev/linkedin-skills",
        "github_url": "https://github.com/sergebulaev/linkedin-skills",
        "author": "sergebulaev",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt"],
        "tags": ["copy", "social", "hooks", "linkedin", "repurposing"],
        "description": "Produz hooks, posts, comentários e adaptações de conteúdo com voz de marca e revisão humana.",
        "command": "Transforme o conteúdo abaixo em uma publicação social.\nFonte: [TEXTO, VÍDEO OU IDEIA]. Voz: [ATRIBUTOS]. Objetivo: [OBJETIVO].\n\nEntregue 5 hooks, 2 versões de post, CTA natural, versão curta e uma adaptação para outro canal. Preserve fatos, não invente autoridade e sinalize pontos que exigem revisão."
    },
    {
        "title": "Orquestração de QA e Automação de Testes",
        "category": "Automação",
        "kind": "Automação de Testes",
        "level": "Avançado",
        "github_stars": 233,
        "github_repo": "fugazi/test-automation-skills-agents",
        "github_url": "https://github.com/fugazi/test-automation-skills-agents",
        "author": "fugazi",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["automacao", "qa", "e2e", "api-testing", "playwright"],
        "description": "Planeja QA, testes de API, E2E, smoke, regressão, acessibilidade e investigação de flakiness.",
        "command": "Modele uma estratégia de testes para [SISTEMA].\nRiscos: [RISCOS]. Fluxos críticos: [FLUXOS]. Stack: [STACK].\n\nEntregue matriz de cobertura, cenários, dados isolados, seletores robustos, evidências, retries limitados, critérios de aprovação e plano de diagnóstico. Não esconda falhas com retries."
    },
    {
        "title": "Catálogo de Skills para QA Multicamadas",
        "category": "Automação",
        "kind": "Automação de Testes",
        "level": "Avançado",
        "github_stars": 116,
        "github_repo": "petrkindlmann/qa-skills",
        "github_url": "https://github.com/petrkindlmann/qa-skills",
        "author": "petrkindlmann",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["qa", "playwright", "cypress", "mobile", "ci-cd"],
        "description": "Seleciona playbooks de Playwright, Cypress, API, mobile, performance, acessibilidade, segurança e CI/CD.",
        "command": "Escolha a estratégia de QA adequada para [PROJETO E RISCO].\n\nEntregue uma seleção mínima de skills, ordem de execução, ambiente, fixtures, contratos, evidências, quality gates e plano de manutenção. Priorize testes determinísticos e explique o que não será automatizado."
    },
    {
        "title": "Automação Oficial de Navegadores com Playwright CLI",
        "category": "Automação",
        "kind": "Automação de Testes",
        "level": "Avançado",
        "github_stars": 13183,
        "github_repo": "microsoft/playwright-cli",
        "github_url": "https://github.com/microsoft/playwright-cli",
        "author": "microsoft",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["playwright", "browser", "e2e", "debug", "testing"],
        "description": "Estrutura automação, debugging, tracing, mocking e geração de testes Playwright para agentes de programação.",
        "command": "Planeje um fluxo Playwright para [SITE E FLUXO].\n\nEntregue comandos e teste reproduzível, seletores resilientes, estado de sessão seguro, mocks quando apropriado, tracing, evidências, tratamento de falhas e limpeza. Nunca contorne CAPTCHA ou controles de acesso."
    },
    {
        "title": "Skills de Navegação e Extração com BrowserAct",
        "category": "Dados",
        "kind": "Scraping em Tempo Real",
        "level": "Avançado",
        "github_stars": 5850,
        "github_repo": "browser-act/skills",
        "github_url": "https://github.com/browser-act/skills",
        "author": "browser-act",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "perplexity"],
        "tags": ["scraping", "browser", "extracao", "tempo-real", "skills"],
        "description": "Orienta automação de navegador, extração estruturada, sessões isoladas e criação de skills por site.",
        "command": "Projete uma coleta com navegador para [DOMÍNIOS E OBJETIVO].\n\nDefina URLs permitidas, campos, schema, sessão sem credenciais expostas, limites de taxa, evidências, deduplicação, timestamp, fallback e critérios de parada. Respeite robots.txt, termos e controles de acesso."
    },
    {
        "title": "Crawlers Node.js com Filas e Retry (Crawlee)",
        "category": "Dados",
        "kind": "Scraping em Tempo Real",
        "level": "Avançado",
        "github_stars": 25706,
        "github_repo": "apify/crawlee",
        "github_url": "https://github.com/apify/crawlee",
        "author": "apify",
        "source": "github",
        "target_ais": ["universal", "chatgpt", "claude", "cursor"],
        "tags": ["scraping", "crawler", "nodejs", "playwright", "pipeline"],
        "description": "Planeja crawlers com filas persistentes, deduplicação, retries, datasets e promoção controlada para navegador.",
        "command": "Desenhe um crawler Crawlee para [FONTES].\nCampos: [SCHEMA]. Frequência: [FREQUÊNCIA].\n\nEntregue RequestQueue, estratégia HTTP antes de browser, paginação, deduplicação, backoff, limites de taxa, dataset, freshness, logs e testes. Não contorne autenticação, CAPTCHA ou termos do site."
    },
    {
        "title": "Automação do Excel por MCP (ExcelMcp)",
        "category": "Dados",
        "kind": "Excel com IA",
        "level": "Avançado",
        "github_stars": 675,
        "github_repo": "sbroenne/mcp-server-excel",
        "github_url": "https://github.com/sbroenne/mcp-server-excel",
        "author": "sbroenne",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["excel", "mcp", "planilha", "formula", "vba"],
        "description": "Planeja operações controladas no Excel real, incluindo células, fórmulas, Power Query, DAX, VBA, gráficos e formatação.",
        "command": "Modele uma operação segura no Excel para [ARQUIVO E OBJETIVO].\n\nEntregue cópia de trabalho, allowlist de abas e caminhos, plano de leitura, alterações, validações, diff esperado e rollback. Peça aprovação antes de excluir ou sobrescrever dados e preserve o arquivo original."
    },
    {
        "title": "Servidor MCP para Workbooks e Tabelas Excel",
        "category": "Dados",
        "kind": "Excel com IA",
        "level": "Intermediário",
        "github_stars": 1022,
        "github_repo": "negokaz/excel-mcp-server",
        "github_url": "https://github.com/negokaz/excel-mcp-server",
        "author": "negokaz",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["excel", "mcp", "xlsx", "tabelas", "formatacao"],
        "description": "Estrutura leitura, escrita, criação de abas, tabelas e formatação de workbooks com escopo controlado.",
        "command": "Analise ou altere o workbook [ARQUIVO].\nObjetivo: [OBJETIVO]. Abas permitidas: [ABAS].\n\nEntregue plano de operações, schema de entrada/saída, validação de tipos, verificação de fórmulas, preservação de macros quando aplicável e relatório das mudanças."
    },
    {
        "title": "Transformação de Células com IA (=PROMPT)",
        "category": "Dados",
        "kind": "Excel com IA",
        "level": "Intermediário",
        "github_stars": 949,
        "github_repo": "getcellm/cellm",
        "github_url": "https://github.com/getcellm/cellm",
        "author": "getcellm",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt"],
        "tags": ["excel", "ia", "prompt", "classificacao", "limpeza"],
        "description": "Projeta transformações repetíveis de células para classificação, extração, limpeza, tradução e sumarização.",
        "command": "Crie uma transformação tabular segura para [INTERVALO].\nInstrução: [INSTRUÇÃO]. Exemplos válidos: [EXEMPLOS].\n\nDefina fórmula ou operação, critérios de consistência, tratamento de vazio, amostra de validação, limites de custo, revisão de resultados e rollback."
    },

    # --- TEXTO, DOCUMENTOS E ESCRITA (skills normais) ---
    {
        "title": "Documentação Técnica para Projetos (GitHub Copilot)",
        "category": "Desenvolvimento",
        "kind": "Documentação Técnica",
        "level": "Intermediário",
        "github_stars": 38800,
        "github_repo": "github/awesome-copilot",
        "github_url": "https://github.com/github/awesome-copilot/tree/main/skills/documentation-writer",
        "author": "github",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["documentacao", "markdown", "api", "guias", "github"],
        "description": "Cria documentação Markdown clara para módulos, funcionalidades, APIs, configurações e guias de uso.",
        "command": "Atue como redator técnico para [PROJETO OU FUNCIONALIDADE].\nPúblico: [PÚBLICO]. Contexto disponível: [CÓDIGO, API OU REQUISITOS].\n\nEntregue documentação Markdown com visão geral, pré-requisitos, instalação, uso, exemplos, parâmetros, erros comuns, limitações e próximos passos. Não invente comportamentos: marque informações que precisam ser confirmadas."
    },
    {
        "title": "Criação e Manutenção de Documentação Markdown (Documenso)",
        "category": "Produtividade",
        "kind": "Documentos",
        "level": "Intermediário",
        "github_stars": 14900,
        "github_repo": "documenso/documenso",
        "github_url": "https://github.com/documenso/documenso/tree/main/.agents/skills/create-documentation",
        "author": "documenso",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["documentos", "markdown", "documentacao", "modulos", "software"],
        "description": "Gera documentação estruturada em Markdown para módulos, recursos e configurações de software.",
        "command": "Crie ou atualize a documentação de [MÓDULO OU RECURSO].\nFontes de verdade: [CÓDIGO, TESTES, CONFIGURAÇÃO E DECISÕES].\n\nProduza Markdown com propósito, escopo, arquitetura ou fluxo, configuração, exemplos de entrada e saída, troubleshooting e referências. Diferencie fatos verificados de lacunas e mantenha a documentação sincronizada com o comportamento real."
    },
    {
        "title": "Escrita Científica, Relatórios e Citações Verificadas",
        "category": "Educação",
        "kind": "Escrita Científica",
        "level": "Avançado",
        "github_stars": 2320,
        "github_repo": "K-Dense-AI/claude-scientific-writer",
        "github_url": "https://github.com/K-Dense-AI/claude-scientific-writer",
        "author": "K-Dense-AI",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "perplexity"],
        "tags": ["relatorio", "pesquisa", "citacoes", "artigo", "latex"],
        "description": "Estrutura artigos, relatórios, revisões de literatura, propostas e documentos acadêmicos com pesquisa e citações verificáveis.",
        "command": "Produza um documento de pesquisa sobre [TEMA].\nFormato: [RELATÓRIO, ARTIGO, REVISÃO OU PROPOSTA]. Público: [PÚBLICO].\n\nEntregue pergunta e escopo, estrutura, síntese baseada em fontes, citações verificáveis, limitações, distinção entre evidência e inferência e bibliografia. Nunca fabrique referência, resultado ou DOI; registre o que não pôde ser verificado."
    },
    {
        "title": "Workflow Editorial Multiformato com Revisão",
        "category": "Marketing",
        "kind": "Produção de Conteúdo",
        "level": "Intermediário",
        "github_stars": 51,
        "github_repo": "sociilabs/claude-content-writer",
        "github_url": "https://github.com/sociilabs/claude-content-writer",
        "author": "sociilabs",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "gemini"],
        "tags": ["conteudo", "blog", "newsletter", "instagram", "seo"],
        "description": "Conduz criação de blog, posts, legendas, e-mails e páginas por etapas de briefing, plano, execução, verificação e entrega.",
        "command": "Crie conteúdo sobre [TEMA] para [CANAL].\nPúblico: [PÚBLICO]. Voz da marca: [ATRIBUTOS]. Objetivo: [OBJETIVO].\n\nSiga as etapas: discutir contexto, planejar estrutura e palavras-chave, escrever, verificar clareza/SEO/voz anti-genérica e entregar versão pronta. Gere variações para blog, feed, newsletter ou e-mail sem alterar os fatos."
    },
    {
        "title": "Conteúdo SEO e Edição Estratégica",
        "category": "Marketing",
        "kind": "Texto e SEO",
        "level": "Avançado",
        "github_stars": 0,
        "github_repo": "Yaroslavle/seo-content-writer-claude-skill",
        "github_url": "https://github.com/Yaroslavle/seo-content-writer-claude-skill",
        "author": "Yaroslavle",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt"],
        "tags": ["seo", "conteudo", "edicao", "palavras-chave", "briefing"],
        "description": "Transforma briefings em conteúdo SEO com estrutura editorial, intenção de busca, títulos, metadados e revisão de qualidade.",
        "command": "Planeje e escreva um conteúdo SEO sobre [TEMA].\nPalavra-chave principal: [PALAVRA]. Público: [PÚBLICO]. Objetivo: [OBJETIVO].\n\nEntregue intenção de busca, outline, título, meta description, subtítulos, conteúdo útil, links sugeridos, perguntas frequentes e checklist editorial. Evite keyword stuffing, promessas não comprovadas e texto genérico."
    },

    {
        "title": "Aprimoramento de Textos e Adaptação de Tom (UX Writing)",
        "category": "Marketing",
        "kind": "Edição de Texto",
        "level": "Intermediário",
        "github_stars": 164,
        "github_repo": "content-designer/ux-writing-skill",
        "github_url": "https://github.com/content-designer/ux-writing-skill",
        "author": "content-designer",
        "source": "github",
        "target_ais": ["universal", "claude", "chatgpt", "cursor"],
        "tags": ["texto", "copy-editing", "tom", "clareza", "ux-writing"],
        "description": "Reescreve e aprimora textos preservando a mensagem, com foco em clareza, concisão, tom de voz, acessibilidade e adaptação ao contexto.",
        "command": "Aprimore o texto abaixo sem alterar a mensagem principal.\nTexto original: [COLE O TEXTO]. Contexto: [CANAL, PÚBLICO E OBJETIVO]. Tom desejado: [PROFISSIONAL, DIRETO, AMIGÁVEL OU OUTRO].\n\nFaça passagens separadas de clareza, concisão, voz e tom, benefício, especificidade e acessibilidade. Entregue: versão revisada, versão mais curta, versão mais persuasiva quando fizer sentido e uma tabela breve com as principais mudanças. Preserve fatos, não invente provas e explique qualquer ambiguidade."
    },
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
    seen_repos = set(r.lower().strip() for r in EXCLUDED_REPOS if r)
    seen_titles = set()
    seen_urls = set()

    # 1. Adiciona catálogo curado garantindo unicidade absoluta por repositório, título e URL
    for skill in TOP_GITHUB_CURATED_SKILLS:
        repo = (skill.get("github_repo") or "").strip()
        repo_lower = repo.lower()
        title = (skill.get("title") or "").strip()
        title_lower = title.lower()
        url = (skill.get("github_url") or "").strip().lower()

        if not repo or repo_lower in seen_repos or (title_lower and title_lower in seen_titles) or (url and url in seen_urls):
            continue

        all_skills.append(skill)
        seen_repos.add(repo_lower)
        if title_lower:
            seen_titles.add(title_lower)
        if url:
            seen_urls.add(url)

    # 2. Tenta complementar dinamicamente apenas com repositórios adicionais não vistos
    try:
        dynamic_skills = await fetch_github_topic_skills("llm-tools", min_stars=500)
        for ds in dynamic_skills:
            repo = (ds.get("github_repo") or "").strip()
            repo_lower = repo.lower()
            title = (ds.get("title") or "").strip()
            title_lower = title.lower()
            url = (ds.get("github_url") or "").strip().lower()

            if not repo or repo_lower in seen_repos or (title_lower and title_lower in seen_titles) or (url and url in seen_urls):
                continue

            all_skills.append(ds)
            seen_repos.add(repo_lower)
            if title_lower:
                seen_titles.add(title_lower)
            if url:
                seen_urls.add(url)
    except Exception as e:
        logger.info(f"Usando catálogo curado de skills do GitHub: {e}")

    all_skills.sort(key=lambda x: x.get("github_stars", 0), reverse=True)
    return all_skills
