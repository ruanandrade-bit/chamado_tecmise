import { Router } from 'express'
import { USERS } from '../data/mockData.js'
import { adminOnly, authRequired, sanitizeUser, signToken } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import { verifyPassword } from '../utils/password.js'

const router = Router()

function buildFreshUser(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const baseUser = sanitizeUser(normalizedEmail)
  if (!baseUser) return null

  const professionals = memoryStore.getProfessionals()
  const matchByEmail = professionals.find((item) => (
    String(item?.email || '').trim().toLowerCase() === normalizedEmail
  ))
  const matchByName = professionals.find((item) => (
    String(item?.name || '').trim().toLowerCase() === String(baseUser.name || '').trim().toLowerCase()
  ))
  const match = matchByEmail || matchByName

  if (match?.role) {
    return { ...baseUser, role: match.role }
  }

  return baseUser
}

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const user = USERS[normalizedEmail]

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Email ou senha inválidos.' })
  }

  // Check if user still exists in the professionals list (not deleted by admin)
  const professionals = memoryStore.getProfessionals()
  const stillExists = professionals.some(p =>
    String(p?.email || '').trim().toLowerCase() === normalizedEmail ||
    String(p?.name || '').trim().toLowerCase() === String(user?.name || '').trim().toLowerCase()
  )

  if (!stillExists) {
    return res.status(401).json({ message: 'Esta conta foi removida pelo administrador.' })
  }

  const safeUser = buildFreshUser(normalizedEmail)
  const token = signToken(safeUser)

  return res.json({ token, user: safeUser })
})

router.get('/me', authRequired, (req, res) => {
  const email = req.user?.email
  if (!email) return res.status(401).json({ message: 'Usuário inválido.' })

  // Check if user still exists in the professionals list (not deleted by admin)
  const normalizedEmail = String(email).trim().toLowerCase()
  const userRecord = USERS[normalizedEmail]
  const professionals = memoryStore.getProfessionals()
  const stillExists = professionals.some(p =>
    String(p?.email || '').trim().toLowerCase() === normalizedEmail ||
    (userRecord && String(p?.name || '').trim().toLowerCase() === String(userRecord?.name || '').trim().toLowerCase())
  )

  if (!stillExists) {
    return res.status(401).json({ message: 'Esta conta foi removida pelo administrador.' })
  }

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
