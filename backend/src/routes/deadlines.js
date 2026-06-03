import { Router } from 'express'
import { authRequired, pedagogaOrPsicologaOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)

router.get('/', (_req, res) => { res.json(memoryStore.getDeadlines()) })

router.post('/', pedagogaOrPsicologaOnly, (req, res) => {
  const { title, description, date, time, category, status, priority } = req.body
  if (!title?.trim()) return res.status(400).json({ message: 'Título é obrigatório.' })
  if (!date) return res.status(400).json({ message: 'Data é obrigatória.' })

  const d = {
    id: `DL-${crypto.randomBytes(4).toString('hex')}`,
    title: title.trim(),
    description: (description || '').trim(),
    date, time: time || '',
    category: category || 'pedagoga',
    status: status || 'pendente',
    priority: priority || 'media',
    author: req.user?.name || 'Desconhecido',
    createdAt: new Date().toISOString()
  }
  res.status(201).json(memoryStore.addDeadline(d))
})

router.put('/:id', pedagogaOrPsicologaOnly, (req, res) => {
  const updated = memoryStore.updateDeadline(req.params.id, req.body)
  if (!updated) return res.status(404).json({ message: 'Prazo não encontrado.' })
  res.json(updated)
})

router.delete('/:id', pedagogaOrPsicologaOnly, (req, res) => {
  memoryStore.deleteDeadline(req.params.id)
  res.json({ success: true })
})

export default router
