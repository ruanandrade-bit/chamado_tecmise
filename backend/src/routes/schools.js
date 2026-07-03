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
  if (!schoolData || typeof schoolData !== 'object' || Array.isArray(schoolData)) {
    return res.status(400).json({ message: 'schoolData deve ser um objeto.' })
  }

  const schoolNames = Object.keys(schoolData)
  if (schoolNames.length > 200) {
    return res.status(400).json({ message: 'schoolData excede o limite de 200 escolas.' })
  }

  const sanitized = {}
  for (const schoolName of schoolNames) {
    const cleanName = String(schoolName).trim()
    if (!cleanName || cleanName.length > 200) {
      return res.status(400).json({ message: `Nome de escola inválido: "${schoolName}".` })
    }

    const devices = schoolData[schoolName]
    if (!devices || typeof devices !== 'object' || Array.isArray(devices)) {
      return res.status(400).json({ message: `Dados inválidos para a escola "${cleanName}".` })
    }

    const deviceNames = Object.keys(devices)
    if (deviceNames.length > 500) {
      return res.status(400).json({ message: `Escola "${cleanName}" excede o limite de 500 devices.` })
    }

    sanitized[cleanName] = {}
    for (const deviceName of deviceNames) {
      const cleanDevice = String(deviceName).trim()
      if (!cleanDevice || cleanDevice.length > 50) {
        return res.status(400).json({ message: `Nome de device inválido em "${cleanName}": "${deviceName}".` })
      }

      const classrooms = devices[deviceName]
      if (!Array.isArray(classrooms)) {
        return res.status(400).json({ message: `Turmas do device "${cleanDevice}" em "${cleanName}" devem ser um array.` })
      }
      if (classrooms.length > 100) {
        return res.status(400).json({ message: `Device "${cleanDevice}" excede o limite de 100 turmas.` })
      }

      sanitized[cleanName][cleanDevice] = classrooms.map(c => String(c).trim()).filter(Boolean)
    }
  }

  const updated = memoryStore.setSchoolData(sanitized)
  res.json(updated)
})

export default router
