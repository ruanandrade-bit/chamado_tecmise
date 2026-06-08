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
  if (!title?.trim()) return res.status(400).json({ message: 'Título é obrigatório.' })
  if (!date) return res.status(400).json({ message: 'Data é obrigatória.' })

  const d = {
    id: `DL-${crypto.randomBytes(4).toString('hex')}`,
    title: title.trim(),
    description: (description || '').trim(),
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

// PUT — update deadline, persist in background (fast like tickets)
router.put('/:id', (req, res) => {
  const current = memoryStore.getDeadlines().find((deadline) => deadline.id === req.params.id)
  if (current?.status === 'concluido') {
    return res.status(403).json({ message: 'Prazos concluídos não podem ser editados.' })
  }

  const updated = memoryStore.updateDeadline(req.params.id, req.body)
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
