import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
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
import deadlinesRoutes from './routes/deadlines.js'
import kanbanRoutes from './routes/kanban.js'
import childrenRoutes from './routes/children.js'

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


app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true)
    }
    const error = new Error('Origin não permitida no CORS.')
    error.status = 403
    return callback(error)
  },
  credentials: true
}))

app.use(cookieParser())

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  )
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

app.use(express.json({ limit: '1mb' }))
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'))

app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(503).json({ message: 'Requisição expirou.' })
  })
  next()
})
// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Login: 10 tentativas por IP em 10 minutos (proteção contra força bruta)
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de login. Tente novamente em instantes.' }
})

// API geral: 60 requisições de escrita por IP por minuto (proteção contra DoS)
const apiWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method),
  message: { message: 'Muitas requisições. Tente novamente em instantes.' }
})

app.use('/api/auth/login', loginLimiter)
app.use('/api', apiWriteLimiter)

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
app.use('/api/deadlines', deadlinesRoutes)
app.use('/api/kanban', kanbanRoutes)
app.use('/api/children', childrenRoutes)

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
