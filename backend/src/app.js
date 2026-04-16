import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import healthRoutes from './routes/health.js'
import notificationsRoutes from './routes/notifications.js'
import ticketsRoutes from './routes/tickets.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Accept any Vercel preview/production deployment
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }

    return callback(new Error('Origin não permitida no CORS.'))
  }
}))

app.use(express.json({ limit: '5mb' }))
app.use(morgan('dev'))

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

app.use((err, _req, res, _next) => {
  return res.status(500).json({
    message: err.message || 'Erro interno do servidor.'
  })
})

export default app
