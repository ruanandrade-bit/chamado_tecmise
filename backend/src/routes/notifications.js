import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

router.use(authRequired)

router.get('/', (req, res) => {
  const notifications = memoryStore.consumeNotifications(req.user.email)
  return res.json({ notifications })
})

router.post('/', (req, res) => {
  const { title, message, type, targetUserEmail } = req.body || {}

  if (!String(title || '').trim() || !String(message || '').trim()) {
    return res.status(400).json({ message: 'title e message são obrigatórios.' })
  }

  memoryStore.pushNotification({
    title: String(title).trim(),
    message: String(message).trim(),
    type: type || 'success',
    targetUserEmail: targetUserEmail || null
  })

  return res.status(201).json({ ok: true })
})

export default router
