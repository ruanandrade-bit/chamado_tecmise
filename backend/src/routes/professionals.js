import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

// GET /api/professionals
router.get('/', authRequired, (_req, res) => {
  const professionals = memoryStore.getProfessionals()
  res.json({ professionals })
})

// PUT /api/professionals — admin only, replaces entire professionals list
router.put('/', authRequired, adminOnly, (req, res) => {
  const list = req.body?.professionals
  if (!Array.isArray(list)) {
    return res.status(400).json({ message: 'professionals deve ser um array.' })
  }

  const normalized = list
    .map((item, index) => ({
      id: String(item?.id || `manual-${Date.now()}-${index}`),
      name: String(item?.name || '').trim(),
      role: String(item?.role || '').trim()
    }))
    .filter((item) => item.name && item.role)

  const updated = memoryStore.setProfessionals(normalized)
  return res.json({ professionals: updated })
})

export default router
