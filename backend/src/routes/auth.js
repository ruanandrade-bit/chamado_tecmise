import { Router } from 'express'
import { USERS } from '../data/mockData.js'
import { adminOnly, authRequired, sanitizeUser, signToken } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import { verifyPassword } from '../utils/password.js'

const router = Router()

function buildFreshUser(email) {
  const baseUser = sanitizeUser(email)
  if (!baseUser) return null

  const professionals = memoryStore.getProfessionals()
  const match = professionals.find((item) => (
    String(item?.name || '').trim().toLowerCase() === String(baseUser.name || '').trim().toLowerCase()
  ))

  if (match?.role) {
    return { ...baseUser, role: match.role }
  }

  return baseUser
}

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = USERS[email]

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Email ou senha inválidos.' })
  }

  const safeUser = buildFreshUser(email)
  const token = signToken(safeUser)

  return res.json({ token, user: safeUser })
})

router.get('/me', authRequired, (req, res) => {
  const email = req.user?.email
  if (!email) return res.status(401).json({ message: 'Usuário inválido.' })
  const user = buildFreshUser(email)
  if (!user) return res.status(401).json({ message: 'Usuário inválido.' })
  return res.json({ user })
})

router.get('/users', authRequired, adminOnly, (_req, res) => {
  const users = Object.entries(USERS).map(([email, user]) => ({
    email,
    name: user.name,
    role: buildFreshUser(email)?.role || user.role,
    canDragDrop: user.canDragDrop,
    viewOnly: user.viewOnly || false
  }))

  return res.json({ users })
})

export default router
