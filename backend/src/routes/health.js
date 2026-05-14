import { Router } from 'express'
import { getJwtSecretHealth } from '../middleware/auth.js'

const router = Router()

router.get('/', (_req, res) => {
  const jwt = getJwtSecretHealth()
  res.json({
    status: jwt.configured ? 'ok' : 'degraded',
    service: 's4s-backend',
    security: {
      jwtConfigured: jwt.configured,
      jwtMinLength: jwt.minLength
    },
    timestamp: new Date().toISOString()
  })
})

export default router
