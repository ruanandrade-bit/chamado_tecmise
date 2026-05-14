import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

function validMonthYear(month, year) {
  return Number.isInteger(month) && Number.isInteger(year) && month >= 1 && month <= 12 && year >= 2000 && year <= 3000
}

// GET /api/reports/monthly?month=4&year=2026
router.get('/monthly', authRequired, (req, res) => {
  const month = Number(req.query.month)
  const year = Number(req.query.year)

  if (!validMonthYear(month, year)) {
    return res.status(400).json({ message: 'Parâmetros month/year inválidos.' })
  }

  const report = memoryStore.getMonthlyReport(month, year)
  res.json(report)
})

// POST /api/reports/monthly — admin only
router.post('/monthly', authRequired, adminOnly, (req, res) => {
  const month = Number(req.body?.month)
  const year = Number(req.body?.year)
  const observation = req.body?.observation
  const school = String(req.body?.school || '').trim()
  const assignee = String(req.body?.assignee || '').trim()

  if (!validMonthYear(month, year) || !observation?.trim()) {
    return res.status(400).json({ message: 'Parâmetros month, year e observation são obrigatórios.' })
  }

  const report = memoryStore.addMonthlyObservation(month, year, observation.trim(), req.user, {
    school,
    assignee
  })
  res.json(report)
})

// DELETE /api/reports/monthly/:month/:year/:observationId — admin only
router.delete('/monthly/:month/:year/:observationId', authRequired, adminOnly, (req, res) => {
  const month = Number(req.params.month)
  const year = Number(req.params.year)
  const observationId = Number(req.params.observationId)

  if (!validMonthYear(month, year) || !observationId) {
    return res.status(400).json({ message: 'Parâmetros inválidos.' })
  }

  const report = memoryStore.deleteMonthlyObservation(month, year, observationId)
  if (!report) {
    return res.status(404).json({ message: 'Observação não encontrada.' })
  }
  res.json(report)
})

// PUT /api/reports/monthly/:month/:year/:observationId — admin only
router.put('/monthly/:month/:year/:observationId', authRequired, adminOnly, (req, res) => {
  const month = Number(req.params.month)
  const year = Number(req.params.year)
  const observationId = Number(req.params.observationId)
  const text = req.body?.text
  const school = String(req.body?.school || '').trim()
  const assignee = String(req.body?.assignee || '').trim()

  if (!validMonthYear(month, year) || !observationId || !text?.trim()) {
    return res.status(400).json({ message: 'Parâmetros inválidos.' })
  }

  const report = memoryStore.editMonthlyObservation(month, year, observationId, {
    text: text.trim(),
    school,
    assignee
  })
  if (!report) {
    return res.status(404).json({ message: 'Observação não encontrada.' })
  }
  res.json(report)
})

// PATCH /api/reports/monthly/:month/:year/:observationId/pin — admin only
router.patch('/monthly/:month/:year/:observationId/pin', authRequired, adminOnly, (req, res) => {
  const month = Number(req.params.month)
  const year = Number(req.params.year)
  const observationId = Number(req.params.observationId)
  const pinned = req.body?.pinned

  if (!validMonthYear(month, year) || !observationId || typeof pinned !== 'boolean') {
    return res.status(400).json({ message: 'Parâmetros inválidos.' })
  }

  const report = memoryStore.setMonthlyObservationPinned(month, year, observationId, pinned)
  if (!report) {
    return res.status(404).json({ message: 'Observação não encontrada.' })
  }

  res.json(report)
})

// GET /api/reports/years — returns available years with tickets
router.get('/years', authRequired, (req, res) => {
  const years = memoryStore.getYearsWithTickets()
  res.json({ years })
})

export default router
