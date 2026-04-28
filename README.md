<<<<<<< HEAD
<<<<<<< HEAD
# S4S Chamados 
=======
# 🎫 Chamados Tecmise
>>>>>>> 980b592 (sua mensagem)

Plataforma moderna de gestão de chamados técnicos educacionais com interface SaaS premium, painel Kanban interativo e backend com persistência em MongoDB Atlas.

---

## 🌟 Características

- ✅ **Dashboard Intuitivo** — Métricas em tempo real e visão geral do sistema
- ✅ **Kanban Interativo** — Gerenciamento visual com drag and drop (admin)
- ✅ **Cards Detalhados** — Informações completas de cada chamado com progresso do checklist
- ✅ **Checklist de Atendimento** — Acompanhamento de tarefas para resolução
- ✅ **Upload de Imagens** — Anexar e visualizar imagens dos problemas
- ✅ **Filtros e Busca** — Organize eficientemente os chamados
- ✅ **Sistema de Notificações** — Notificações em tempo real por usuário
- ✅ **Relatório Mensal** — Contagem automática de chamados por mês com observações
- ✅ **Arquivo de Chamados** — Chamados resolvidos são arquivados com auto-limpeza (14 dias)
- ✅ **Autenticação JWT** — Login seguro com tokens de 7 dias
- ✅ **Controle de Permissões** — Admin, operadores e usuário de visualização
- ✅ **Design Premium** — Interface dark moderna com verde claro como cor principal
- ✅ **Responsividade** — Funciona perfeitamente em mobile e desktop
- ✅ **Polling em Tempo Real** — Sincronização a cada 5 segundos entre abas/usuários

---

## 🛠 Stack Tecnológico

### Frontend

| Dependência              | Versão Instalada |
|--------------------------|------------------|
| React                    | 18.3.1           |
| React DOM                | 18.3.1           |
| Zustand (State Manager)  | 4.5.7            |
| @dnd-kit/core            | 6.3.1            |
| @dnd-kit/sortable        | 7.0.2            |
| @dnd-kit/utilities       | 3.2.2            |
| Lucide React (Ícones)    | 0.294.0          |

### Frontend — Dev Dependencies

| Dependência              | Versão Instalada |
|--------------------------|------------------|
| Vite                     | 5.4.21           |
| @vitejs/plugin-react     | 4.7.0            |
| Tailwind CSS             | 3.4.19           |
| PostCSS                  | 8.5.10           |
| Autoprefixer             | 10.5.0           |

### Backend

| Dependência              | Versão Instalada |
|--------------------------|------------------|
| Express                  | 4.22.1           |
| CORS                     | 2.8.6            |
| dotenv                   | 16.6.1           |
| JSON Web Token (JWT)     | 9.0.3            |
| MongoDB Driver           | 6.21.0           |
| Morgan (HTTP Logger)     | 1.10.1           |

### Runtime

| Requisito                | Versão           |
|--------------------------|------------------|
| Node.js                  | >= 18.x (atual: 22.22.2) |

---

## 📁 Estrutura do Projeto

