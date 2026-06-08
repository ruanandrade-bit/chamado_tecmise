import { Router } from 'express'
import { authRequired, pedagogaOrPsicologaOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)
router.use(pedagogaOrPsicologaOnly)

function normalizeText(value) {
  return String(value || '').trim()
}

function getTurmasForSchool(schoolName) {
  const schoolData = memoryStore.getSchoolData()
  const devices = schoolData?.[schoolName] || {}
  return Array.from(new Set(
    Object.values(devices)
      .flatMap((turmas) => Array.isArray(turmas) ? turmas : [])
      .map((turma) => String(turma || '').trim())
      .filter(Boolean)
  ))
}

function validateChildPayload(payload) {
  const name = normalizeText(payload?.name)
  const school = normalizeText(payload?.school)
  const turma = normalizeText(payload?.turma)
  const birthDate = normalizeText(payload?.birthDate)
  const responsible = normalizeText(payload?.responsible)
  const observations = normalizeText(payload?.observations)

  if (!name) return { ok: false, message: 'Nome da criança é obrigatório.' }
  if (!school) return { ok: false, message: 'Escola é obrigatória.' }
  if (!turma) return { ok: false, message: 'Turma é obrigatória.' }

  const schoolData = memoryStore.getSchoolData()
  if (!schoolData?.[school]) return { ok: false, message: 'Escola não encontrada.' }

  const validTurmas = getTurmasForSchool(school)
  if (!validTurmas.includes(turma)) return { ok: false, message: 'Turma não encontrada para esta escola.' }

  return {
    ok: true,
    value: { name, school, turma, birthDate, responsible, observations }
  }
}

router.get('/', (_req, res) => {
  res.json(memoryStore.getChildren())
  memoryStore.refreshCollaborativeData().catch(() => {})
})

router.post('/', (req, res) => {
  const validation = validateChildPayload(req.body)
  if (!validation.ok) return res.status(400).json({ message: validation.message })

  const child = {
    id: `CH-${crypto.randomBytes(4).toString('hex')}`,
    ...validation.value,
    createdBy: req.user?.name || 'Desconhecido',
    createdByEmail: req.user?.email || '',
    createdAt: new Date().toISOString()
  }

  const created = memoryStore.addChild(child)
  res.status(201).json(created)
})

router.put('/:id', (req, res) => {
  const current = memoryStore.getChildren().find((child) => child.id === req.params.id)
  if (!current) return res.status(404).json({ message: 'Criança não encontrada.' })

  const validation = validateChildPayload({ ...current, ...req.body })
  if (!validation.ok) return res.status(400).json({ message: validation.message })

  const updated = memoryStore.updateChild(req.params.id, validation.value)
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  const deleted = memoryStore.deleteChild(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Criança não encontrada.' })
  res.json({ success: true })
})

export default router
