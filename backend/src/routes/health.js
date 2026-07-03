import { Router } from 'express'
import { getJwtSecretHealth } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

// Endpoint público — apenas status operacional, sem detalhes internos de segurança
router.get('/', (_req, res) => {
  const jwt = getJwtSecretHealth()
  const isProduction = process.env.NODE_ENV === 'production'
  const mongoConnected = memoryStore.hasMongoPersistence()
  const persistenceHealthy = !isProduction || mongoConnected
  const healthy = jwt.configured && jwt.persistent && persistenceHealthy

  res.json({
    status: healthy ? 'ok' : 'degraded',
    service: 's4s-backend',
    timestamp: new Date().toISOString()
  })
})

export default router
