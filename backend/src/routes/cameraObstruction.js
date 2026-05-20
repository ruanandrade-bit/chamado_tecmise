import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()

// All routes require authentication
router.use(authRequired)

// GET — anyone authenticated can view
router.get('/', (_req, res) => {
  const records = memoryStore.getCameraObstructions()
  res.json(records)
})

// POST — admin only can create
router.post('/', adminOnly, (req, res) => {
  const { school, devices, startTime, endTime, percentage } = req.body

  // Validation
  if (!school || typeof school !== 'string') {
    return res.status(400).json({ message: 'Escola é obrigatória.' })
  }
  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ message: 'Selecione pelo menos 1 device.' })
  }
  if (!startTime || !endTime) {
    return res.status(400).json({ message: 'Horário de início e fim são obrigatórios.' })
  }
  const pct = Number(percentage)
  if (isNaN(pct) || pct < 0 || pct > 100) {
    return res.status(400).json({ message: 'Porcentagem deve ser entre 0 e 100.' })
  }

  const record = {
    id: `CO-${crypto.randomBytes(4).toString('hex')}`,
    school: school.trim(),
    devices,
    startTime,
    endTime,
    percentage: pct,
    createdAt: new Date().toISOString(),
    createdBy: req.user?.name || 'Admin'
  }

  memoryStore.addCameraObstruction(record)
  res.status(201).json(record)
})

// DELETE — admin only
router.delete('/:id', adminOnly, (req, res) => {
  memoryStore.deleteCameraObstruction(req.params.id)
  res.json({ success: true })
})

export default router
