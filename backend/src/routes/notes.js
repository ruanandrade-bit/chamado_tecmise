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

const VALID_CATEGORIES        = new Set(['pedagoga', 'psicologa'])
const VALID_NOTE_TYPES        = new Set(['note', 'reminder'])
const VALID_REMINDER_STATUSES = new Set(['agendado', 'enviado', 'cancelado'])
const ISO_DATE_REGEX          = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX              = /^([01]\d|2[0-3]):[0-5]\d$/

// POST — admin only (fast like tickets)
router.post('/', (req, res) => {
  const { title, description, category, noteType, reminderDate, reminderTime, reminderStatus } = req.body

  const cleanTitle = String(title || '').trim()
  if (!cleanTitle) return res.status(400).json({ message: 'Título é obrigatório.' })
  if (cleanTitle.length > 200) return res.status(400).json({ message: 'Título não pode ultrapassar 200 caracteres.' })

  const cleanDesc = String(description || '').trim()
  if (cleanDesc.length > 2000) return res.status(400).json({ message: 'Descrição não pode ultrapassar 2000 caracteres.' })

  if (!VALID_CATEGORIES.has(category)) {
    return res.status(400).json({ message: 'Categoria deve ser "pedagoga" ou "psicologa".' })
  }
  const cleanNoteType = noteType || 'note'
  if (!VALID_NOTE_TYPES.has(cleanNoteType)) {
    return res.status(400).json({ message: 'noteType inválido. Valores aceitos: note, reminder.' })
  }
  if (reminderDate != null && !ISO_DATE_REGEX.test(String(reminderDate))) {
    return res.status(400).json({ message: 'reminderDate inválido. Use o formato yyyy-mm-dd.' })
  }
  if (reminderTime != null && !TIME_REGEX.test(String(reminderTime))) {
    return res.status(400).json({ message: 'reminderTime inválido. Use o formato HH:MM.' })
  }
  const cleanReminderStatus = reminderStatus || 'agendado'
  if (!VALID_REMINDER_STATUSES.has(cleanReminderStatus)) {
    return res.status(400).json({ message: 'reminderStatus inválido. Valores aceitos: agendado, enviado, cancelado.' })
  }

  const note = {
    id: `AN-${crypto.randomBytes(4).toString('hex')}`,
    title: cleanTitle,
    description: cleanDesc,
    category,
    noteType: cleanNoteType,
    author: req.user?.name || 'Desconhecido',
    authorEmail: req.user?.email || '',
    authorRole: req.user?.role || '',
    isPinned: false,
    reminderDate: reminderDate || null,
    reminderTime: reminderTime || null,
    reminderStatus: cleanReminderStatus,
    createdAt: new Date().toISOString()
  }

  memoryStore.addNote(note)
  res.status(201).json(note)
})

// PUT — admin only (fast like tickets)
router.put('/:id', (req, res) => {
  const { title, description, category, noteType, isPinned, reminderDate, reminderTime, reminderStatus } = req.body
  const updates = {}

  const VALID_CATEGORIES       = new Set(['pedagoga', 'psicologa'])
  const VALID_NOTE_TYPES       = new Set(['note', 'reminder'])
  const VALID_REMINDER_STATUSES = new Set(['agendado', 'enviado', 'cancelado'])
  const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
  const TIME_REGEX     = /^([01]\d|2[0-3]):[0-5]\d$/

  if (title !== undefined) {
    const v = String(title).trim()
    if (!v || v.length > 200) return res.status(400).json({ message: 'Título deve ter entre 1 e 200 caracteres.' })
    updates.title = v
  }
  if (description !== undefined) {
    const v = String(description).trim()
    if (v.length > 2000) return res.status(400).json({ message: 'Descrição não pode ultrapassar 2000 caracteres.' })
    updates.description = v
  }
  if (category !== undefined) {
    if (!VALID_CATEGORIES.has(category)) return res.status(400).json({ message: `Categoria inválida. Valores aceitos: ${[...VALID_CATEGORIES].join(', ')}.` })
    updates.category = category
  }
  if (noteType !== undefined) {
    if (!VALID_NOTE_TYPES.has(noteType)) return res.status(400).json({ message: `noteType inválido. Valores aceitos: ${[...VALID_NOTE_TYPES].join(', ')}.` })
    updates.noteType = noteType
  }
  if (isPinned !== undefined) {
    if (typeof isPinned !== 'boolean') return res.status(400).json({ message: 'isPinned deve ser boolean.' })
    updates.isPinned = isPinned
  }
  if (reminderDate !== undefined) {
    if (reminderDate !== null && !ISO_DATE_REGEX.test(String(reminderDate))) {
      return res.status(400).json({ message: 'reminderDate inválido. Use o formato yyyy-mm-dd ou null.' })
    }
    updates.reminderDate = reminderDate
  }
  if (reminderTime !== undefined) {
    if (reminderTime !== null && !TIME_REGEX.test(String(reminderTime))) {
      return res.status(400).json({ message: 'reminderTime inválido. Use o formato HH:MM ou null.' })
    }
    updates.reminderTime = reminderTime
  }
  if (reminderStatus !== undefined) {
    if (!VALID_REMINDER_STATUSES.has(reminderStatus)) return res.status(400).json({ message: `reminderStatus inválido. Valores aceitos: ${[...VALID_REMINDER_STATUSES].join(', ')}.` })
    updates.reminderStatus = reminderStatus
  }

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
