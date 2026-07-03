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

// ─── Campos que o cliente pode alterar via PUT ────────────────────────────────
// Qualquer chave fora desta lista é silenciosamente ignorada (Mass Assignment protection)
const KANBAN_VALID_STATUSES  = new Set(['todo', 'in_progress', 'done'])
const KANBAN_VALID_PRIORITIES = new Set(['low', 'medium', 'high'])

function buildKanbanUpdates(body) {
  const updates = {}

  // title — obrigatório no POST, opcional no PUT; máx 200 chars
  if ('title' in body) {
    const v = String(body.title ?? '').trim()
    if (!v || v.length > 200) throw new Error('Título deve ter entre 1 e 200 caracteres.')
    updates.title = v
  }

  // description — opcional; máx 2000 chars
  if ('description' in body) {
    const v = String(body.description ?? '').trim()
    if (v.length > 2000) throw new Error('Descrição não pode ultrapassar 2000 caracteres.')
    updates.description = v
  }

  // status — enum fechado
  if ('status' in body) {
    const v = String(body.status ?? '').trim()
    if (!KANBAN_VALID_STATUSES.has(v)) throw new Error(`Status inválido. Valores aceitos: ${[...KANBAN_VALID_STATUSES].join(', ')}.`)
    updates.status = v
  }

  // priority — enum fechado
  if ('priority' in body) {
    const v = String(body.priority ?? '').trim()
    if (!KANBAN_VALID_PRIORITIES.has(v)) throw new Error(`Prioridade inválida. Valores aceitos: ${[...KANBAN_VALID_PRIORITIES].join(', ')}.`)
    updates.priority = v
  }

  // tags — array de strings, máx 10 itens de 50 chars cada
  if ('tags' in body) {
    if (!Array.isArray(body.tags)) throw new Error('tags deve ser um array.')
    if (body.tags.length > 10) throw new Error('Máximo de 10 tags por tarefa.')
    updates.tags = body.tags.map((t, i) => {
      const s = String(t ?? '').trim()
      if (s.length > 50) throw new Error(`Tag ${i + 1} excede 50 caracteres.`)
      return s
    })
  }

  // isArchived — boolean estrito
  if ('isArchived' in body) {
    if (typeof body.isArchived !== 'boolean') throw new Error('isArchived deve ser boolean.')
    updates.isArchived = body.isArchived
  }

  // date — tratado separadamente pelo validateDueDate, mas aceito aqui
  if ('date' in body) {
    updates.date = body.date // será validado logo abaixo pelo validateDueDate
  }

  return updates
}

// GET — return instantly from memory, trigger sync in the background
router.get('/', (_req, res) => {
  res.json(memoryStore.getKanbanTasks())
  memoryStore.refreshCollaborativeData().catch(() => {})
})

// POST — create task, persist in background (fast like tickets)
router.post('/', (req, res) => {
  const { title, description, status, priority, date, tags } = req.body

  const cleanTitle = String(title || '').trim()
  if (!cleanTitle) return res.status(400).json({ message: 'Título é obrigatório.' })
  if (cleanTitle.length > 200) return res.status(400).json({ message: 'Título não pode ultrapassar 200 caracteres.' })

  const cleanDesc = String(description || '').trim()
  if (cleanDesc.length > 2000) return res.status(400).json({ message: 'Descrição não pode ultrapassar 2000 caracteres.' })

  if (status != null && !KANBAN_VALID_STATUSES.has(status)) {
    return res.status(400).json({ message: `Status inválido. Valores aceitos: ${[...KANBAN_VALID_STATUSES].join(', ')}.` })
  }
  if (priority != null && !KANBAN_VALID_PRIORITIES.has(priority)) {
    return res.status(400).json({ message: `Prioridade inválida. Valores aceitos: ${[...KANBAN_VALID_PRIORITIES].join(', ')}.` })
  }
  if (tags != null) {
    if (!Array.isArray(tags)) return res.status(400).json({ message: 'tags deve ser um array.' })
    if (tags.length > 10) return res.status(400).json({ message: 'Máximo de 10 tags por tarefa.' })
    for (let i = 0; i < tags.length; i++) {
      if (String(tags[i] ?? '').trim().length > 50) return res.status(400).json({ message: `Tag ${i + 1} excede 50 caracteres.` })
    }
  }

  const dateValidation = validateDueDate(date)
  if (!dateValidation.ok) {
    return res.status(400).json({ message: dateValidation.message })
  }

  const now = new Date().toISOString()
  const userName = req.user?.name || 'Desconhecido'

  const task = {
    id: `KB-${crypto.randomBytes(4).toString('hex')}`,
    title: cleanTitle,
    description: cleanDesc,
    status: status || 'todo',
    priority: priority || 'medium',
    date: dateValidation.value,
    tags: Array.isArray(tags) ? tags.map(t => String(t ?? '').trim()) : [],
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

// PUT — update task com allowlist de campos (protege contra Mass Assignment)
router.put('/:id', (req, res) => {
  let updates
  try {
    updates = buildKanbanUpdates(req.body)
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }

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
