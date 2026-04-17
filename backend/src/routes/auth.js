import { Router } from 'express'
import { USERS } from '../data/mockData.js'
import { authRequired, sanitizeUser, signToken } from '../middleware/auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = USERS[email]

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Email ou senha inválidos.' })
  }

  const safeUser = sanitizeUser(email)
  const token = signToken(safeUser)

  return res.json({ token, user: safeUser })
})

router.get('/me', authRequired, (req, res) => {
  return res.json({ user: req.user })
})

router.get('/users', (_req, res) => {
  const users = Object.entries(USERS).map(([email, user]) => ({
    email,
    name: user.name,
    role: user.role,
    canDragDrop: user.canDragDrop,
    viewOnly: user.viewOnly || false
  }))

  return res.json({ users })
})

export default router
