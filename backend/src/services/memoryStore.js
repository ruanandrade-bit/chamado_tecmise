import { MongoClient } from 'mongodb'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { USERS, STATUSES, TICKETS } from '../data/mockData.js'

// ─── File persistence (fallback for local dev) ──────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const STORE_PATH = join(DATA_DIR, 'store.json')
const LEGACY_KANBAN_SEED_IDS = new Set(['KB-001', 'KB-002', 'KB-003', 'KB-004', 'KB-005', 'KB-006'])

function loadFromDisk() {
  try {
    if (existsSync(STORE_PATH)) {
      const raw = readFileSync(STORE_PATH, 'utf-8')
      const data = JSON.parse(raw)
      if (Array.isArray(data.tickets)) {
        console.log(`[store] 📁 Loaded ${data.tickets.length} tickets from disk.`)
        return {
          tickets: data.tickets,
          notifications: data.notifications || [],
          monthlyReports: data.monthlyReports || {},
          inventory: data.inventory || null,
          schoolData: data.schoolData || null,
          professionals: Array.isArray(data.professionals) ? data.professionals : null,
          cameraObstructions: Array.isArray(data.cameraObstructions) ? data.cameraObstructions : [],
          notes: Array.isArray(data.notes) ? data.notes : [],
          deadlines: Array.isArray(data.deadlines) ? data.deadlines : [],
          kanbanTasks: Array.isArray(data.kanbanTasks) ? data.kanbanTasks : []
        }
      }
    }
  } catch (err) {
    console.warn('[store] ⚠️  Could not read store.json:', err.message)
  }
  return null
}

function saveToDisk() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(STORE_PATH, JSON.stringify({
      tickets: state.tickets,
      notifications: state.notifications,
      monthlyReports: state.monthlyReports,
      inventory: state.inventory,
      schoolData: state.schoolData,
      professionals: state.professionals,
      cameraObstructions: state.cameraObstructions,
      notes: state.notes,
      deadlines: state.deadlines,
      kanbanTasks: state.kanbanTasks,
      _savedAt: new Date().toISOString()
    }, null, 2))
  } catch (err) {
    console.error('[store] ❌ Failed to save to disk:', err.message)
  }
}

// ─── MongoDB persistence (production) ───────────────────────────────
let mongoCollection = null

async function connectMongo() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.log('[store] ℹ️  MONGODB_URI not set — using local JSON file only.')
    return false
  }

  try {
    const client = new MongoClient(uri)
    await client.connect()
    mongoCollection = client.db('s4s_chamados').collection('state')
    console.log('[store] ✅ Connected to MongoDB Atlas.')
    return true
  } catch (err) {
    console.error('[store] ❌ MongoDB connection failed:', err.message)
    return false
  }
}

async function loadFromMongo() {
  if (!mongoCollection) return null
  try {
    const doc = await mongoCollection.findOne({ _id: 'app_state' })
    if (doc && Array.isArray(doc.tickets)) {
      console.log(`[store] ☁️  Loaded ${doc.tickets.length} tickets from MongoDB.`)
      return {
        tickets: doc.tickets,
        notifications: doc.notifications || [],
        monthlyReports: doc.monthlyReports || {},
        inventory: doc.inventory || null,
        schoolData: doc.schoolData || null,
        professionals: Array.isArray(doc.professionals) ? doc.professionals : null,
        cameraObstructions: Array.isArray(doc.cameraObstructions) ? doc.cameraObstructions : [],
        notes: Array.isArray(doc.notes) ? doc.notes : [],
        deadlines: Array.isArray(doc.deadlines) ? doc.deadlines : [],
        kanbanTasks: Array.isArray(doc.kanbanTasks) ? doc.kanbanTasks : []
      }
    }
  } catch (err) {
    console.warn('[store] ⚠️  Failed to load from MongoDB:', err.message)
  }
  return null
}