```
chamado_tecmise/
├── index.html                 # Entry point HTML
├── package.json               # Dependências do frontend
├── vite.config.js             # Configuração do Vite (porta 3000)
├── tailwind.config.js         # Design system (cores, espaçamento)
├── postcss.config.js          # PostCSS + Tailwind + Autoprefixer
├── vercel.json                # Deploy config (Vercel)
├── .env.production            # URL da API em produção
├── .gitignore
│
├── src/                       # Código-fonte do frontend
│   ├── main.jsx               # Bootstrap React
│   ├── App.jsx                # App principal (rotas internas)
│   ├── index.css              # Estilos globais
│   │
│   ├── components/
│   │   ├── Login.jsx               # Tela de login premium
│   │   ├── Header.jsx              # Header com busca e ações
│   │   ├── Sidebar.jsx             # Navegação lateral colapsável
│   │   ├── Dashboard.jsx           # Métricas e estatísticas
│   │   ├── Kanban.jsx              # Board Kanban com drag & drop
│   │   ├── TicketCard.jsx          # Card individual do chamado
│   │   ├── TicketDetailsModal.jsx  # Modal de detalhes completo
│   │   ├── CreateTicketModal.jsx   # Modal de criação de chamado
│   │   ├── ChecklistSelectorModal.jsx # Seletor de checklist
│   │   ├── ArchivedTickets.jsx     # Visualização de arquivados
│   │   ├── MonthlyReport.jsx       # Relatório mensal
│   │   ├── NotificationCenter.jsx  # Centro de notificações
│   │   ├── NotificationsPanel.jsx  # Painel de notificações
│   │   └── FilterBar.jsx           # Barra de filtros
│   │
│   ├── stores/
│   │   ├── authStore.js        # Estado de autenticação (Zustand)
│   │   └── ticketsStore.js     # Estado dos chamados (Zustand)
│   │
│   └── services/
│       └── api.js              # Cliente HTTP com Bearer Token
│
├── backend/                   # API REST (Express)
│   ├── package.json           # Dependências do backend
│   ├── .env                   # Variáveis de ambiente (local)
│   ├── .env.example           # Template de variáveis
│   │
│   └── src/
│       ├── server.js           # Entry point (listen)
│       ├── app.js              # Express app (middlewares + rotas)
│       │
│       ├── middleware/
│       │   └── auth.js         # JWT verify, adminOnly, viewOnlyBlock
│       │
│       ├── routes/
│       │   ├── auth.js         # POST /login, GET /me, GET /users
│       │   ├── tickets.js      # CRUD de chamados + checklist
│       │   ├── notifications.js # GET/POST notificações
│       │   ├── reports.js      # Relatório mensal (CRUD observações)
│       │   └── health.js       # Health check
│       │
│       ├── services/
│       │   └── memoryStore.js  # Camada de dados (MongoDB + JSON fallback)
│       │
│       └── data/
│           ├── mockData.js     # Dados iniciais (usuários, status, tickets)
│           └── store.json      # Persistência local (gerado em runtime)
│
└── dist/                      # Build de produção (gerado)
```

---

## 🚀 Como Começar

### Pré-requisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB Atlas** (opcional — sem ele, usa arquivo JSON local)

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd chamado_tecmise

# Instalar dependências do frontend
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..
```

### Variáveis de Ambiente

Crie o arquivo `backend/.env` baseado no template:

```bash
cp backend/.env.example backend/.env
```

```env
PORT=4000
JWT_SECRET=s4s-chamados-dev-secret-change-me
CORS_ORIGIN=http://localhost:3000,https://chamdo-tecmise.vercel.app

# MongoDB Atlas — deixe vazio para fallback em arquivo JSON local
# Obtenha sua connection string em: https://cloud.mongodb.com
MONGODB_URI=
```

### Desenvolvimento

```bash
# Terminal 1 — Backend (porta 4000)
cd backend
npm run dev

# Terminal 2 — Frontend (porta 3000)
npm run dev
```

A aplicação abrirá em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:4000/api`

### Autenticação

| Método | Rota            | Descrição               | Auth |
|--------|-----------------|-------------------------|------|
| POST   | `/auth/login`   | Login (email + senha)   | ❌   |
| GET    | `/auth/me`      | Dados do usuário logado | ✅   |
| GET    | `/auth/users`   | Lista de usuários       | ❌   |

### Chamados (Tickets)

| Método | Rota                              | Descrição                     | Auth   |
|--------|-----------------------------------|-------------------------------|--------|
| GET    | `/tickets`                        | Listar chamados               | ✅     |
| GET    | `/tickets/grouped`                | Chamados agrupados por status | ✅     |
| GET    | `/tickets/stats`                  | Estatísticas gerais           | ✅     |
| GET    | `/tickets/:id`                    | Detalhes de um chamado        | ✅     |
| POST   | `/tickets`                        | Criar chamado                 | ✅     |
| PATCH  | `/tickets/:id`                    | Atualizar chamado             | ✅     |
| POST   | `/tickets/:id/move`               | Mover status                  | ✅     |
| POST   | `/tickets/:id/checklist`          | Adicionar item ao checklist   | 🔒 Admin |
| PATCH  | `/tickets/:id/checklist/:itemId`  | Toggle item do checklist      | 🔒 Admin |
| DELETE | `/tickets/:id`                    | Deletar chamado               | 🔒 Admin |

### Notificações

| Método | Rota               | Descrição                  | Auth |
|--------|---------------------|----------------------------|------|
| GET    | `/notifications`    | Consumir notificações      | ✅   |
| POST   | `/notifications`    | Criar notificação          | ✅   |

