import { Router } from 'express'
import { authRequired, pedagogaOrPsicologaOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

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
  res.json(memoryStore.getDeadlines())
})

router.post('/', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()

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
  const created = memoryStore.addDeadline(d)
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir prazo no banco. Tente novamente.' })
  }
  res.status(201).json(created)
})

router.put('/:id', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()

  let updated = memoryStore.updateDeadline(req.params.id, req.body)
  if (!updated) {
    await wait(120)
    await memoryStore.refreshCollaborativeData()
    updated = memoryStore.updateDeadline(req.params.id, req.body)
  }
  if (!updated) return res.status(404).json({ message: 'Prazo não encontrado.' })
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir atualização no banco. Tente novamente.' })
  }
  res.json(updated)
})

router.delete('/:id', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()
  memoryStore.deleteDeadline(req.params.id)
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir exclusão no banco. Tente novamente.' })
  }
  res.json({ success: true })
})

export default router
