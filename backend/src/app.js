import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import healthRoutes from './routes/health.js'
import notificationsRoutes from './routes/notifications.js'
import ticketsRoutes from './routes/tickets.js'
import reportsRoutes from './routes/reports.js'
import devicesRoutes from './routes/devices.js'
import inventoryRoutes from './routes/inventory.js'
import schoolsRoutes from './routes/schools.js'
import professionalsRoutes from './routes/professionals.js'
import cameraObstructionRoutes from './routes/cameraObstruction.js'
import notesRoutes from './routes/notes.js'

const app = express()
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

app.disable('x-powered-by')
app.set('trust proxy', 1)

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const effectiveAllowedOrigins = allowedOrigins.length > 0
  ? allowedOrigins
  : DEFAULT_ALLOWED_ORIGINS

function matchesOriginRule(origin, rule) {
  if (rule === '*') {
    return process.env.NODE_ENV !== 'production'
  }

  if (!rule.includes('*')) {
    return origin === rule
  }

  const escaped = rule
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')

  const regex = new RegExp(`^${escaped}$`)
  return regex.test(origin)
}

function isOriginAllowed(origin) {
  if (!origin) return true
  return effectiveAllowedOrigins.some((rule) => matchesOriginRule(origin, rule))
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)[0]

  return forwarded || req.ip || 'unknown'
}

function createRateLimiter({
  windowMs,
  max,
  keyPrefix,
  methods = null,
  ignorePaths = null,
  resolveSubject = null
}) {
  const hits = new Map()
  let requestCounter = 0

  return (req, res, next) => {
    if (methods && !methods.has(req.method)) return next()
    if (ignorePaths && ignorePaths.has(req.path)) return next()

    const now = Date.now()
    const clientIp = getClientIp(req)
    const subject = typeof resolveSubject === 'function'
      ? String(resolveSubject(req) || '').trim().toLowerCase()
      : ''
    const key = subject
      ? `${keyPrefix}:${clientIp}:${subject}`
      : `${keyPrefix}:${clientIp}`
    const entry = hits.get(key)

    if (!entry || now - entry.startedAt >= windowMs) {
      hits.set(key, { count: 1, startedAt: now })
    } else if (entry.count >= max) {
      const retryAfterSeconds = Math.ceil((windowMs - (now - entry.startedAt)) / 1000)
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({
        message: 'Muitas requisições. Tente novamente em instantes.'
      })
    } else {
      entry.count += 1
    }

    requestCounter += 1
    if (requestCounter % 250 === 0) {
      for (const [entryKey, value] of hits.entries()) {
        if (now - value.startedAt >= windowMs) {
          hits.delete(entryKey)
        }
      }
    }

    next()
  }
}

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true)
    }
    const error = new Error('Origin não permitida no CORS.')
    error.status = 403
    return callback(error)
  }
}))

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

app.use(express.json({ limit: '5mb' }))
app.use(morgan('dev'))
app.use('/api/auth/login', createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyPrefix: 'login',
  resolveSubject: (req) => req.body?.email
}))
app.use('/api', createRateLimiter({
  windowMs: 60 * 1000,
  max: 180,
  keyPrefix: 'write',
  methods: new Set(['POST', 'PUT', 'PATCH', 'DELETE']),
  ignorePaths: new Set(['/auth/login'])
}))

app.get('/', (_req, res) => {
  res.json({
    name: 'S4S Chamados Backend',
    version: '1.0.0',
    docs: '/api/health'
  })
})

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/devices', devicesRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/schools', schoolsRoutes)
app.use('/api/professionals', professionalsRoutes)
app.use('/api/camera-obstructions', cameraObstructionRoutes)
app.use('/api/notes', notesRoutes)

app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err?.status) ? err.status : 500
  const isServerError = status >= 500
  const safeMessage = (IS_PRODUCTION && isServerError)
    ? 'Erro interno do servidor.'
    : (err?.message || 'Erro interno do servidor.')

  return res.status(status).json({
    message: safeMessage
  })
})

export default app