### Relatórios

| Método | Rota                                          | Descrição                  | Auth     |
|--------|-----------------------------------------------|----------------------------|----------|
| GET    | `/reports/monthly?month=X&year=Y`             | Relatório do mês           | ✅       |
| POST   | `/reports/monthly`                            | Adicionar observação       | 🔒 Admin |
| PUT    | `/reports/monthly/:month/:year/:obsId`        | Editar observação          | 🔒 Admin |
| DELETE | `/reports/monthly/:month/:year/:obsId`        | Deletar observação         | 🔒 Admin |

### Health

| Método | Rota      | Descrição     | Auth |
|--------|-----------|---------------|------|
| GET    | `/health` | Health check  | ❌   |

---

## 👥 Usuários do Sistema

| Nome     | Email             | Cargo         | Permissões                    |
|----------|-------------------|---------------|-------------------------------|
| Ruan     | ruan@s4s.com      | Admin         | Full access, drag & drop, CRUD |
| Ana      | ana@s4s.com       | Psicóloga     | Criar/editar chamados         |
| Carol    | carol@s4s.com     | Psicóloga     | Criar/editar chamados         |
| Beatriz  | beatriz@s4s.com   | Pedagoga      | Criar/editar chamados         |
| Jessica  | jessica@s4s.com   | Pedagoga      | Criar/editar chamados         |
| Gabi     | gabi@s4s.com      | Pedagoga      | Criar/editar chamados         |
| Tecmise  | tecmise@s4s.com   | Visualização  | Somente leitura               |

> ⚠️ As senhas estão definidas no arquivo `backend/src/data/mockData.js`

---

## 📊 Funcionalidades Detalhadas

### Dashboard
- Total de chamados ativos
- Chamados em andamento
- Chamados resolvidos
- Chamados pendentes
- Distribuição por responsável

### Kanban Board
Organize chamados em 7 colunas:
1. **Sem status** — Chamados novos
2. **Recebido** — Chamado recebido pela equipe
3. **Em análise** — Em investigação
4. **Aguardando escola** — Pendente de resposta da escola
5. **Reprocessando** — Sendo reprocessado
6. **Em resolução** — Solução em andamento
7. **Resolvido** — Finalizado (pode ser arquivado)

### Criar Chamado
- Seleção de escola predefinida com dispositivos associados
- Defina turma e período (Matutino/Vespertino)
- Tipo de problema e descrição
- Responsável e prioridade (Baixa, Média, Alta)
- Upload de múltiplas imagens com preview

### Detalhes do Chamado
- Informações completas do chamado
- Checklist de atendimento com barra de progresso
- Comentários com notificação ao criador
- Galeria de anexos
- Histórico de ações

### Relatório Mensal
- Contagem persistente de chamados abertos no mês
- Observações mensais (CRUD admin-only)
- Contagem não reseta ao deletar chamados

### Arquivamento
- Chamados resolvidos podem ser arquivados
- Auto-limpeza após 14 dias
- Visualização separada dos arquivados

### Notificações
- Notificação ao admin quando um chamado é criado
- Notificação ao criador quando seu chamado é resolvido
- Notificação ao criador quando recebe um comentário
- Sistema de consumo (uma vez exibida, é removida)

---

## 🏗 Arquitetura

### Persistência de Dados

O backend usa uma camada de persistência dual:

1. **MongoDB Atlas** (produção) — Armazena todo o estado em um documento único (`app_state`)
2. **JSON File** (fallback local) — `backend/src/data/store.json` para desenvolvimento sem MongoDB

**Prioridade de carregamento:** MongoDB → JSON File → Mock Data

### Autenticação

- **JWT** com expiração de 7 dias
- Token armazenado no `localStorage` do navegador
- Middleware `authRequired` valida em todas as rotas protegidas
- Middleware `adminOnly` restringe ações de admin (checklist, delete)
- Middleware `viewOnlyBlock` bloqueia escrita para usuários de visualização

### Sincronização

- Frontend faz polling a cada **5 segundos** para manter dados sincronizados entre múltiplos usuários/abas
- Toda mutação no backend dispara `persistState()` que salva em MongoDB + JSON simultaneamente

---

## 🎨 Design System

