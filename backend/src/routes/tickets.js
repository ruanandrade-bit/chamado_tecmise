import { Router } from 'express'
import { authRequired, adminOnly, viewOnlyBlock } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

const PRIORITIES = new Set(['alta', 'media', 'baixa'])
const USER_ALLOWED_PATCH_FIELDS = new Set(['comments', 'attachments'])
const ADMIN_ALLOWED_PATCH_FIELDS = new Set([
  ...USER_ALLOWED_PATCH_FIELDS,
  'school',
  'classroom',
  'device',
  'period',
  'problemType',
  'description',
  'priority',
  'responsible',
  'notes',
  'archived',
  'archivedAt',
  'checklist'
])

function normalizeText(value, { fieldName, min = 0, max = 4000 } = {}) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} deve ser texto.`)
  }
  const clean = value.trim()
  if (clean.length < min || clean.length > max) {
    throw new Error(`${fieldName} inválido.`)
  }
  return clean
}

function sanitizeComments(comments) {
  if (!Array.isArray(comments)) {
    throw new Error('comments deve ser um array.')
  }

  return comments.map((comment, index) => {
    const text = normalizeText(String(comment?.text || ''), {
      fieldName: `comments[${index}].text`,
      min: 1,
      max: 4000
    })

    const by = normalizeText(String(comment?.by || 'Sistema'), {
      fieldName: `comments[${index}].by`,
      min: 1,
      max: 120
    })

    const dateValue = comment?.date ? new Date(comment.date) : new Date()
    if (Number.isNaN(dateValue.getTime())) {
      throw new Error(`comments[${index}].date inválida.`)
    }

    const safeId = comment?.id ?? (Date.now() + Math.random())

    return {
      id: safeId,
      text,
      by,
      date: dateValue.toISOString()
    }
  })
}

function sanitizeAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    throw new Error('attachments deve ser um array.')
  }

  return attachments.map((attachment, index) => {
    if (typeof attachment === 'string') {
      return normalizeText(attachment, {
        fieldName: `attachments[${index}]`,
        min: 1,
        max: 180
      })
    }

    const name = normalizeText(String(attachment?.name || `anexo-${index + 1}`), {
      fieldName: `attachments[${index}].name`,
      min: 1,
      max: 180
    })

    const preview = String(attachment?.preview || '')
    if (preview.length > 4_500_000) {
      throw new Error(`attachments[${index}].preview muito grande.`)
    }

    const type = String(attachment?.type || '').trim()

    return {
      name,
      preview: preview || null,
      type: type || null
    }
  })
}

function sanitizeChecklist(checklist) {
  if (!Array.isArray(checklist)) {
    throw new Error('checklist deve ser um array.')
  }

  return checklist.map((item, index) => ({
    id: Number(item?.id) || index + 1,
    title: normalizeText(String(item?.title || ''), {
      fieldName: `checklist[${index}].title`,
      min: 1,
      max: 220
    }),
    completed: Boolean(item?.completed)
  }))
}

function buildPatchUpdates(payload, isAdmin) {
  const source = payload && typeof payload === 'object' ? payload : {}
  const allowedFields = isAdmin ? ADMIN_ALLOWED_PATCH_FIELDS : USER_ALLOWED_PATCH_FIELDS
  const keys = Object.keys(source)

  if (keys.length === 0) {
    throw new Error('Nenhum campo enviado para atualização.')
  }

  const unknown = keys.filter((key) => !allowedFields.has(key))
  if (unknown.length > 0) {
    throw new Error(`Campos não permitidos para edição: ${unknown.join(', ')}`)
  }

  const updates = {}

  if ('school' in source) updates.school = normalizeText(source.school, { fieldName: 'school', min: 1, max: 120 })
  if ('classroom' in source) updates.classroom = normalizeText(source.classroom, { fieldName: 'classroom', min: 1, max: 120 })
  if ('device' in source) updates.device = normalizeText(String(source.device), { fieldName: 'device', min: 1, max: 120 })
  if ('period' in source) updates.period = normalizeText(source.period, { fieldName: 'period', min: 1, max: 80 })
  if ('problemType' in source) updates.problemType = normalizeText(source.problemType, { fieldName: 'problemType', min: 1, max: 220 })
  if ('description' in source) updates.description = normalizeText(source.description, { fieldName: 'description', min: 1, max: 5000 })
  if ('responsible' in source) updates.responsible = normalizeText(source.responsible, { fieldName: 'responsible', min: 1, max: 120 })
  if ('notes' in source) updates.notes = normalizeText(String(source.notes || ''), { fieldName: 'notes', min: 0, max: 5000 })

  if ('priority' in source) {
    const priority = String(source.priority || '').trim().toLowerCase()
    if (!PRIORITIES.has(priority)) throw new Error('priority inválida.')
    updates.priority = priority
  }

  if ('archived' in source) {
    if (typeof source.archived !== 'boolean') throw new Error('archived deve ser booleano.')
    updates.archived = source.archived
  }

  if ('archivedAt' in source) {
    if (source.archivedAt === null || source.archivedAt === '') {
      updates.archivedAt = null
    } else {
      const archivedAtDate = new Date(source.archivedAt)
      if (Number.isNaN(archivedAtDate.getTime())) throw new Error('archivedAt inválido.')
      updates.archivedAt = archivedAtDate.toISOString()
    }
  }

  if ('comments' in source) updates.comments = sanitizeComments(source.comments)
  if ('attachments' in source) updates.attachments = sanitizeAttachments(source.attachments)
  if ('checklist' in source) updates.checklist = sanitizeChecklist(source.checklist)

  return updates
}

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
  const body = req.body || {}
  let sanitizedBody

  try {
    const school      = normalizeText(body.school,                    { fieldName: 'school',      min: 1, max: 120 })
    const classroom   = normalizeText(body.classroom,                 { fieldName: 'classroom',   min: 1, max: 120 })
    const device      = normalizeText(String(body.device      ?? ''), { fieldName: 'device',      min: 1, max: 120 })
    const description = normalizeText(body.description,               { fieldName: 'description', min: 1, max: 5000 })
    const period      = normalizeText(String(body.period      ?? ''), { fieldName: 'period',      min: 0, max: 80 })
    const problemType = normalizeText(String(body.problemType ?? ''), { fieldName: 'problemType', min: 0, max: 220 })
    const responsible = normalizeText(String(body.responsible ?? ''), { fieldName: 'responsible', min: 0, max: 120 })
    const priority    = String(body.priority || 'media').trim().toLowerCase()

    if (!PRIORITIES.has(priority)) throw new Error('priority inválida.')

    sanitizedBody = { school, classroom, device, description, period, problemType, responsible, priority }
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }

  const ticket = memoryStore.createTicket(sanitizedBody, req.user)
  return res.status(201).json({ ticket })
})

router.patch('/:id', viewOnlyBlock, (req, res) => {
  const existing = memoryStore.getTicketById(req.params.id)
  if (!existing) return res.status(404).json({ message: 'Chamado não encontrado.' })

  const isAdmin = req.user?.role === 'Admin'
  if (!isAdmin) {
    const isOwner = existing.createdByEmail
      ? existing.createdByEmail === req.user?.email
      : existing.responsible === req.user?.name

    if (!isOwner) {
      return res.status(403).json({ message: 'Você só pode editar comentários/anexos dos seus próprios chamados.' })
    }
  }

  let updates = {}

  try {
    updates = buildPatchUpdates(req.body, isAdmin)
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Payload inválido.' })
  }

  // Block comment additions on resolved or archived tickets
  if (updates.comments) {
    if (existing.status === 'resolvido' || existing.archived) {
      return res.status(403).json({ message: 'Comentários encerrados — chamado resolvido ou arquivado.' })
    }
  }

  // Track if new comments were added
  const oldCommentCount = (existing.comments || []).length
  const newComments = updates.comments || null

  const ticket = memoryStore.updateTicket(req.params.id, updates, req.user.name)
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' })

  // Send notification to ticket creator when a new comment is added
  if (newComments && newComments.length > oldCommentCount) {
    const creatorEmail = ticket.createdByEmail || null
    // Don't notify if the commenter is the ticket creator
    if (creatorEmail && creatorEmail !== req.user.email) {
      memoryStore.pushNotification({
        title: '💬 Novo Comentário',
        message: `O seu chamado ${ticket.id} recebeu um comentário de ${req.user.name}.`,
        type: 'info',
        targetUserEmail: creatorEmail
      })
    }
  }

  return res.json({ ticket })
})

router.post('/:id/move', viewOnlyBlock, (req, res) => {
  const isAdmin = req.user?.role === 'Admin'
  if (!isAdmin) {
    return res.status(403).json({ message: 'Apenas admin pode mover chamados.' })
  }

  const status = String(req.body?.status || '').trim()
  if (!status) return res.status(400).json({ message: 'status é obrigatório.' })

  const allowedStatuses = new Set((memoryStore.statuses || []).map((item) => item.value))
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: 'status inválido.' })
  }

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

router.delete('/:id/checklist/:itemId', adminOnly, (req, res) => {
  const itemId = Number.parseInt(req.params.itemId, 10)
  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ message: 'itemId inválido.' })
  }

  const ticket = memoryStore.removeChecklistItem(req.params.id, itemId)
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' })

  return res.json({ ticket })
})

router.delete('/:id', adminOnly, (req, res) => {
  const deleted = memoryStore.deleteTicket(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Chamado não encontrado.' })
  return res.status(204).send()
})

export default router