async function saveToMongoNow() {
  if (!mongoCollection) return false
  await mongoCollection.replaceOne(
    { _id: 'app_state' },
    {
      _id: 'app_state',
      tickets: state.tickets,
      notifications: state.notifications,
      monthlyReports: state.monthlyReports,
      inventory: state.inventory,
      schoolData: state.schoolData,
      professionals: state.professionals,
      cameraObstructions: state.cameraObstructions,
      notes: state.notes,
      deadlines: state.deadlines,
      kanbanTasks: state.kanbanTasks,
      _savedAt: new Date()
    },
    { upsert: true }
  )
  return true
}

function saveToMongo() {
  saveToMongoNow().catch((err) => {
    console.error('[store] ❌ MongoDB save failed:', err.message)
  })
}

// ─── Unified persistence ────────────────────────────────────────────
function persistState() {
  saveToMongo()
  saveToDisk()
}

// ─── State ──────────────────────────────────────────────────────────
const state = {
  tickets: structuredClone(TICKETS),
  notifications: [],
  monthlyReports: {},   // key: "month-year" → { observations: [...] }
  inventory: null,      // will be initialized with defaults on first access
  schoolData: null,     // school→device→turma config, managed via admin panel
  professionals: null,  // [{ id, name, role }], managed via admin panel
  cameraObstructions: [], // [{ id, school, devices, startTime, endTime, percentage, createdAt, createdBy }]
  notes: [],             // [{ id, title, description, category, author, authorRole, ... }]
  deadlines: [],         // [{ id, title, date, time, category, status, priority, author, createdAt }]
  kanbanTasks: []        // [{ id, title, description, status, priority, date, tags, responsible, author, createdAt }]
}

function stripLegacyKanbanSeedTasks() {
  const current = Array.isArray(state.kanbanTasks) ? state.kanbanTasks : []
  const cleaned = current.filter((task) => !LEGACY_KANBAN_SEED_IDS.has(String(task?.id || '')))
  const changed = cleaned.length !== current.length
  if (changed) state.kanbanTasks = cleaned
  return changed
}

function syncCollaborationCollections(source) {
  const payload = source || {}
  state.notes = Array.isArray(payload.notes) ? payload.notes : []
  state.deadlines = Array.isArray(payload.deadlines) ? payload.deadlines : []
  state.kanbanTasks = Array.isArray(payload.kanbanTasks) ? payload.kanbanTasks : []
  stripLegacyKanbanSeedTasks()
}

const CORE_USER_EMAILS = new Set(Object.keys(USERS))

function hydrateProfessionalsFromUsers() {
  if (!Array.isArray(state.professionals)) {
    state.professionals = []
    return
  }

  const usedEmails = new Set()
  const usersByName = Object.entries(USERS).reduce((acc, [email, user]) => {
    const key = String(user?.name || '').trim().toLowerCase()
    if (key && !acc.has(key)) acc.set(key, { email, user })
    return acc
  }, new Map())

  state.professionals = state.professionals
    .map((item, index) => {
      const id = String(item?.id || `manual-${Date.now()}-${index}`)
      const name = String(item?.name || '').trim()
      const role = String(item?.role || '').trim()
      if (!name || !role) return null

      const byName = usersByName.get(name.toLowerCase())
      let email = String(item?.email || byName?.email || '').trim().toLowerCase()
      if (email && usedEmails.has(email)) email = ''
      if (email) usedEmails.add(email)

      const fromEmailUser = email ? USERS[email] : null
      const passwordHash = String(item?.passwordHash || fromEmailUser?.passwordHash || byName?.user?.passwordHash || '')

      return {
        id,
        name,
        role,
        email,
        companyEmail: String(item?.companyEmail || '').trim(),
        passwordHash
      }
    })
    .filter(Boolean)
}

