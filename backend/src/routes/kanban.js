import { Router } from 'express'
import { authRequired, pedagogaOrPsicologaOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)

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

router.get('/', (_req, res) => {
  res.json(memoryStore.getKanbanTasks())
})

router.post('/', pedagogaOrPsicologaOnly, (req, res) => {
  const { title, description, status, priority, date, tags } = req.body
  if (!title?.trim()) return res.status(400).json({ message: 'Título é obrigatório.' })

  const dateValidation = validateDueDate(date)
  if (!dateValidation.ok) {
    return res.status(400).json({ message: dateValidation.message })
  }

  const task = {
    id: `KB-${crypto.randomBytes(4).toString('hex')}`,
    title: title.trim(),
    description: (description || '').trim(),
    status: status || 'todo', // 'todo' | 'inprogress' | 'inrevision' | 'completed'
    priority: priority || 'medium', // 'low' | 'medium' | 'high'
    date: dateValidation.value,
    tags: Array.isArray(tags) ? tags : [],
    responsible: req.user?.name || 'Desconhecido',
    author: req.user?.name || 'Desconhecido',
    createdAt: new Date().toISOString()
  }
  res.status(201).json(memoryStore.addKanbanTask(task))
})

router.put('/:id', pedagogaOrPsicologaOnly, (req, res) => {
  const updates = { ...req.body }
  delete updates.responsible

  if ('date' in updates) {
    const dateValidation = validateDueDate(updates.date)
    if (!dateValidation.ok) {
      return res.status(400).json({ message: dateValidation.message })
    }
    updates.date = dateValidation.value
  }

  const updated = memoryStore.updateKanbanTask(req.params.id, updates)
  if (!updated) return res.status(404).json({ message: 'Tarefa não encontrada.' })
  res.json(updated)
})

router.delete('/:id', pedagogaOrPsicologaOnly, (req, res) => {
  memoryStore.deleteKanbanTask(req.params.id)
  res.json({ success: true })
})

export default router
