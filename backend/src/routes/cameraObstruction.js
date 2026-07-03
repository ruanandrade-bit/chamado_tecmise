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
  const cleanSchool = String(school || '').trim()
  if (!cleanSchool || cleanSchool.length > 200) {
    return res.status(400).json({ message: 'Escola é obrigatória e deve ter no máximo 200 caracteres.' })
  }
  if (!Array.isArray(devices) || devices.length === 0 || devices.length > 50) {
    return res.status(400).json({ message: 'Selecione entre 1 e 50 devices.' })
  }
  const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!startTime || !TIME_REGEX.test(String(startTime))) {
    return res.status(400).json({ message: 'startTime inválido. Use o formato HH:MM.' })
  }
  if (!endTime || !TIME_REGEX.test(String(endTime))) {
    return res.status(400).json({ message: 'endTime inválido. Use o formato HH:MM.' })
  }
  const pct = Number(percentage)
  if (isNaN(pct) || pct < 0 || pct > 100) {
    return res.status(400).json({ message: 'Porcentagem deve ser entre 0 e 100.' })
  }

  const record = {
    id: `CO-${crypto.randomBytes(4).toString('hex')}`,
    school: cleanSchool,
    devices: devices.map(d => String(d).trim()).filter(Boolean),
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
