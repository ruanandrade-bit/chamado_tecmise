# S4S Backend (Node.js)

Backend inicial em `Node.js + Express`, sem banco de dados (estado em memória).

## Rodar localmente

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API disponível em: `http://localhost:4000`

## Variáveis de ambiente

- `PORT`: porta do backend (padrão `4000`)
- `JWT_SECRET`: segredo do token JWT (mínimo 32 caracteres)
- `CORS_ORIGIN`: origens permitidas, separadas por vírgula
- `TAILSCALE_API_KEY`: chave da API do Tailscale (prefixo `tskey-api-...`) para tela Devices Online
- Alias aceitos: `TAILSCALE_API_TOKEN`, `TAILSCALE_ACCESS_TOKEN`, `TAILSCALE_TOKEN`, `TS_API_KEY`, `TAILSCALE_AUTHKEY`, `TS_AUTHKEY`
- `TAILSCALE_TAILNET`: tailnet para consulta da API (`-` usa a tailnet padrão da chave)

### Render (produção)

Se o log mostrar `JWT_SECRET ausente ou fraco`, o backend funciona, mas os tokens podem ser invalidados após reinício.

Defina uma chave forte no painel **Environment** do Render:

```bash
openssl rand -base64 48
```

Use o valor gerado em `JWT_SECRET`.

Fallback seguro:
- Se `JWT_SECRET` não estiver definido, o backend tenta derivar um segredo estável a partir de variáveis de infraestrutura (ex.: `MONGODB_URI` + metadados do Render).
- Isso evita sessão efêmera e reduz alertas em produção, mas o recomendado continua sendo definir `JWT_SECRET` explicitamente.

Se a tela **Devices Online** mostrar tudo offline/“não existe no Tailscale”, valide no Render:
- `TAILSCALE_API_KEY` configurada
- `TAILSCALE_TAILNET` correta (ou `-`)
- A chave precisa ser **API Access Token** (`tskey-api-...`), não `tskey-auth-...` nem `tskey-client-...`

## Endpoints principais

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/tickets`
- `GET /api/tickets/grouped`
- `GET /api/tickets/stats`
- `POST /api/tickets`
- `PATCH /api/tickets/:id`
- `POST /api/tickets/:id/move`
- `PATCH /api/tickets/:id/checklist/:itemId` (apenas admin)
- `POST /api/tickets/:id/checklist` (apenas admin)
- `GET /api/notifications` (`?since=ISO_DATE|timestamp&limit=50`)
- `POST /api/notifications`
- `GET /api/devices/status`
- `POST /api/devices/refresh`

## Observação importante

Como está em memória, ao reiniciar o servidor os dados voltam para os mocks iniciais.
