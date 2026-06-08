import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)
router.use(adminOnly)

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

function normalizeOwner(value) {
  return String(value || '').trim().toLowerCase()
}

function isCreatedByCurrentUser(item, user) {
  if (!item || !user) return false
  if (item.authorEmail) return normalizeOwner(item.authorEmail) === normalizeOwner(user.email)
  return normalizeOwner(item.author) === normalizeOwner(user.name)
}

function getTodayIsoLocal() {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().split('T')[0]
}

function validateDueDate(date) {
  const dueDate = String(date || '').trim()

  if (!dueDate) {
    return { ok: false, message: 'A data de prazo é obrigatória.' }
  }

  if (!isoDateRegex.test(dueDate)) {
    return { ok: false, message: 'Data inválida. Use o formato yyyy-mm-dd.' }
  }

  if (dueDate < getTodayIsoLocal()) {
    return { ok: false, message: 'Não é permitido cadastrar prazo com data anterior a hoje.' }
  }

  return { ok: true, value: dueDate }
}

// GET — return instantly from memory, trigger sync in the background
router.get('/', (_req, res) => {
  res.json(memoryStore.getKanbanTasks())
  memoryStore.refreshCollaborativeData().catch(() => {})
})

// POST — create task, persist in background (fast like tickets)
router.post('/', (req, res) => {
  const { title, description, status, priority, date, tags } = req.body
  if (!title?.trim()) return res.status(400).json({ message: 'Título é obrigatório.' })

  const dateValidation = validateDueDate(date)
  if (!dateValidation.ok) {
    return res.status(400).json({ message: dateValidation.message })
  }

  const now = new Date().toISOString()
  const userName = req.user?.name || 'Desconhecido'

  const task = {
    id: `KB-${crypto.randomBytes(4).toString('hex')}`,
    title: title.trim(),
    description: (description || '').trim(),
    status: status || 'todo',
    priority: priority || 'medium',
    date: dateValidation.value,
    tags: Array.isArray(tags) ? tags : [],
    responsible: userName,
    author: userName,
    authorEmail: req.user?.email || '',
    createdAt: now,
    history: [
      { action: 'created', user: userName, date: now }
    ]
  }
  const created = memoryStore.addKanbanTask(task)
  res.status(201).json(created)
})

// PUT — update task, persist in background (fast like tickets)
router.put('/:id', (req, res) => {
  const updates = { ...req.body }
  delete updates.responsible

  if ('date' in updates) {
    const dateValidation = validateDueDate(updates.date)
    if (!dateValidation.ok) {
      return res.status(400).json({ message: dateValidation.message })
    }
    updates.date = dateValidation.value
  }

  // ── Build history entries for tracked field changes ──
  const now = new Date().toISOString()
  const userName = req.user?.name || 'Desconhecido'
  const currentTask = memoryStore.getKanbanTasks().find(t => t.id === req.params.id)

  if (currentTask) {
    const historyEntries = []

    if ('status' in updates && updates.status !== currentTask.status) {
      historyEntries.push({
        action: 'status_changed',
        from: currentTask.status,
        to: updates.status,
        user: userName,
        date: now
      })
    }

    if ('priority' in updates && updates.priority !== currentTask.priority) {
      historyEntries.push({
        action: 'priority_changed',
        from: currentTask.priority,
        to: updates.priority,
        user: userName,
        date: now
      })
    }

    if ('date' in updates && updates.date !== currentTask.date) {
      historyEntries.push({
        action: 'deadline_changed',
        from: currentTask.date,
        to: updates.date,
        user: userName,
        date: now
      })
    }

    if ('isArchived' in updates && updates.isArchived === true && !currentTask.isArchived) {
      historyEntries.push({
        action: 'archived',
        user: userName,
        date: now
      })
    }

    if ('isArchived' in updates && updates.isArchived === false && currentTask.isArchived) {
      historyEntries.push({
        action: 'unarchived',
        user: userName,
        date: now
      })
    }

    if (historyEntries.length > 0) {
      const existingHistory = Array.isArray(currentTask.history) ? currentTask.history : []
      updates.history = [...existingHistory, ...historyEntries]
    }
  }

  const updated = memoryStore.updateKanbanTask(req.params.id, updates)
  if (!updated) return res.status(404).json({ message: 'Tarefa não encontrada.' })
  res.json(updated)
})

// DELETE — only the creator can remove the task
router.delete('/:id', (req, res) => {
  const current = memoryStore.getKanbanTasks().find((task) => task.id === req.params.id)
  if (!current) return res.status(404).json({ message: 'Tarefa não encontrada.' })
  if (!isCreatedByCurrentUser(current, req.user)) return res.status(403).json({ message: 'Apenas o criador pode excluir esta tarefa.' })

  memoryStore.deleteKanbanTask(req.params.id)
  res.json({ success: true })
})

export default router
