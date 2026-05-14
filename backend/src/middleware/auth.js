import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import { USERS } from '../data/mockData.js'

const configuredJwtSecret = String(process.env.JWT_SECRET || '').trim()
const MIN_JWT_SECRET_LENGTH = 32
let JWT_SECRET = configuredJwtSecret

if (JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
  JWT_SECRET = randomBytes(48).toString('hex')
  console.warn(
    `[auth] ⚠️ JWT_SECRET ausente ou fraco (< ${MIN_JWT_SECRET_LENGTH} chars). ` +
    'Usando segredo efêmero gerado em runtime. ' +
    'Defina JWT_SECRET no ambiente para manter sessões entre reinícios.'
  )
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      canDragDrop: user.canDragDrop,
      viewOnly: user.viewOnly || false
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
    const freshUser = payload?.email ? USERS[payload.email] : null
    if (!freshUser) {
      return res.status(401).json({ message: 'Usuário inválido.' })
    }

    req.user = {
      ...payload,
      name: freshUser.name,
      role: freshUser.role,
      canDragDrop: Boolean(freshUser.canDragDrop),
      viewOnly: Boolean(freshUser.viewOnly)
    }
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' })
  }
}

export function adminOnly(req, res, next) {
  const freshUser = req.user?.email ? USERS[req.user.email] : null
  const isAdmin = Boolean(freshUser?.canDragDrop)

  if (!isAdmin) {
    return res.status(403).json({ message: 'Apenas admin pode executar esta ação.' })
  }

  next()
}

export function viewOnlyBlock(req, res, next) {
  const freshUser = req.user?.email ? USERS[req.user.email] : null
  const isViewOnly = Boolean(freshUser?.viewOnly)

  if (isViewOnly) {
    return res.status(403).json({ message: 'Usuário de visualização não pode executar esta ação.' })
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
    canDragDrop: user.canDragDrop,
    viewOnly: user.viewOnly || false
  }
}
