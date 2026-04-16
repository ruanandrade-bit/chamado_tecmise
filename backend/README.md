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
- `JWT_SECRET`: segredo do token JWT
- `CORS_ORIGIN`: origens permitidas, separadas por vírgula

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
- `GET /api/notifications`
- `POST /api/notifications`

## Observação importante

Como está em memória, ao reiniciar o servidor os dados voltam para os mocks iniciais.
