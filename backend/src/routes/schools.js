import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

// GET  /api/schools — anyone authenticated can read (needed for CreateTicketModal)
router.get('/', authRequired, (_req, res) => {
  const data = memoryStore.getSchoolData()
  res.json(data)
})

// PUT  /api/schools — admin only, replaces the entire school config
router.put('/', authRequired, adminOnly, (req, res) => {
  const { schoolData } = req.body
  if (!schoolData || typeof schoolData !== 'object') {
    return res.status(400).json({ message: 'schoolData é obrigatório.' })
  }
  const updated = memoryStore.setSchoolData(schoolData)
  res.json(updated)
})

export default router
