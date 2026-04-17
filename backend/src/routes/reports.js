import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

// GET /api/reports/monthly?month=4&year=2026
router.get('/monthly', authRequired, (req, res) => {
  const month = Number(req.query.month)
  const year = Number(req.query.year)

  if (!month || !year) {
    return res.status(400).json({ message: 'Parâmetros month e year são obrigatórios.' })
  }

  const report = memoryStore.getMonthlyReport(month, year)
  res.json(report)
})

// POST /api/reports/monthly — admin only
router.post('/monthly', authRequired, adminOnly, (req, res) => {
  const { month, year, observation } = req.body

  if (!month || !year || !observation?.trim()) {
    return res.status(400).json({ message: 'Parâmetros month, year e observation são obrigatórios.' })
  }

  const report = memoryStore.addMonthlyObservation(month, year, observation.trim(), req.user)
  res.json(report)
})

// DELETE /api/reports/monthly/:month/:year/:observationId — admin only
router.delete('/monthly/:month/:year/:observationId', authRequired, adminOnly, (req, res) => {
  const month = Number(req.params.month)
  const year = Number(req.params.year)
  const observationId = Number(req.params.observationId)

  if (!month || !year || !observationId) {
    return res.status(400).json({ message: 'Parâmetros inválidos.' })
  }

  const report = memoryStore.deleteMonthlyObservation(month, year, observationId)
  if (!report) {
    return res.status(404).json({ message: 'Observação não encontrada.' })
  }
  res.json(report)
})

export default router
