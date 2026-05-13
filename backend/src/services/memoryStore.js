import { MongoClient } from 'mongodb'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { USERS, STATUSES, TICKETS } from '../data/mockData.js'

// ─── File persistence (fallback for local dev) ──────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const STORE_PATH = join(DATA_DIR, 'store.json')

function loadFromDisk() {
  try {
    if (existsSync(STORE_PATH)) {
      const raw = readFileSync(STORE_PATH, 'utf-8')
      const data = JSON.parse(raw)
      if (Array.isArray(data.tickets)) {
        console.log(`[store] 📁 Loaded ${data.tickets.length} tickets from disk.`)
        return { tickets: data.tickets, notifications: data.notifications || [], monthlyReports: data.monthlyReports || {}, inventory: data.inventory || null, schoolData: data.schoolData || null }
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
      return { tickets: doc.tickets, notifications: doc.notifications || [], monthlyReports: doc.monthlyReports || {}, inventory: doc.inventory || null, schoolData: doc.schoolData || null }
    }
  } catch (err) {
    console.warn('[store] ⚠️  Failed to load from MongoDB:', err.message)
  }
  return null
}

function saveToMongo() {
  if (!mongoCollection) return
  mongoCollection.replaceOne(
    { _id: 'app_state' },
    {
      _id: 'app_state',
      tickets: state.tickets,
      notifications: state.notifications,
      monthlyReports: state.monthlyReports,
      inventory: state.inventory,
      schoolData: state.schoolData,
      _savedAt: new Date()
    },
    { upsert: true }
  ).catch((err) => {
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
  schoolData: null      // school→device→turma config, managed via admin panel
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
    if (mongoData.inventory) state.inventory = mongoData.inventory
    if (mongoData.schoolData) state.schoolData = mongoData.schoolData
  } else if (diskData) {
    state.tickets = diskData.tickets
    state.notifications = diskData.notifications
    state.monthlyReports = diskData.monthlyReports
    if (diskData.inventory) state.inventory = diskData.inventory
    if (diskData.schoolData) state.schoolData = diskData.schoolData
    // Seed MongoDB if it's empty but connected
    if (connected) {
      console.log('[store] 🔄 Syncing disk data to MongoDB...')
      saveToMongo()
    }
  } else {
    console.log('[store] 🆕 First run — seeding with mock data.')
    persistState()
  }
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
    state.notifications.push({
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...notification
    })
    persistState()
  },

  consumeNotifications(userEmail) {
    const visible = []
    const remaining = []

    state.notifications.forEach((note) => {
      const isForUser = !note.targetUserEmail || note.targetUserEmail === userEmail
      if (isForUser) visible.push(note)
      else remaining.push(note)
    })

    state.notifications = remaining
    if (visible.length > 0) persistState()
    return visible
  },

  statuses: STATUSES,

  // ─── Monthly Reports ────────────────────────────────────────────
  getMonthlyReport(month, year) {
    const key = monthlyKey(month, year)
    const existing = state.monthlyReports[key] || { month, year, observations: [], ticketCount: 0 }
    const storedCount = Number(existing.ticketCount || 0)
    const derivedCount = countOpenedTicketsInMonth(month, year)

    return {
      ...existing,
      month,
      year,
      observations: Array.isArray(existing.observations) ? existing.observations : [],
      ticketCount: Math.max(storedCount, derivedCount)
    }
  },

  addMonthlyObservation(month, year, text, user) {
    const key = monthlyKey(month, year)
    if (!state.monthlyReports[key]) {
      state.monthlyReports[key] = { month, year, observations: [] }
    }

    const observation = {
      id: Date.now() + Math.random(),
      text,
      author: user.name,
      createdAt: new Date().toISOString()
    }

    state.monthlyReports[key].observations.push(observation)
    persistState()
    return state.monthlyReports[key]
  },

  deleteMonthlyObservation(month, year, observationId) {
    const key = monthlyKey(month, year)
    const report = state.monthlyReports[key]
    if (!report) return null

    const idx = report.observations.findIndex((o) => o.id === observationId)
    if (idx === -1) return null

    report.observations.splice(idx, 1)
    persistState()
    return report
  },

  editMonthlyObservation(month, year, observationId, newText) {
    const key = monthlyKey(month, year)
    const report = state.monthlyReports[key]
    if (!report) return null

    const obs = report.observations.find((o) => o.id === observationId)
    if (!obs) return null

    obs.text = newText
    obs.editedAt = new Date().toISOString()
    persistState()
    return report
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