### Cores
- **Primary**: Verde claro (`#86efac` / `#22c55e` / `#16a34a`)
- **Background**: Dark (`#111827` → `#0a0e27`)
- **Surfaces**: `#1f2937` / `#2d3748`
- **Borders**: Dark com transparência

### Componentes
- Cards com glassmorphism e bordas arredondadas
- Modais de confirmação premium (exclusão, arquivamento, logout)
- Animações suaves e transições
- Feedback visual claro (hover, active, loading)
- Ícones da Lucide React

---

## 📱 Responsividade

- Mobile-first approach
- Sidebar colapsável em mobile
- Kanban com scroll horizontal em telas pequenas
- Grid adaptável no dashboard

---

## 🐳 Docker (Preparado)

O projeto está estruturado para containerização:

- **Frontend**: Build estático via `vite build` → servir com nginx
- **Backend**: Node.js com Express → porta 4000
- **Banco**: MongoDB Atlas (externo) ou MongoDB container

Variáveis necessárias para Docker:
```env
# Backend
PORT=4000
JWT_SECRET=<sua-secret-segura>
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/s4s_chamados

# Frontend (build time)
VITE_API_URL=http://localhost:4000/api
```

---

## ☁️ Deploy

### Produção Atual
- **Frontend**: Vercel (`chamdo-tecmise.vercel.app`)
- **Backend**: Render (`chamado-tecmise.onrender.com`)
- **Banco**: MongoDB Atlas

---

## 📝 Licença

Desenvolvido em 2024–2026 — Chamados Tecmise © Todos os direitos reservados.

---

Desenvolvido com ❤️ para excelência em UX/UI e performance 🚀
=======
# 🤖 ProjectBIA — Designer Automatizado para Redes Sociais

Bot do Discord que usa **ChatGPT + DALL-E 3** para criar designs profissionais para Instagram.
Funciona como um **designer fixo da sua empresa**, mantendo identidade visual consistente.

---

## 📋 O que faz

- 🎨 Gera designs de Instagram (1080x1080) via DALL-E 3
- 🧠 Usa ChatGPT para criar prompts inteligentes baseados na identidade da marca
- 🖼️ Analisa referências visuais com GPT-4o Vision
- 🔁 Sistema de feedback iterativo (o design **evolui**, não reinicia)
- ✅ Aprovação final para encerrar o processo

---

## ⚡ Setup Rápido

### 1️⃣ Criar Bot no Discord

1. Acesse: **https://discord.com/developers/applications**
2. Clique **"New Application"** → Dê o nome **"BIA Designer"**
3. Vá em **"Bot"** no menu lateral
4. Clique **"Reset Token"** → **Copie o token** (você vai precisar)
5. Em **"Privileged Gateway Intents"**: Ative `MESSAGE CONTENT INTENT`
6. Vá em **"OAuth2" → "URL Generator"**:
   - Em **Scopes**: marque `bot` e `applications.commands`
   - Em **Bot Permissions**: marque `Send Messages`, `Embed Links`, `Attach Files`, `Use Slash Commands`
7. Copie a URL gerada e abra no navegador para **convidar o bot ao seu servidor**

📌 **O que copiar:**
- **Token do Bot** → vai no `.env` como `DISCORD_TOKEN`
- **Application ID** (na aba "General Information") → vai no `.env` como `DISCORD_CLIENT_ID`

---

### 2️⃣ Pegar API Key da OpenAI

1. Acesse: **https://platform.openai.com/api-keys**
2. Faça login (precisa de conta na OpenAI)
3. Clique **"Create new secret key"**
4. **Copie a chave** (ela só aparece uma vez!)
5. **⚠️ IMPORTANTE:** Você precisa ter créditos na conta da OpenAI:
   - Acesse: **https://platform.openai.com/settings/organization/billing/overview**
   - Adicione créditos (mínimo ~$5 para começar)
   - O DALL-E 3 custa ~$0.04 por imagem HD (1024x1024)
   - O GPT-4o custa ~$0.01-0.03 por request

📌 **O que copiar:**
- **API Key** → vai no `.env` como `OPENAI_API_KEY`

---

### 3️⃣ Configurar o `.env`

Abra o arquivo `.env` na raiz do projeto e preencha:

