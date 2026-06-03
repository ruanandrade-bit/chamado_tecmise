import { Router } from 'express'
import { authRequired, pedagogaOrPsicologaOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

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

function ensurePersistentStorage(res) {
  if (IS_PRODUCTION && !memoryStore.hasMongoPersistence()) {
    res.status(503).json({
      message: 'Persistência indisponível. Configure MONGODB_URI no backend para salvar Kanban/Anotações/Prazos.'
    })
    return false
  }
  return true
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

router.get('/', async (_req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()
  res.json(memoryStore.getKanbanTasks())
})

router.post('/', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()

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
    status: status || 'todo', // 'todo' | 'inprogress' | 'inrevision' | 'completed'
    priority: priority || 'medium', // 'low' | 'medium' | 'high'
    date: dateValidation.value,
    tags: Array.isArray(tags) ? tags : [],
    responsible: userName,
    author: userName,
    createdAt: now,
    history: [
      { action: 'created', user: userName, date: now }
    ]
  }
  const created = memoryStore.addKanbanTask(task)
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir tarefa no banco. Tente novamente.' })
  }
  res.status(201).json(created)
})

router.put('/:id', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()

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

    // Status change (moved between columns)
    if ('status' in updates && updates.status !== currentTask.status) {
      historyEntries.push({
        action: 'status_changed',
        from: currentTask.status,
        to: updates.status,
        user: userName,
        date: now
      })
    }

    // Priority change
    if ('priority' in updates && updates.priority !== currentTask.priority) {
      historyEntries.push({
        action: 'priority_changed',
        from: currentTask.priority,
        to: updates.priority,
        user: userName,
        date: now
      })
    }

    // Date / deadline change
    if ('date' in updates && updates.date !== currentTask.date) {
      historyEntries.push({
        action: 'deadline_changed',
        from: currentTask.date,
        to: updates.date,
        user: userName,
        date: now
      })
    }

    // Archived
    if ('isArchived' in updates && updates.isArchived === true && !currentTask.isArchived) {
      historyEntries.push({
        action: 'archived',
        user: userName,
        date: now
      })
    }

    // Unarchived (restored)
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

  let updated = memoryStore.updateKanbanTask(req.params.id, updates)
  if (!updated) {
    await wait(120)
    await memoryStore.refreshCollaborativeData()
    updated = memoryStore.updateKanbanTask(req.params.id, updates)
  }

  if (!updated) return res.status(404).json({ message: 'Tarefa não encontrada.' })
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir atualização no banco. Tente novamente.' })
  }
  res.json(updated)
})

router.delete('/:id', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()
  memoryStore.deleteKanbanTask(req.params.id)
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir exclusão no banco. Tente novamente.' })
  }
  res.json({ success: true })
})

export default router
