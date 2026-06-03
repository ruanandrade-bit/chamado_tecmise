import { Router } from 'express'
import { authRequired, pedagogaOrPsicologaOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)

router.get('/', (_req, res) => {
  res.json(memoryStore.getKanbanTasks())
})

router.post('/', pedagogaOrPsicologaOnly, (req, res) => {
  const { title, description, status, priority, date, tags, responsible } = req.body
  if (!title?.trim()) return res.status(400).json({ message: 'Título é obrigatório.' })

  const task = {
    id: `KB-${crypto.randomBytes(4).toString('hex')}`,
    title: title.trim(),
    description: (description || '').trim(),
    status: status || 'todo', // 'todo' | 'inprogress' | 'inrevision' | 'completed'
    priority: priority || 'medium', // 'low' | 'medium' | 'high'
    date: date || new Date().toISOString().split('T')[0],
    tags: Array.isArray(tags) ? tags : [],
    responsible: responsible || 'Pedagoga',
    author: req.user?.name || 'Desconhecido',
    createdAt: new Date().toISOString()
  }
  res.status(201).json(memoryStore.addKanbanTask(task))
})

router.put('/:id', pedagogaOrPsicologaOnly, (req, res) => {
  const updated = memoryStore.updateKanbanTask(req.params.id, req.body)
  if (!updated) return res.status(404).json({ message: 'Tarefa não encontrada.' })
  res.json(updated)
})

router.delete('/:id', pedagogaOrPsicologaOnly, (req, res) => {
  memoryStore.deleteKanbanTask(req.params.id)
  res.json({ success: true })
})

export default router
