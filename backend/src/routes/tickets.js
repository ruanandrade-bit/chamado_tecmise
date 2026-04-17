import { Router } from 'express'
import { authRequired, adminOnly, viewOnlyBlock } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

router.use(authRequired)

router.get('/statuses', (_req, res) => {
  res.json({ statuses: memoryStore.statuses })
})

router.get('/', (req, res) => {
  const tickets = memoryStore.getTickets({
    status: req.query.status || null,
    responsible: req.query.responsible || null,
    searchTerm: req.query.search || ''
  })

  res.json({ tickets })
})

router.get('/grouped', (req, res) => {
  const grouped = memoryStore.getGroupedByStatus({
    status: req.query.status || null,
    responsible: req.query.responsible || null,
    searchTerm: req.query.search || ''
  })

  res.json({ grouped })
})

router.get('/stats', (_req, res) => {
  res.json({ stats: memoryStore.getStats() })
})

router.get('/:id', (req, res) => {
  const ticket = memoryStore.getTicketById(req.params.id)
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' })
  return res.json({ ticket })
})

router.post('/', viewOnlyBlock, (req, res) => {
  const { school, classroom, device, description } = req.body || {}

  if (!String(school || '').trim() || !String(classroom || '').trim() || !String(device || '').trim() || !String(description || '').trim()) {
    return res.status(400).json({ message: 'Campos obrigatórios: school, classroom, device e description.' })
  }

  const ticket = memoryStore.createTicket(req.body, req.user)
  return res.status(201).json({ ticket })
})

router.patch('/:id', viewOnlyBlock, (req, res) => {
  const ticket = memoryStore.updateTicket(req.params.id, req.body, req.user.name)
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' })
  return res.json({ ticket })
})

router.post('/:id/move', viewOnlyBlock, (req, res) => {
  const { status } = req.body || {}
  if (!status) return res.status(400).json({ message: 'status é obrigatório.' })

  const ticket = memoryStore.moveTicket(req.params.id, status, req.user)
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' })

  return res.json({ ticket })
})

router.patch('/:id/checklist/:itemId', adminOnly, (req, res) => {
  const completed = Boolean(req.body?.completed)
  const itemId = Number.parseInt(req.params.itemId, 10)

  const ticket = memoryStore.toggleChecklist(req.params.id, itemId, completed)
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' })

  return res.json({ ticket })
})

router.post('/:id/checklist', adminOnly, (req, res) => {
  const title = String(req.body?.title || '').trim()
  if (!title) return res.status(400).json({ message: 'title é obrigatório.' })

  const ticket = memoryStore.addChecklistItem(req.params.id, title)
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' })

  return res.json({ ticket })
})

router.delete('/:id', adminOnly, (req, res) => {
  const deleted = memoryStore.deleteTicket(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Chamado não encontrado.' })
  return res.status(204).send()
})

export default router
