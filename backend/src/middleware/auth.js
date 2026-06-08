import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import { USERS } from '../data/mockData.js'

const configuredJwtSecret = String(process.env.JWT_SECRET || '').trim()
const MIN_JWT_SECRET_LENGTH = 32
const isStrongConfiguredSecret = configuredJwtSecret.length >= MIN_JWT_SECRET_LENGTH

function deriveStableRuntimeSecret() {
  const entropySources = [
    process.env.MONGODB_URI,
    process.env.RENDER_SERVICE_ID,
    process.env.RENDER_GIT_REPO_SLUG,
    process.env.RENDER_EXTERNAL_HOSTNAME,
  ].filter((value) => String(value || '').trim().length > 0)

  if (entropySources.length === 0) return null

  return createHash('sha256')
    .update(entropySources.join('|'))
    .digest('hex')
}

let JWT_SECRET = configuredJwtSecret
let jwtSecretSource = 'env'
let isPersistentSecret = true

if (!isStrongConfiguredSecret) {
  const derivedSecret = deriveStableRuntimeSecret()
  if (derivedSecret && derivedSecret.length >= MIN_JWT_SECRET_LENGTH) {
    JWT_SECRET = derivedSecret
    jwtSecretSource = 'derived'
    isPersistentSecret = true
    console.log('[auth] JWT_SECRET não definido; usando segredo determinístico estável para esta infraestrutura.')
  } else {
    JWT_SECRET = randomBytes(48).toString('hex')
    jwtSecretSource = 'ephemeral'
    isPersistentSecret = false
    console.warn(
      `[auth] ⚠️ JWT_SECRET ausente ou fraco (< ${MIN_JWT_SECRET_LENGTH} chars). ` +
      'Sem fontes estáveis para derivação segura; usando segredo efêmero em runtime.'
    )
  }
}

export function getJwtSecretHealth() {
  return {
    configured: isStrongConfiguredSecret || jwtSecretSource === 'derived',
    persistent: isPersistentSecret,
    source: jwtSecretSource,
    minLength: MIN_JWT_SECRET_LENGTH,
  }
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

export function pedagogaOrPsicologaOnly(req, res, next) {
  const freshUser = req.user?.email ? USERS[req.user.email] : null
  const role = String(freshUser?.role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const isAllowed = role === 'pedagoga' || role === 'psicologa' || Boolean(freshUser?.canDragDrop)

  if (!isAllowed) {
    return res.status(403).json({ message: 'Apenas Pedagogas e Psicólogas podem executar esta ação.' })
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