```env
# 🤖 DISCORD
DISCORD_TOKEN=cola_o_token_do_bot_aqui
DISCORD_CLIENT_ID=cola_o_application_id_aqui

# 🧠 OPENAI
OPENAI_API_KEY=cola_a_api_key_aqui

# 🏢 EMPRESA (personalize com os dados da SUA empresa)
EMPRESA_NOME=Minha Empresa
EMPRESA_DESCRICAO=Vendemos produtos digitais de alta qualidade
EMPRESA_PUBLICO=Jovens empreendedores de 18 a 35 anos
EMPRESA_TOM=moderno, premium, jovem
EMPRESA_CORES=Azul escuro (#1a1a2e), Dourado (#e2b714), Branco (#ffffff)
EMPRESA_ESTILO=elegante e minimalista
EMPRESA_OBJETIVO=vendas e engajamento
```

---

### 4️⃣ Rodar o Bot

```bash
npm start
# ou com auto-reload durante desenvolvimento:
npm run dev
```

Quando estiver conectado, verá:
```
🤖 BIA Designer está ONLINE!
📛 Logado como: BIA Designer#1234
🏢 Empresa: Minha Empresa
```

---

## 🎮 Comandos do Discord

| Comando | Descrição |
|---------|-----------|
| `/referencia` | 🖼️ Envia imagem de referência (o bot analisa e usa como base) |
| `/criar` | 🎨 Inicia novo design com ideia, tipo e mensagem |
| `/feedback` | 🔄 Envia feedback para melhorar o design |
| `/refazer` | 🔁 Gera nova variação criativa |
| `/aprovar` | ✅ Aprova o design final |
| `/status` | 📊 Mostra sessão ativa |
| `/cancelar` | 🛑 Cancela a sessão |
| `/perfil` | 🏢 Mostra perfil da empresa |
| `/ajuda` | ❓ Lista todos os comandos |

---

## 🔁 Fluxo de Trabalho

```
1. /referencia (opcional) → Envia imagens de inspiração
2. /criar → Gera primeiro design
3. /feedback → "mais moderno, cores mais fortes"
4. /feedback → "adorei, mas diminui o texto"
5. /aprovar → Design final ✅
```

O design **evolui** a cada feedback. Nunca reinicia do zero.

---

## 📂 Estrutura do Projeto

```
projectbia/
├── .env                          ← ⚠️ SUAS API KEYS (nunca commitar!)
├── .env.example                  ← Modelo de referência
├── package.json
├── README.md
└── src/
    ├── bot.js                    ← 🤖 Entry point do bot
    ├── config/
    │   ├── empresa.js            ← 🏢 Perfil da empresa
    │   └── prompts.js            ← 🧠 System prompts do ChatGPT
    ├── services/
    │   ├── openai.js             ← 🧠 ChatGPT + DALL-E + Vision
    │   └── sessaoDesign.js       ← 🔁 Gerenciador de sessões
    └── commands/
        ├── register.js           ← 📋 Registro dos slash commands
        ├── criar.js              ← 🎨 Handler: /criar
        ├── feedback.js           ← 🔄 Handler: /feedback
        └── handlers.js           ← ✅🔁🖼️📊🛑🏢❓ Outros handlers
```

---

## 💰 Custos Estimados (OpenAI)

| Operação | Custo Aprox. |
|----------|-------------|
| Gerar 1 imagem (DALL-E 3 HD) | ~$0.04 |
| ChatGPT request (GPT-4o) | ~$0.01-0.03 |
| Análise de referência (Vision) | ~$0.01-0.02 |
| **1 design completo (criar)** | **~$0.08-0.10** |
| **1 iteração (feedback)** | **~$0.06-0.08** |

Com $5 de crédito você faz ~50-60 designs.

---

## ❗ Precisa de Email/Conta?

| Serviço | Precisa de conta? | Link |
|---------|------------------|------|
| Discord Developer | ✅ Conta Discord | https://discord.com/developers |
| OpenAI API | ✅ Conta OpenAI + cartão de crédito | https://platform.openai.com |

---

## 🛠️ Troubleshooting

- **"Token inválido"** → Regenere o token no Discord Developer Portal
- **"Insufficient quota"** → Adicione créditos na OpenAI
- **"Commands not showing"** → Espere ~1h ou re-convide o bot com as permissões corretas
- **"Cannot read properties"** → Verifique se o `.env` está preenchido corretamente
>>>>>>> 2a33665 (Primeiro commit)
