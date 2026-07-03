import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)
router.use(adminOnly)

function normalizeOwner(value) {
  return String(value || '').trim().toLowerCase()
}

function isCreatedByCurrentUser(item, user) {
  if (!item || !user) return false
  if (item.authorEmail) return normalizeOwner(item.authorEmail) === normalizeOwner(user.email)
  return normalizeOwner(item.author) === normalizeOwner(user.name)
}

// GET — return instantly from memory, trigger sync in the background
router.get('/', (_req, res) => {
  res.json(memoryStore.getDeadlines())
  memoryStore.refreshCollaborativeData().catch(() => {})
})

// POST — create deadline, persist in background (fast like tickets)
router.post('/', (req, res) => {
  const { title, description, date, time, category, status, priority, googleCalendarConfirmed, googleCalendarUser, googleCalendarGuest } = req.body
  const cleanTitle = String(title || '').trim()
  if (!cleanTitle) return res.status(400).json({ message: 'Título é obrigatório.' })
  if (cleanTitle.length > 200) return res.status(400).json({ message: 'Título não pode ultrapassar 200 caracteres.' })
  const cleanDesc = String(description || '').trim()
  if (cleanDesc.length > 2000) return res.status(400).json({ message: 'Descrição não pode ultrapassar 2000 caracteres.' })
  if (!date) return res.status(400).json({ message: 'Data é obrigatória.' })

  const d = {
    id: `DL-${crypto.randomBytes(4).toString('hex')}`,
    title: cleanTitle,
    description: cleanDesc,
    date,
    time: time || '',
    category: category || 'pedagoga',
    status: status || 'pendente',
    priority: priority || 'media',
    author: req.user?.name || 'Desconhecido',
    authorEmail: req.user?.email || '',
    googleCalendarConfirmed: !!googleCalendarConfirmed,
    googleCalendarUser: googleCalendarConfirmed ? (googleCalendarUser || req.user?.name || '') : '',
    googleCalendarGuest: googleCalendarConfirmed ? (googleCalendarGuest || '') : '',
    createdAt: new Date().toISOString()
  }

  const created = memoryStore.addDeadline(d)
  res.status(201).json(created)
})

// PUT — update deadline com allowlist de campos (protege contra Mass Assignment)
router.put('/:id', (req, res) => {
  const current = memoryStore.getDeadlines().find((deadline) => deadline.id === req.params.id)
  if (!current) return res.status(404).json({ message: 'Prazo não encontrado.' })
  if (current?.status === 'concluido') {
    return res.status(403).json({ message: 'Prazos concluídos não podem ser editados.' })
  }

  // ─── Allowlist: apenas estes campos podem ser atualizados ──────────────────
  // id, author, authorEmail, createdAt são ignorados mesmo que venham no body
  const VALID_CATEGORIES = new Set(['pedagoga', 'psicologa'])
  const VALID_STATUSES   = new Set(['pendente', 'em-andamento', 'concluido'])
  const VALID_PRIORITIES = new Set(['alta', 'media', 'baixa'])

  const updates = {}

  if ('title' in req.body) {
    const v = String(req.body.title ?? '').trim()
    if (!v || v.length > 200) return res.status(400).json({ message: 'Título deve ter entre 1 e 200 caracteres.' })
    updates.title = v
  }
  if ('description' in req.body) {
    const v = String(req.body.description ?? '').trim()
    if (v.length > 2000) return res.status(400).json({ message: 'Descrição não pode ultrapassar 2000 caracteres.' })
    updates.description = v
  }
  if ('date' in req.body) {
    const v = String(req.body.date ?? '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return res.status(400).json({ message: 'Data inválida. Use o formato yyyy-mm-dd.' })
    updates.date = v
  }
  if ('time' in req.body) {
    const v = String(req.body.time ?? '').trim()
    if (v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return res.status(400).json({ message: 'Hora inválida. Use o formato HH:MM.' })
    updates.time = v
  }
  if ('category' in req.body) {
    const v = String(req.body.category ?? '').trim()
    if (!VALID_CATEGORIES.has(v)) return res.status(400).json({ message: `Categoria inválida. Valores aceitos: ${[...VALID_CATEGORIES].join(', ')}.` })
    updates.category = v
  }
  if ('status' in req.body) {
    const v = String(req.body.status ?? '').trim()
    if (!VALID_STATUSES.has(v)) return res.status(400).json({ message: `Status inválido. Valores aceitos: ${[...VALID_STATUSES].join(', ')}.` })
    updates.status = v
  }
  if ('priority' in req.body) {
    const v = String(req.body.priority ?? '').trim()
    if (!VALID_PRIORITIES.has(v)) return res.status(400).json({ message: `Prioridade inválida. Valores aceitos: ${[...VALID_PRIORITIES].join(', ')}.` })
    updates.priority = v
  }
  if ('googleCalendarConfirmed' in req.body) {
    updates.googleCalendarConfirmed = Boolean(req.body.googleCalendarConfirmed)
  }
  if ('googleCalendarUser' in req.body) {
    updates.googleCalendarUser = String(req.body.googleCalendarUser ?? '').trim().slice(0, 200)
  }
  if ('googleCalendarGuest' in req.body) {
    updates.googleCalendarGuest = String(req.body.googleCalendarGuest ?? '').trim().slice(0, 200)
  }

  const updated = memoryStore.updateDeadline(req.params.id, updates)
  if (!updated) return res.status(404).json({ message: 'Prazo não encontrado.' })
  res.json(updated)
})

// DELETE — only the creator can delete a deadline
router.delete('/:id', (req, res) => {
  const current = memoryStore.getDeadlines().find((deadline) => deadline.id === req.params.id)
  if (!current) return res.status(404).json({ message: 'Prazo não encontrado.' })
  if (!isCreatedByCurrentUser(current, req.user)) return res.status(403).json({ message: 'Apenas o criador pode excluir este prazo.' })

  memoryStore.deleteDeadline(req.params.id)
  res.json({ success: true })
})

export default router
