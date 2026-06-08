import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()

// All routes require authentication and admin permission
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
  res.json(memoryStore.getNotes())
  memoryStore.refreshCollaborativeData().catch(() => {})
})

// POST — admin only (fast like tickets)
router.post('/', (req, res) => {
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
    authorEmail: req.user?.email || '',
    authorRole: req.user?.role || '',
    isPinned: false,
    reminderDate: reminderDate || null,
    reminderTime: reminderTime || null,
    reminderStatus: reminderStatus || 'agendado',
    createdAt: new Date().toISOString()
  }

  memoryStore.addNote(note)
  res.status(201).json(note)
})

// PUT — admin only (fast like tickets)
router.put('/:id', (req, res) => {
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

  const updated = memoryStore.updateNote(req.params.id, updates)
  if (!updated) {
    return res.status(404).json({ message: 'Anotação não encontrada.' })
  }
  res.json(updated)
})

// DELETE — only the creator can delete a note/reminder
router.delete('/:id', (req, res) => {
  const current = memoryStore.getNotes().find((note) => note.id === req.params.id)
  if (!current) return res.status(404).json({ message: 'Anotação não encontrada.' })
  if (!isCreatedByCurrentUser(current, req.user)) return res.status(403).json({ message: 'Apenas o criador pode excluir esta anotação.' })

  memoryStore.deleteNote(req.params.id)
  res.json({ success: true })
})

export default router
