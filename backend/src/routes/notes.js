import { Router } from 'express'
import { authRequired, pedagogaOrPsicologaOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// All routes require authentication
router.use(authRequired)

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

// GET — anyone authenticated can view
router.get('/', async (_req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()
  const notes = memoryStore.getNotes()
  res.json(notes)
})

// POST — pedagoga/psicóloga/admin only
router.post('/', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()

  const { title, description, category, noteType, reminderDate, reminderTime, reminderStatus } = req.body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Título é obrigatório.' })
  }
  if (!category || !['pedagoga', 'psicologa'].includes(category)) {
    return res.status(400).json({ message: 'Categoria deve ser "pedagoga" ou "psicologa".' })
  }

  const note = {
    id: `AN-${crypto.randomBytes(4).toString('hex')}`,
    title: title.trim(),
    description: (description || '').trim(),
    category,
    noteType: noteType || 'note', // 'note' | 'reminder'
    author: req.user?.name || 'Desconhecido',
    authorRole: req.user?.role || '',
    isPinned: false,
    reminderDate: reminderDate || null,
    reminderTime: reminderTime || null,
    reminderStatus: reminderStatus || 'agendado',
    createdAt: new Date().toISOString()
  }

  memoryStore.addNote(note)
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir anotação no banco. Tente novamente.' })
  }
  res.status(201).json(note)
})

// PUT — pedagoga/psicóloga/admin only
router.put('/:id', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()

  const { title, description, category, noteType, isPinned, reminderDate, reminderTime, reminderStatus } = req.body
  const updates = {}

  if (title !== undefined) updates.title = String(title).trim()
  if (description !== undefined) updates.description = String(description).trim()
  if (category !== undefined) updates.category = category
  if (noteType !== undefined) updates.noteType = noteType
  if (isPinned !== undefined) updates.isPinned = Boolean(isPinned)
  if (reminderDate !== undefined) updates.reminderDate = reminderDate
  if (reminderTime !== undefined) updates.reminderTime = reminderTime
  if (reminderStatus !== undefined) updates.reminderStatus = reminderStatus

  let updated = memoryStore.updateNote(req.params.id, updates)
  if (!updated) {
    await wait(120)
    await memoryStore.refreshCollaborativeData()
    updated = memoryStore.updateNote(req.params.id, updates)
  }

  if (!updated) {
    return res.status(404).json({ message: 'Anotação não encontrada.' })
  }
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir atualização no banco. Tente novamente.' })
  }
  res.json(updated)
})

// DELETE — pedagoga/psicóloga/admin only
router.delete('/:id', pedagogaOrPsicologaOnly, async (req, res) => {
  if (!ensurePersistentStorage(res)) return
  await memoryStore.refreshCollaborativeData()
  memoryStore.deleteNote(req.params.id)
  const persisted = await memoryStore.ensureDurableCollaborativeData()
  if (!persisted) {
    return res.status(503).json({ message: 'Falha ao persistir exclusão no banco. Tente novamente.' })
  }
  res.json({ success: true })
})

export default router
