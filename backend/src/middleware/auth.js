import jwt from 'jsonwebtoken'
import { USERS } from '../data/mockData.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      canDragDrop: user.canDragDrop
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const [, token] = header.split(' ')

  if (!token) {
    return res.status(401).json({ message: 'Token ausente.' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}

export function adminOnly(req, res, next) {
  // Check token claim first; fall back to current USERS data (handles stale tokens)
  const tokenClaim = req.user?.canDragDrop
  const freshUser = req.user?.email ? USERS[req.user.email] : null
  const isAdmin = tokenClaim || freshUser?.canDragDrop

  if (!isAdmin) {
    return res.status(403).json({ message: 'Apenas admin pode executar esta ação.' })
  }

  next()
}

export function sanitizeUser(email) {
  const user = USERS[email]
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email,
    role: user.role,
    canDragDrop: user.canDragDrop
  }
}
