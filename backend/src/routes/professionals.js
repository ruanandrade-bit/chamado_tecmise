import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'
import { USERS } from '../data/mockData.js'
import { hashPassword } from '../utils/password.js'

const router = Router()

function normalizeEmailValue(value) {
  return String(value || '').trim().toLowerCase()
}

function slugifyName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.')
}

function buildEmailFromName(name, usedEmails) {
  const baseSlug = slugifyName(name) || 'usuario'
  const domain = '@s4s.com'
  let candidate = `${baseSlug}${domain}`
  let counter = 2

  while (usedEmails.has(candidate) || USERS[candidate]) {
    candidate = `${baseSlug}${counter}${domain}`
    counter += 1
  }

  return candidate
}

function sanitizeForClient(item) {
  return {
    id: item.id,
    name: item.name,
    role: item.role,
    email: item.email || ''
  }
}

function findUserByName(name) {
  const target = String(name || '').trim().toLowerCase()
  if (!target) return null

  for (const [email, user] of Object.entries(USERS)) {
    if (String(user?.name || '').trim().toLowerCase() === target) {
      return { email, user }
    }
  }

  return null
}

// GET /api/professionals
router.get('/', authRequired, (_req, res) => {
  const professionals = memoryStore.getProfessionals()
  res.json({ professionals: professionals.map(sanitizeForClient) })
})

// PUT /api/professionals — admin only, replaces entire professionals list
router.put('/', authRequired, adminOnly, (req, res) => {
  const list = req.body?.professionals
  if (!Array.isArray(list)) {
    return res.status(400).json({ message: 'professionals deve ser um array.' })
  }

  let normalized = []
  try {
    const currentList = memoryStore.getProfessionals()
    const currentById = new Map(currentList.map((item) => [String(item.id), item]))
    const usedEmails = new Set()

    normalized = list
      .map((item, index) => {
        const id = String(item?.id || `manual-${Date.now()}-${index}`)
        const existing = currentById.get(id)
        const name = String(item?.name || '').trim()
        const role = String(item?.role || '').trim()
        if (!name || !role) return null

        const foundByName = findUserByName(name)
        let email = normalizeEmailValue(item?.email || existing?.email || foundByName?.email)
        if (!email) {
          email = buildEmailFromName(name, usedEmails)
        }

        usedEmails.add(email)

        const rawPassword = String(item?.password || '').trim()
        let passwordHash = String(existing?.passwordHash || item?.passwordHash || foundByName?.user?.passwordHash || USERS[email]?.passwordHash || '')

        if (rawPassword) {
          if (rawPassword.length < 6) {
            throw new Error(`Senha muito curta para ${name}. Use pelo menos 6 caracteres.`)
          }
          passwordHash = hashPassword(rawPassword)
        }

        const isNewProfessional = !existing
        if (isNewProfessional && !passwordHash) {
          throw new Error(`Informe uma senha para criar o usuário ${name}.`)
        }

        return {
          id,
          name,
          role,
          email,
          passwordHash
        }
      })
      .filter(Boolean)
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Dados inválidos para profissionais.' })
  }

  const duplicateEmail = normalized.find((item, index) => (
    normalized.findIndex((other) => other.email === item.email) !== index
  ))
  if (duplicateEmail) {
    return res.status(400).json({ message: `Email duplicado detectado: ${duplicateEmail.email}` })
  }

  const updated = memoryStore.setProfessionals(normalized)
  return res.json({ professionals: updated.map(sanitizeForClient) })
})

export default router
