# S4S Chamados — CLAUDE.md

## Regras absolutas

- **Nunca execute comandos git.** O repositório está vinculado a outra conta. Só mexa em arquivos de código.
- Não crie arquivos de documentação (`.md`) além deste, a menos que explicitamente pedido.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Estilo | Tailwind CSS + CSS externos por componente |
| Estado | Zustand (`authStore`, `kanbanStore`, `ticketsStore`) |
| Drag & Drop | @dnd-kit |
| Ícones | lucide-react |
| Backend | Express / Node.js (em `backend/`) |
| Banco | MongoDB Atlas |
| Deploy | Docker + Nginx + Vercel |

---

## Arquitetura de CSS

Quatro abordagens coexistem — respeite a hierarquia:

1. **Tailwind** — layout, spacing, flex/grid genérico
2. **`.css` externo por componente** — toda estilização específica do componente
3. **`style={{}}`** — **apenas** valores calculados em runtime (animationDelay, cores vindas de dados, etc.)
4. **`style={{}}` estático** — proibido; mover para o `.css` do componente

Ao criar ou editar um componente, o arquivo `.css` deve estar em `src/components/NomeDoComponente.css` e importado na primeira linha de imports locais do JSX.

### Prefixos BEM por componente

| Componente | Prefixo |
|---|---|
| Kanban | `.kb-*` |
| ArchivedTickets | `.arc-*` |
| ResolvedKanban | `.rk-*` |
| DevicesOnline | `.dvo-*` |
| Inventory | `.inv-*` |
| CameraObstruction | `.cob-*` |
| MonthlyReport | `.mr-*` |
| SchoolConfig | `.sc-*` / `.psr-*` |
| CreateTicketModal | `.ctm-*` |
| NotificationCenter | `.nc-*` |
| TicketCard | `.tc-*` |
| Dashboard | `.dash-*` |
| Login | `.login-*` |
| PedagogicalKanban | `.pk-*` |
| Deadlines | `.dl-*` |
| Notes | `.notes-*` |
| Children | `.ch-*` |

Novos componentes devem receber prefixo próprio de 2–4 letras para evitar colisão.

---

## Design tokens (src/index.css — :root)

**Nunca escreva hex codes diretamente nos arquivos `.css`.** Use sempre as variáveis:

```css
/* Verde (marca) */
var(--green-300)   /* #86efac */
var(--green-500)   /* #22c55e */
var(--green-600)   /* #16a34a */

/* Estado */
var(--red-400)     /* #f87171 */
var(--red-300)     /* #fca5a5 */
var(--violet-400)  /* #a78bfa */
var(--amber-400)   /* #fbbf24 */
var(--blue-400)    /* #60a5fa */
var(--blue-300)    /* #93c5fd */

/* Neutros */
var(--gray-100) … var(--gray-600)
var(--slate-50) var(--slate-300) var(--slate-400) var(--slate-500)
var(--bg-card)     /* #1e2235 */

/* Canais RGB — use dentro de rgba() */
rgba(var(--rgb-green), 0.1)
rgba(var(--rgb-green-300), 0.2)
rgba(var(--rgb-red), 0.15)
rgba(var(--rgb-violet), 0.15)
rgba(var(--rgb-blue), 0.1)
rgba(var(--rgb-white), 0.06)
rgba(var(--rgb-dark), 0.55)
rgba(var(--rgb-black), 0.2)

/* Z-index */
var(--z-dropdown)       /* 1000 */
var(--z-dropdown-inner) /* 1010 */
var(--z-sticky)         /* 1200 */
var(--z-panel)          /* 1300 */
var(--z-modal)          /* 9000 */
```

### Cor primária é verde, não emerald
`tailwind.config.js` define `primary.DEFAULT: #22c55e`. Não use classes `emerald-*` do Tailwind — use `primary` ou `green-*`.

---

## Utilitários compartilhados (src/index.css)

Para cabeçalhos de página, use as classes utilitárias já definidas:

```jsx
<div className="page-header">
  <div className="page-header-left">
    <div className="page-header-icon"> … </div>
    <div>
      <h1 className="page-title">Título</h1>
      <p className="page-sub">Subtítulo</p>
    </div>
  </div>
  <div className="page-header-right"> … </div>
</div>
```

---

## Estilos dinâmicos que devem permanecer como `style={{}}`

Estes valores são computados em runtime e **não devem ser movidos para CSS**:

- `animationDelay` calculado por índice (`index * 0.06 + 's'`)
- Cores vindas de configuração/dados (`ITEM_CONFIG`, `getPercentColor()`)
- CSS custom properties por elemento (`--cob-item-index`, `--ctm-option-index`, `--arc-option-index`)
- `zIndex: 'var(--z-modal)'` em overlays criados via `createPortal`

---

## Convenções de código

- Sem comentários explicando o que o código faz — nomes descritivos bastam
- Sem `console.log` de debug em produção
- Zustand stores em `src/stores/` — não criar estado global fora deles
- Chamadas de API sempre via `src/services/api.js`, nunca `fetch`/`axios` direto
- Ícones sempre de `lucide-react`
- Sem `any` implícito — manter tipos consistentes com o restante do arquivo