function syncUsersFromProfessionals() {
  if (!Array.isArray(state.professionals)) return

  const managedEmails = new Set()
  let nextUserId = Object.values(USERS).reduce((max, user) => (
    Number.isInteger(user?.id) ? Math.max(max, user.id) : max
  ), 0)

  for (const item of state.professionals) {
    const name = String(item?.name || '').trim()
    const role = String(item?.role || '').trim()
    const email = String(item?.email || '').trim().toLowerCase()
    if (!name || !role || !email) continue

    const existing = USERS[email]
    const passwordHash = String(item?.passwordHash || existing?.passwordHash || '')
    if (!passwordHash) continue

    const isCoreUser = CORE_USER_EMAILS.has(email)
    const id = Number.isInteger(existing?.id) ? existing.id : ++nextUserId

    USERS[email] = {
      id,
      name,
      role,
      passwordHash,
      canDragDrop: Boolean(existing?.canDragDrop || false),
      viewOnly: Boolean(existing?.viewOnly || false),
      managedByProfessionals: !isCoreUser
    }

    item.passwordHash = passwordHash
    managedEmails.add(email)
  }

  for (const [email, user] of Object.entries(USERS)) {
    if (user?.managedByProfessionals && !managedEmails.has(email)) {
      delete USERS[email]
    }
  }
}

/**
 * Must be called once before the server starts listening.
 * Connects to MongoDB (if configured) and loads persisted data.
 */
export async function initStore() {
  const connected = await connectMongo()

  // Priority: MongoDB → JSON file → mock data
  const mongoData = connected ? await loadFromMongo() : null
  const diskData = !mongoData ? loadFromDisk() : null

  if (mongoData) {
    state.tickets = mongoData.tickets
    state.notifications = mongoData.notifications
    state.monthlyReports = mongoData.monthlyReports
    state.cameraObstructions = Array.isArray(mongoData.cameraObstructions)
      ? mongoData.cameraObstructions
      : []
    if (mongoData.inventory) state.inventory = mongoData.inventory
    if (mongoData.schoolData) state.schoolData = mongoData.schoolData
    if (mongoData.professionals) state.professionals = mongoData.professionals
    if (Array.isArray(mongoData.notes)) state.notes = mongoData.notes
    if (Array.isArray(mongoData.deadlines)) state.deadlines = mongoData.deadlines
    if (Array.isArray(mongoData.kanbanTasks)) state.kanbanTasks = mongoData.kanbanTasks
  } else if (diskData) {
    state.tickets = diskData.tickets
    state.notifications = diskData.notifications
    state.monthlyReports = diskData.monthlyReports
    state.cameraObstructions = Array.isArray(diskData.cameraObstructions)
      ? diskData.cameraObstructions
      : []
    if (diskData.inventory) state.inventory = diskData.inventory
    if (diskData.schoolData) state.schoolData = diskData.schoolData
    if (diskData.professionals) state.professionals = diskData.professionals
    if (Array.isArray(diskData.notes)) state.notes = diskData.notes
    if (Array.isArray(diskData.deadlines)) state.deadlines = diskData.deadlines
    if (Array.isArray(diskData.kanbanTasks)) state.kanbanTasks = diskData.kanbanTasks
    // Seed MongoDB if it's empty but connected
    if (connected) {
      console.log('[store] 🔄 Syncing disk data to MongoDB...')
      saveToMongo()
    }
  } else {
    console.log('[store] 🆕 First run — initializing empty Kanban/Notas/Prazos.')
    persistState()
  }

  const removedLegacyKanbanSeeds = stripLegacyKanbanSeedTasks()
  if (removedLegacyKanbanSeeds) {
    console.log('[store] 🧹 Removed legacy seeded Kanban tasks (KB-001..KB-006).')
  }

  if (!Array.isArray(state.professionals) || state.professionals.length === 0) {
    state.professionals = DEFAULT_PROFESSIONALS
  } else {
    hydrateProfessionalsFromUsers()
  }

  syncUsersFromProfessionals()
  persistState()
}

// ─── Helpers ────────────────────────────────────────────────────────
function nextTicketId() {
  const maxId = state.tickets.reduce((max, ticket) => {
    const numeric = Number.parseInt(ticket.id.split('-')[1], 10)
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max
  }, 0)

  return `S4S-${String(maxId + 1).padStart(3, '0')}`
}

function addHistory(ticket, action, by) {
  ticket.history = [...(ticket.history || []), { action, by, date: new Date().toISOString() }]
}

