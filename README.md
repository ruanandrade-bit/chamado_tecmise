<<<<<<< HEAD
# S4S Chamados 

Uma plataforma moderna de gestão de chamados educacionais com interface SaaS premium.

## 🌟 Características

- ✅ **Dashboard Intuitivo**: Métricas em tempo real e visão geral do sistema
- ✅ **Kanban Interativo**: Gerenciamento visual com drag and drop
- ✅ **Cards Detalhados**: Informações completas de cada chamado com progresso do checklist
- ✅ **Checklist de Atendimento**: Acompanhamento de tarefas para resolução
- ✅ **Upload de Imagens**: Anexar e visualizar imagens dos problemas
- ✅ **Filtros e Busca**: Organize eficientemente os chamados
- ✅ **Design Premium**: Interface dark moderno com verde claro como cor principal
- ✅ **Responsividade**: Funciona perfeitamente em mobile e desktop

## 🛠 Stack Tecnológico

- **Frontend**: React 20
- **Estilização**: Tailwind CSS
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Build**: Vite
- **Ícones**: Lucide React

## 🚀 Como Começar

### Instalação

```bash
cd "Project C"
npm install
```

### Desenvolvimento

```bash
npm run dev
```

A aplicação abrirá em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

## 👥 Usuários de Teste

Todas as contas usam a senha: `123456`

- **Ana** (Psicóloga) - ana@s4s.com
- **Carol** (Psicóloga) - carol@s4s.com
- **Beatriz** (Pedagoga) - beatriz@s4s.com
- **Jessica** (Pedagoga) - jessica@s4s.com
- **Gabi** (Pedagoga) - gabi@s4s.com

## 📊 Funcionalidades Principais

### Dashboard
- Total de chamados
- Chamados em andamento
- Chamados resolvidos
- Chamados pendentes
- Distribuição por responsável

### Kanban Board
Organize chamados em 7 colunas:
- Sem status
- Recebido
- Em análise
- Aguardando escola
- Reprocessando
- Em resolução
- Resolvido

### Criar Chamado
- Selecione escola e turma
- Defina problema e descrição
- Atribua responsável
- Configure prioridade (Baixa, Média, Alta)
- Anexe múltiplas imagens com preview

### Detalhes do Chamado
- Informações completas
- Checklist de atendimento com progresso visual
- Adicione/conclua tarefas
- Visualize anexos em galeria
- Notas e histórico de ações

## 🎨 Design System

### Cores
- **Primary**: Verde claro (#86efac)
- **Background**: Dark (#111827-#0a0e27)
- **Borders**: Dark com transparência

### Componentes
- Cards com bordas arredondadas (rounded-xl+)
- Animações suaves e transições
- Feedback visual clara (hover, active, loading)
- Icons da Lucide React

## 📱 Responsividade

- Mobile-first approach
- Sidebar colapsável em mobile
- Kanban com scroll horizontal em telas pequenas
- Grid adaptável em dashboard

## 🔮 Pronto para Backend

A estrutura está pronta para integração com backend:
- Dados facilmente migráveis para API
- Zustand pronto para persistência
- Estrutura modular para expansão

## 📝 Licença

Desenvolvido em 2024 - S4S Chamados © Todos os direitos reservados.

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
