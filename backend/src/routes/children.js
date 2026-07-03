import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import crypto from 'node:crypto'

const router = Router()
router.use(authRequired)
router.use(adminOnly)

const reportTypeOptions = ['Resumo mensal', 'Individual']
const caseOriginOptions = ['Identificação interna', 'Solicitado pela escola']
const priorityTypeOptions = ['Normal', 'Prioridade', 'Urgente']
const parecerStatusOptions = ['Pendente', 'Em Análise', 'Concluído']
const deliverySituationOptions = ['Aguardando escola', 'Reunião agendada', 'Reagendado']
const deliveredOptions = ['SIM', 'NÃO']

function normalizeText(value) {
  return String(value || '').trim()
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''))
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
  const category = normalizeText(payload?.category) || 'Criança Psicóloga'
  const reportType = normalizeText(payload?.reportType)
  const caseOrigin = normalizeText(payload?.caseOrigin)
  const priorityType = normalizeText(payload?.priorityType)
  const parecerStatus = normalizeText(payload?.parecerStatus)
  const analysisRequired = normalizeText(payload?.analysisRequired)
  const periodStart = normalizeText(payload?.periodStart)
  const periodEnd = normalizeText(payload?.periodEnd)
  const periodDone = normalizeText(payload?.periodDone)
  const finalizedAt = normalizeText(payload?.finalizedAt)
  const deliverySituation = normalizeText(payload?.deliverySituation)
  const scheduledDate = normalizeText(payload?.scheduledDate)
  const scheduledTime = normalizeText(payload?.scheduledTime)
  const delivered = normalizeText(payload?.delivered)
  const completedStatus = normalizeText(payload?.completedStatus)
  const observations = normalizeText(payload?.observations)

  if (!name) return { ok: false, message: 'Nome da criança é obrigatório.' }
  if (!school) return { ok: false, message: 'Escola é obrigatória.' }
  if (!turma) return { ok: false, message: 'Turma é obrigatória.' }
  if (!reportType) return { ok: false, message: 'Tipo de relatório é obrigatório.' }
  if (!reportTypeOptions.includes(reportType)) return { ok: false, message: 'Tipo de relatório inválido.' }
  if (!['Criança Psicóloga', 'Gabi', 'Jessica', 'Beatriz'].includes(category)) {
    return { ok: false, message: 'Categoria inválida.' }
  }

  const schoolData = memoryStore.getSchoolData()
  if (!schoolData?.[school]) return { ok: false, message: 'Escola não encontrada.' }

  const validTurmas = getTurmasForSchool(school)
  if (!validTurmas.includes(turma)) return { ok: false, message: 'Turma não encontrada para esta escola.' }

  if (caseOrigin && !caseOriginOptions.includes(caseOrigin)) return { ok: false, message: 'Origem do caso inválida.' }
  if (priorityType && !priorityTypeOptions.includes(priorityType)) return { ok: false, message: 'Tipo de prioridade inválido.' }
  if (parecerStatus && !parecerStatusOptions.includes(parecerStatus)) return { ok: false, message: 'Status do parecer inválido.' }
  if (deliverySituation && !deliverySituationOptions.includes(deliverySituation)) return { ok: false, message: 'Situação da entrega inválida.' }
  if (delivered && !deliveredOptions.includes(delivered)) return { ok: false, message: 'Valor de entregue inválido.' }
  if (finalizedAt && !isIsoDate(finalizedAt)) return { ok: false, message: 'Data de finalização inválida.' }
  if (scheduledDate && !isIsoDate(scheduledDate)) return { ok: false, message: 'Data do agendamento inválida.' }
  if (scheduledTime && !isTime(scheduledTime)) return { ok: false, message: 'Hora do agendamento inválida.' }

  return {
    ok: true,
    value: {
      name,
      school,
      turma,
      category,
      reportType,
      caseOrigin,
      priorityType,
      parecerStatus,
      analysisRequired,
      periodStart,
      periodEnd,
      periodDone,
      finalizedAt,
      deliverySituation,
      scheduledDate,
      scheduledTime,
      delivered,
      completedStatus,
      observations
    }
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
    userName: req.user?.name || 'Desconhecido',
    userEmail: req.user?.email || '',
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

  const updated = memoryStore.updateChild(req.params.id, {
    ...validation.value,
    name: current.name,
    userName: req.user?.name || current.userName || current.responsible || 'Desconhecido',
    userEmail: req.user?.email || current.userEmail || current.createdByEmail || ''
  })
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  const isAdmin = req.user?.role === 'Admin'
  if (!isAdmin) {
    return res.status(403).json({ message: 'Apenas administradores podem excluir crianças.' })
  }
  const deleted = memoryStore.deleteChild(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Criança não encontrada.' })
  res.json({ success: true })
})

export default router