function monthlyKey(month, year) {
  return `${month}-${year}`
}

function countOpenedTicketsInMonth(month, year) {
  return state.tickets.reduce((acc, ticket) => {
    const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null
    if (!createdAt || Number.isNaN(createdAt.getTime())) return acc
    const ticketMonth = createdAt.getMonth() + 1
    const ticketYear = createdAt.getFullYear()
    return (ticketMonth === month && ticketYear === year) ? acc + 1 : acc
  }, 0)
}

function parseTimestamp(value) {
  if (value === undefined || value === null || value === '') return null

  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) return numeric

  const parsed = new Date(String(value))
  const parsedMs = parsed.getTime()
  return Number.isNaN(parsedMs) ? null : parsedMs
}

/**
 * Find a user's email by their display name.
 * Used as fallback when ticket.createdByEmail is missing (legacy tickets).
 */
function findEmailByName(name) {
  if (!name) return null
  for (const [email, user] of Object.entries(USERS)) {
    if (user.name === name) return email
  }
  return null
}

// ─── Public store ───────────────────────────────────────────────────
export const memoryStore = {
  getTickets(filters = {}) {
    const { status, responsible, searchTerm } = filters

    return state.tickets.filter((ticket) => {
      if (status && ticket.status !== status) return false
      if (responsible && ticket.responsible !== responsible) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          ticket.id.toLowerCase().includes(term)
          || ticket.school.toLowerCase().includes(term)
          || ticket.classroom.toLowerCase().includes(term)
        )
      }
      return true
    })
  },

  getTicketById(id) {
    return state.tickets.find((ticket) => ticket.id === id) || null
  },

  createTicket(payload, currentUser) {
    const id = nextTicketId()
    const ticket = {
      id,
      school: payload.school,
      classroom: payload.classroom,
      device: String(payload.device),
      period: payload.period || 'Matutino',
      problemType: payload.problemType || '',
      description: payload.description,
      responsible: currentUser.name,
      createdByEmail: currentUser.email || null,
      priority: payload.priority || 'media',
      status: 'sem-status',
      createdAt: new Date().toISOString(),
      attachments: payload.attachments || [],
      checklist: [],
      comments: [],
      notes: '',
      history: [{ action: 'Criado', by: currentUser.name, date: new Date().toISOString() }]
    }

    state.tickets.unshift(ticket)

    // Increment the persistent monthly ticket counter
    const now = new Date()
    const monthKey = `${now.getMonth() + 1}-${now.getFullYear()}`
    if (!state.monthlyReports[monthKey]) {
      state.monthlyReports[monthKey] = { month: now.getMonth() + 1, year: now.getFullYear(), observations: [], ticketCount: 0 }
    }
    state.monthlyReports[monthKey].ticketCount = (state.monthlyReports[monthKey].ticketCount || 0) + 1

    persistState()

    memoryStore.pushNotification({
      title: '🆕 Novo Chamado',
      message: `${ticket.id} criado por ${currentUser.name}`,
      type: 'success',
      targetUserEmail: 'ruan@s4s.com'
    })

    return ticket
  },

  updateTicket(id, updates, by = 'Sistema') {
    const ticket = memoryStore.getTicketById(id)
    if (!ticket) return null

    // Don't pollute history when only comments or attachments change
    const silentKeys = ['comments', 'attachments']
    const updateKeys = Object.keys(updates)
    const isSilentUpdate = updateKeys.length === 1 && silentKeys.includes(updateKeys[0])
    Object.assign(ticket, updates)
    if (!isSilentUpdate) {
      addHistory(ticket, 'Atualizado', by)
    }
    persistState()
    return ticket
  },

  moveTicket(id, status, by = 'Sistema') {
    const ticket = memoryStore.getTicketById(id)
    if (!ticket) return null

    const actorName = typeof by === 'object' ? by.name : by
    const actorEmail = typeof by === 'object' ? by.email : null

    ticket.status = status
    const label = STATUSES.find((s) => s.value === status)?.label || status
    addHistory(ticket, `Movido para ${label}`, actorName || 'Sistema')

    // Record when the ticket was resolved
    if (status === 'resolvido') {
      ticket.resolvedAt = new Date().toISOString()
    }

    persistState()

    if (status === 'resolvido') {
      // Send notification to the ticket creator, not to the admin who resolved it.
      // Fallback: if createdByEmail is missing (legacy tickets), look up by responsible name.
      const creatorEmail = ticket.createdByEmail || findEmailByName(ticket.responsible) || null
      if (creatorEmail && creatorEmail !== actorEmail) {
        memoryStore.pushNotification({
          title: '✅ Chamado Resolvido',
          message: `O chamado ${ticket.id} foi resolvido!`,
          type: 'success',
          targetUserEmail: creatorEmail
        })
      }
    }

    return ticket
  },

  toggleChecklist(ticketId, itemId, completed) {
    const ticket = memoryStore.getTicketById(ticketId)
    if (!ticket) return null

    ticket.checklist = ticket.checklist.map((item) => (
      item.id === itemId ? { ...item, completed } : item
    ))

    persistState()
    return ticket
  },

  addChecklistItem(ticketId, title) {
    const ticket = memoryStore.getTicketById(ticketId)
    if (!ticket) return null

    const nextId = Math.max(0, ...ticket.checklist.map((item) => item.id)) + 1
    const item = { id: nextId, title, completed: false }
    ticket.checklist = [...ticket.checklist, item]

    persistState()
    return ticket
  },

  removeChecklistItem(ticketId, itemId) {
    const ticket = memoryStore.getTicketById(ticketId)
    if (!ticket) return null

    ticket.checklist = (ticket.checklist || []).filter((item) => item.id !== itemId)
    persistState()
    return ticket
  },

  deleteTicket(id) {
    const index = state.tickets.findIndex((ticket) => ticket.id === id)
    if (index === -1) return false
    state.tickets.splice(index, 1)
    persistState()
    return true
  },

  getStats() {
    const total = state.tickets.length
    const resolved = state.tickets.filter((t) => t.status === 'resolvido').length
    const inProgress = state.tickets.filter((t) => (
      t.status !== 'sem-status' && t.status !== 'resolvido' && t.status !== 'recebido'
    )).length

    return {
      total,
      resolved,
      inProgress,
      pending: total - resolved - inProgress,
      byResponsible: state.tickets.reduce((acc, ticket) => {
        acc[ticket.responsible] = (acc[ticket.responsible] || 0) + 1
        return acc
      }, {})
    }
  },

  getGroupedByStatus(filters = {}) {
    const grouped = Object.fromEntries(STATUSES.map((status) => [status.value, []]))

    memoryStore.getTickets(filters).forEach((ticket) => {
      if (grouped[ticket.status]) grouped[ticket.status].push(ticket)
    })

    return grouped
  },

  pushNotification(notification) {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...notification
    }
    state.notifications.push(entry)
    state.notifications = state.notifications.slice(-500)
    persistState()
    return entry
  },

  getNotifications(userEmail, options = {}) {
    const sinceMs = parseTimestamp(options.since)
    const limitValue = Number.parseInt(options.limit, 10)
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 200) : 50

    const visible = state.notifications.filter((note) => {
      const isForUser = !note.targetUserEmail || note.targetUserEmail === userEmail
      if (!isForUser) return false

      if (sinceMs === null) return true
      const noteTimestampMs = parseTimestamp(note.timestamp)
      return noteTimestampMs !== null && noteTimestampMs > sinceMs
    })

    visible.sort((a, b) => {
      const left = parseTimestamp(a.timestamp) || 0
      const right = parseTimestamp(b.timestamp) || 0
      return left - right
    })

    return visible.slice(-limit)
  },

  statuses: STATUSES,

  // ─── Monthly Reports ────────────────────────────────────────────
  getMonthlyReport(month, year) {
    const key = monthlyKey(month, year)
    const existing = state.monthlyReports[key] || { month, year, observations: [], ticketCount: 0 }
    const storedCount = Number(existing.ticketCount || 0)
    const derivedCount = countOpenedTicketsInMonth(month, year)
    const normalizedObservations = (Array.isArray(existing.observations) ? existing.observations : []).map((obs) => ({
      ...obs,
      pinned: Boolean(obs?.pinned)
    }))

    return {
      ...existing,
      month,
      year,
      observations: normalizedObservations,
      ticketCount: Math.max(storedCount, derivedCount)
    }
  },

  addMonthlyObservation(month, year, text, user, metadata = {}) {
    const key = monthlyKey(month, year)
    if (!state.monthlyReports[key]) {
      state.monthlyReports[key] = { month, year, observations: [] }
    }

    const school = String(metadata.school || '').trim()
    const assignee = String(metadata.assignee || '').trim()

    const observation = {
      id: Date.now() + Math.random(),
      text,
      author: user.name,
      school: school || null,
      assignee: assignee || null,
      pinned: false,
      createdAt: new Date().toISOString()
    }

    state.monthlyReports[key].observations.push(observation)
    persistState()
    return memoryStore.getMonthlyReport(month, year)
  },

  deleteMonthlyObservation(month, year, observationId) {
    const key = monthlyKey(month, year)
    const report = state.monthlyReports[key]
    if (!report) return null

    const idx = report.observations.findIndex((o) => o.id === observationId)
    if (idx === -1) return null

    report.observations.splice(idx, 1)
    persistState()
    return memoryStore.getMonthlyReport(month, year)
  },

  editMonthlyObservation(month, year, observationId, updates = {}) {
    const key = monthlyKey(month, year)
    const report = state.monthlyReports[key]
    if (!report) return null

    const obs = report.observations.find((o) => o.id === observationId)
    if (!obs) return null

    const nextText = String(updates.text || '').trim()
    const school = String(updates.school || '').trim()
    const assignee = String(updates.assignee || '').trim()

    const normalizedSchool = school || null
    const normalizedAssignee = assignee || null

    const currentText = String(obs.text || '').trim()
    const currentSchool = obs.school ? String(obs.school).trim() : null
    const currentAssignee = obs.assignee ? String(obs.assignee).trim() : null

    const hasChanges = (
      (nextText ? nextText : currentText) !== currentText
      || normalizedSchool !== currentSchool
      || normalizedAssignee !== currentAssignee
    )

    if (!hasChanges) {
      return memoryStore.getMonthlyReport(month, year)
    }

    if (nextText) obs.text = nextText
    obs.school = normalizedSchool
    obs.assignee = normalizedAssignee
    obs.editedAt = new Date().toISOString()
    persistState()
    return memoryStore.getMonthlyReport(month, year)
  },

  setMonthlyObservationPinned(month, year, observationId, pinned) {
    const key = monthlyKey(month, year)
    const report = state.monthlyReports[key]
    if (!report) return null

    const obs = report.observations.find((o) => o.id === observationId)
    if (!obs) return null

    obs.pinned = Boolean(pinned)
    persistState()
    return memoryStore.getMonthlyReport(month, year)
  },

  // ─── Inventory ─────────────────────────────────────────────────────
  getInventory(defaultItems) {
    if (!state.inventory) {
      state.inventory = structuredClone(defaultItems)
      persistState()
    } else {
      // Merge: add any new default items not yet in state
      const existingIds = new Set(state.inventory.map(i => i.id))
      for (const item of defaultItems) {
        if (!existingIds.has(item.id)) {
          state.inventory.push(structuredClone(item))
        }
      }
      // Sync display names with defaults
      const nameMap = new Map(defaultItems.map(i => [i.id, i.name]))
      for (const item of state.inventory) {
        if (nameMap.has(item.id)) item.name = nameMap.get(item.id)
      }
    }
    return state.inventory
  },

  createInventoryItem(name, quantity = 0) {
    if (!state.inventory) return null

    const cleanName = String(name || '').trim()
    if (!cleanName) return null

    const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0))
    const slug = cleanName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const baseId = `custom-${slug || 'item'}`
    let id = baseId
    let suffix = 2
    const usedIds = new Set(state.inventory.map(i => i.id))
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }

    state.inventory.push({
      id,
      name: cleanName,
      quantity: safeQuantity
    })
    persistState()
    return state.inventory
  },

  updateInventoryItem(id, quantity) {
    if (!state.inventory) return null
    const item = state.inventory.find(i => i.id === id)
    if (!item) return null
    item.quantity = Math.max(0, Math.floor(quantity))
    persistState()
    return state.inventory
  },

  renameInventoryItem(id, name) {
    if (!state.inventory) return null
    const item = state.inventory.find(i => i.id === id)
    if (!item) return null

    const cleanName = String(name || '').trim()
    if (!cleanName) return null

    item.name = cleanName
    persistState()
    return state.inventory
  },

  deleteInventoryItem(id) {
    if (!state.inventory) return null
    const index = state.inventory.findIndex(i => i.id === id)
    if (index < 0) return null

    state.inventory.splice(index, 1)
    persistState()
    return state.inventory
  },

  // ─── School / Device / Turma Config ────────────────────────────────
  getSchoolData() {
    if (!state.schoolData) {
      // Seed with the default configuration on first access
      state.schoolData = DEFAULT_SCHOOL_DATA
      persistState()
    }
    return state.schoolData
  },

  setSchoolData(newData) {
    state.schoolData = newData
    persistState()
    return state.schoolData
  },

  getProfessionals() {
    if (!Array.isArray(state.professionals) || state.professionals.length === 0) {
      state.professionals = DEFAULT_PROFESSIONALS
      hydrateProfessionalsFromUsers()
      syncUsersFromProfessionals()
      persistState()
    }
    return state.professionals
  },

  setProfessionals(newList) {
    state.professionals = Array.isArray(newList) ? newList : []
    hydrateProfessionalsFromUsers()
    syncUsersFromProfessionals()
    persistState()
    return state.professionals
  },

  // ─── Get Years with Tickets ────────────────────────────────────────
  getYearsWithTickets() {
    const yearsSet = new Set()

    state.tickets.forEach((ticket) => {
      const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const year = createdAt.getFullYear()
        yearsSet.add(year)
      }
    })

    Object.entries(state.monthlyReports || {}).forEach(([key, report]) => {
      const reportYear = Number(report?.year)
      if (Number.isInteger(reportYear)) {
        yearsSet.add(reportYear)
        return
      }

      const [, parsedYear] = String(key).split('-')
      const fallbackYear = Number(parsedYear)
      if (Number.isInteger(fallbackYear)) {
        yearsSet.add(fallbackYear)
      }
    })

    // Convert to array and sort descending
    const years = Array.from(yearsSet)
      .sort((a, b) => b - a)
      .map(year => String(year))

    return years
  },

  // ─── Camera Obstructions ──────────────────────────────────────────
  getCameraObstructions() {
    return state.cameraObstructions || []
  },

  addCameraObstruction(record) {
    if (!Array.isArray(state.cameraObstructions)) state.cameraObstructions = []
    state.cameraObstructions.push(record)
    persistState()
    return record
  },

  deleteCameraObstruction(id) {
    state.cameraObstructions = (state.cameraObstructions || []).filter(r => r.id !== id)
    persistState()
  },

  // ─── Notes (Anotações) ────────────────────────────────────────────
  getNotes() {
    return state.notes || []
  },

  addNote(note) {
    if (!Array.isArray(state.notes)) state.notes = []
    state.notes.unshift(note)
    persistState()
    return note
  },

  updateNote(id, updates) {
    const idx = (state.notes || []).findIndex(n => n.id === id)
    if (idx === -1) return null
    state.notes[idx] = { ...state.notes[idx], ...updates }
    persistState()
    return state.notes[idx]
  },

  deleteNote(id) {
    state.notes = (state.notes || []).filter(n => n.id !== id)
    persistState()
  },

  // ─── Deadlines (Datas & Prazos) ───────────────────────────────────
  getDeadlines() { return state.deadlines || [] },
  addDeadline(d) { if (!Array.isArray(state.deadlines)) state.deadlines = []; state.deadlines.unshift(d); persistState(); return d },
  updateDeadline(id, u) { const i = (state.deadlines||[]).findIndex(d=>d.id===id); if(i===-1) return null; state.deadlines[i]={...state.deadlines[i],...u}; persistState(); return state.deadlines[i] },
  deleteDeadline(id) { state.deadlines=(state.deadlines||[]).filter(d=>d.id!==id); persistState() },

  // ─── Pedagogical Kanban ───────────────────────────────────────────
  getKanbanTasks() {
    return state.kanbanTasks || []
  },
  addKanbanTask(t) {
    if (!Array.isArray(state.kanbanTasks)) state.kanbanTasks = []
    state.kanbanTasks.unshift(t)
    persistState()
    return t
  },
  updateKanbanTask(id, u) {
    const i = (state.kanbanTasks || []).findIndex(t => t.id === id)
    if (i === -1) return null
    state.kanbanTasks[i] = { ...state.kanbanTasks[i], ...u }
    persistState()
    return state.kanbanTasks[i]
  },
  deleteKanbanTask(id) {
    state.kanbanTasks = (state.kanbanTasks || []).filter(t => t.id !== id)
    persistState()
  },

  hasMongoPersistence() {
    return Boolean(mongoCollection)
  },

  async refreshCollaborativeData() {
    if (mongoCollection) {
      const mongoData = await loadFromMongo()
      if (mongoData) {
        syncCollaborationCollections(mongoData)
        return true
      }
    }

    const diskData = loadFromDisk()
    if (diskData) {
      syncCollaborationCollections(diskData)
      return true
    }

    return false
  },

  async ensureDurableCollaborativeData() {
    try {
      if (mongoCollection) {
        await saveToMongoNow()
      }
      saveToDisk()
      return true
    } catch (err) {
      console.error('[store] ❌ Failed to durably persist collaborative data:', err.message)
      return false
    }
  }
}

