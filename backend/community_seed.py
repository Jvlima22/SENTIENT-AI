"""Materiais publicados automaticamente na comunidade. Hoje só o fluxo do vídeo do CNPJ.

O seed só cria o que ainda não existe: edições feitas no admin nunca são sobrescritas.
O arquivo .json do fluxo é enviado pelo admin depois da revisão (sem credenciais), e aí o status vira "ready".
"""

DOCKER_RUN = (
    "docker run -d --name n8n --restart unless-stopped -p 5678:5678 "
    "-e GENERIC_TIMEZONE=\"America/Sao_Paulo\" -e TZ=\"America/Sao_Paulo\" "
    "-v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n"
)

RESOURCES = [
    {
        "slug": "decisores", "title": "Encontre quem decide em qualquer empresa",
        "summary": "Digite o nome da empresa (o CNPJ é opcional): o fluxo acha o CNPJ, puxa os sócios, busca perfis no LinkedIn e o Claude ranqueia até 5 decisores.",
        "category": "Prospecção", "kind": "Fluxo", "level": "Intermediário", "status": "soon", "keyword": "CNPJ",
        "video_url": "/motion/fluxo-decisores-16x9.mp4", "video_vertical_url": "/motion/fluxo-decisores-9x16.mp4",
        "outcomes": ["Nome da empresa (CNPJ opcional)", "Sócios pelo CNPJ + perfis do LinkedIn", "Claude ranqueia até 5 decisores"],
        "requirements": (
            "- Um computador com Windows 10/11, macOS ou Linux e pelo menos 4 GB de memória livre\n"
            "- **Docker Desktop** (Windows e macOS) ou **Docker Engine** (Linux)\n"
            "- Uma conta no **Apify**, para as buscas no Google (ator *Google Search Scraper*)\n"
            "- Uma chave da **API da Anthropic**, para o Claude ranquear os decisores\n"
            "- O arquivo `.json` do fluxo, baixado no passo 3\n\n"
            "Os sócios vêm da **BrasilAPI**, que é pública e não precisa de chave."
        ),
        "costs": (
            "O n8n rodando no seu computador e a BrasilAPI são gratuitos. Por empresa, o fluxo faz **até 2 buscas no Apify** "
            "(uma para achar o CNPJ, que é pulada se você já informar o CNPJ, e outra para os perfis do LinkedIn) e **1 chamada ao Claude**. "
            "O Apify tem um plano gratuito com créditos mensais e a Anthropic cobra por uso, então teste com poucas empresas antes de rodar em lote."
        ),
        "body": (
            "Você vai rodar o **n8n no seu próprio computador**, dentro do Docker, e importar o fluxo que aparece no vídeo.\n\n"
            "Você informa o **nome da empresa** e, se tiver, o CNPJ. Sem CNPJ, o fluxo procura no Google. Com o CNPJ em mãos, "
            "ele puxa o **quadro de sócios** na BrasilAPI e, ao mesmo tempo, busca **perfis no LinkedIn** de quem trabalha na empresa. "
            "O **Claude** cruza as duas fontes e devolve até 5 possíveis decisores, com cargo, link do LinkedIn, motivo e nível de confiança.\n\n"
            "São cinco passos: instalar o Docker, instalar o n8n local, instalar o workflow, configurar as credenciais e testar. "
            "Da instalação do Docker até o primeiro resultado leva cerca de 20 minutos."
        ),
        # Cada passo começa com **Título.**: a página mostra um botão por passo e exibe só a descrição do passo escolhido.
        "steps": [
            "**Instalar o Docker.**\n\n"
            "1. No Windows e no macOS, baixe o Docker Desktop em [docker.com](https://www.docker.com/products/docker-desktop/) e instale com as opções padrão.\n"
            "2. No Windows, aceite ativar o **WSL 2** se o instalador pedir e reinicie o computador. No Linux, instale o Docker Engine pelo guia oficial da sua distribuição.\n"
            "3. Abra o Docker Desktop e espere o status ficar verde.\n\n"
            "Para conferir, abra o terminal (PowerShell no Windows) e rode:\n\n"
            "```bash\ndocker --version\n```\n\nSe aparecer a versão, está tudo certo.",

            "**Instalar o n8n local.**\n\n"
            "Crie o volume onde o n8n guarda seus dados. Assim fluxos e credenciais continuam salvos mesmo se o contêiner for recriado:\n\n"
            "```bash\ndocker volume create n8n_data\n```\n\n"
            "Suba o n8n. O comando baixa a imagem oficial, deixa o n8n rodando em segundo plano e reinicia sozinho quando o computador ligar:\n\n"
            f"```bash\n{DOCKER_RUN}\n```\n\n"
            "Na primeira vez o download leva alguns minutos. Para ver se subiu, rode `docker ps` e procure o contêiner `n8n`.\n\n"
            "Depois acesse [http://localhost:5678](http://localhost:5678) no navegador e cadastre o usuário dono. Essa conta fica só no seu computador.",

            "**Instalar o workflow.**\n\n"
            "Baixe o arquivo do fluxo:\n\n"
            "[[baixar-json]]\n\n"
            "1. No n8n, clique em **Create Workflow**.\n"
            "2. No menu **⋯** do canto superior direito, escolha **Import from File** e selecione o arquivo `decisores.json` que você baixou.\n\n"
            "Se preferir, use **Copiar fluxo**, clique no canvas vazio do n8n e cole com `Ctrl+V` (`Cmd+V` no macOS).",

            "**Configurar as credenciais.**\n\n"
            "O fluxo usa duas credenciais do tipo **Header Auth**. Os nós que precisam delas estão marcados com 🔑.\n\n"
            "**Apify:** copie seu token no Apify em **Settings → API & Integrations**. No n8n, abra o nó **Buscar CNPJ no Google 🔑**, "
            "em *Credential for Header Auth* escolha **Create New Credential** e preencha:\n\n"
            "- **Name:** `Authorization`\n- **Value:** `Bearer SEU_TOKEN_APIFY` (a palavra Bearer, um espaço e o token)\n\n"
            "Depois abra o nó **Perfis no LinkedIn (Google) 🔑** e selecione a mesma credencial.\n\n"
            "**Anthropic:** gere uma chave em **console.anthropic.com → API Keys**. Abra o nó **Claude ranqueia 🔑** e crie outra credencial Header Auth:\n\n"
            "- **Name:** `x-api-key`\n- **Value:** a sua chave\n\nNunca cole as chaves direto nos campos dos nós nem em prints.",

            "**Testar e manter rodando.**\n\n"
            "Abra o nó **Entrada** e preencha:\n\n"
            "- **empresa:** o nome da empresa (obrigatório)\n"
            "- **cnpj:** opcional. Com ele o fluxo pula a busca no Google e erra menos\n"
            "- **cargo_alvo:** quem você procura (já vem \"quem decide compra de software e automação\")\n"
            "- **modelo:** o modelo do Claude (já vem configurado)\n\n"
            "Clique em **Execute workflow**. O resultado sai no nó **Lista de decisores**: até 5 pessoas com nome, cargo, fonte "
            "(CNPJ, LinkedIn ou ambos), link do LinkedIn, motivo e confiança. Clique em **Save**.\n\n"
            "Para parar o n8n, use `docker stop n8n`; para ligar de novo, `docker start n8n`. Para atualizar para a versão mais nova:\n\n"
            "```bash\ndocker pull docker.n8n.io/n8nio/n8n\ndocker stop n8n\ndocker rm n8n\n```\n\n"
            "Depois rode de novo o comando `docker run` do passo 2. Seus dados continuam no volume `n8n_data`.",
        ],
        "troubleshooting": [
            {"problem": "O terminal diz que o comando docker não existe", "fix": "O Docker Desktop não está instalado ou não está aberto. Abra o Docker Desktop, espere o status ficar verde e abra um terminal novo."},
            {"problem": "Erro de porta 5678 já em uso", "fix": "Outro programa (ou um n8n antigo) está usando a porta. Rode `docker ps -a` para ver contêineres antigos e remova com `docker rm -f n8n`, ou troque para `-p 5679:5678` e acesse http://localhost:5679."},
            {"problem": "No Windows, o Docker não inicia e fala de WSL", "fix": "Abra o PowerShell como administrador, rode `wsl --update` e reinicie o computador. Depois abra o Docker Desktop de novo."},
            {"problem": "Erro 401 nos nós do Apify", "fix": "A credencial Header Auth do Apify precisa do nome `Authorization` e do valor `Bearer SEU_TOKEN`, com a palavra Bearer e um espaço antes do token. Confira também se os dois nós com 🔑 do Apify estão com a credencial selecionada."},
            {"problem": "Erro de autenticação no nó Claude ranqueia", "fix": "Confira se a credencial é do tipo Header Auth, com o nome `x-api-key` escrito exatamente assim, e se a chave está ativa e com créditos no console da Anthropic."},
            {"problem": "\"Não achei o CNPJ no Google\"", "fix": "A busca não encontrou o CNPJ pelo nome. Preencha o campo `cnpj` no nó **Entrada** e rode de novo."},
            {"problem": "O nó da BrasilAPI dá erro 404", "fix": "O CNPJ não existe ou foi digitado errado. Confira os 14 números. Se aparecer erro de limite, espere alguns minutos e tente de novo."},
            {"problem": "\"O Claude não devolveu uma lista\"", "fix": "Rode de novo: às vezes a resposta vem fora do formato. Se continuar, confira se o campo `modelo` no nó **Entrada** tem o nome de um modelo ativo na sua conta da Anthropic."},
            {"problem": "Perdi meus fluxos depois de recriar o contêiner", "fix": "O contêiner foi criado sem o volume. Use sempre `-v n8n_data:/home/node/.n8n` no comando do passo 2."},
        ],
        "version": "1.0",
    },
]
