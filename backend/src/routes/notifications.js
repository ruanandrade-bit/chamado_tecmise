import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

router.use(authRequired)

router.get('/', (req, res) => {
  const notifications = memoryStore.getNotifications(req.user.email, {
    since: req.query.since,
    limit: req.query.limit
  })
  return res.json({ notifications })
})

// Admin only — evita que qualquer usuário envie notificações arbitrárias para outros
router.post('/', adminOnly, (req, res) => {
  const { title, message, type, targetUserEmail } = req.body || {}

  const cleanTitle   = String(title   || '').trim()
  const cleanMessage = String(message || '').trim()

  if (!cleanTitle || !cleanMessage) {
    return res.status(400).json({ message: 'title e message são obrigatórios.' })
  }
  if (cleanTitle.length   > 200)  return res.status(400).json({ message: 'title não pode ultrapassar 200 caracteres.' })
  if (cleanMessage.length > 1000) return res.status(400).json({ message: 'message não pode ultrapassar 1000 caracteres.' })

  const VALID_TYPES = new Set(['success', 'error', 'info', 'warning'])
  const cleanType = VALID_TYPES.has(type) ? type : 'success'

  memoryStore.pushNotification({
    title: cleanTitle,
    message: cleanMessage,
    type: cleanType,
    targetUserEmail: targetUserEmail ? String(targetUserEmail).trim().toLowerCase() : null
  })

  return res.status(201).json({ ok: true })
})

export default router
