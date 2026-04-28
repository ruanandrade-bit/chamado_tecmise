# S4S Chamados 


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
