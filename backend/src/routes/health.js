import { Router } from 'express'
import { getJwtSecretHealth } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

router.get('/', (_req, res) => {
  const jwt = getJwtSecretHealth()
  const isProduction = process.env.NODE_ENV === 'production'
  const mongoConnected = memoryStore.hasMongoPersistence()
  const persistenceHealthy = !isProduction || mongoConnected

  res.json({
    status: jwt.configured && jwt.persistent && persistenceHealthy ? 'ok' : 'degraded',
    service: 's4s-backend',
    security: {
      jwtConfigured: jwt.configured,
      jwtPersistent: jwt.persistent,
      jwtSource: jwt.source,
      jwtMinLength: jwt.minLength,
    },
    persistence: {
      mongoConnected,
      mode: mongoConnected ? 'mongodb' : 'local-file',
      productionRequiresMongo: true
    },
    timestamp: new Date().toISOString()
  })
})

export default router