// ─── Default School Data (seeds once, then managed via admin panel) ──
const DEFAULT_SCHOOL_DATA = {
  'Colégio Graziela': {
    '012': ['1°A', '1°B'],
    '014': ['2°A', '3°B'],
  },
  'Colégio Antônio': {
    '013': ['5°Ano', '4°Ano'],
    '011': ['1°Ano', 'Infantil 5'],
  },
  'Colégio Grace': {
    '038': ['Infantil 5A', 'Infantil 5B'],
    '037': ['5°Ano A', '5°Ano B'],
    '032': ['9°Ano B'],
    '036': ['1°Ano EM'],
  },
  'Colégio Frei': {
    '059': ['2°Ano A', 'Reforço'],
    '063': ['4°Ano A', '4°Ano C'],
    '064': ['4°Ano B', '4°Ano D'],
  },
  'Colégio Dom José': {
    '048': ['7°Ano'],
    '053': ['1°Ano'],
    '069': ['2°Ano'],
  },
  'Colégio Rotary': {
    '066': ['401/4º Ano'],
    '074': ['502/5º Ano'],
  },
  'Colégio Mercedes': {
    '072': ['4°Ano'],
    '056': ['5°Ano'],
  },
  'Colégio Cemma': {
    '050': ['9°Ano 03', '9°Ano 06'],
    '067': ['8°Ano 01', '8°Ano 04'],
    '071': ['8°Ano 02', '9°Ano 05'],
    '076': ['7°Ano 02', '7°Ano 05'],
  },
  'Colégio Médici': {
    '034': ['5°Ano B'],
    '070': ['5°Ano A'],
    '073': ['5°Ano A'],
  },
  'Colégio CeFrei': {
    '061': ['5°Ano B', '2°Ano B'],
  },
}

const DEFAULT_PROFESSIONALS = Object.entries(USERS)
  .filter(([, user]) => !user.viewOnly)
  .map(([email, user]) => ({
    id: `user-${user.id}`,
    name: user.name,
    role: user.role,
    email,
    passwordHash: user.passwordHash
  }))
