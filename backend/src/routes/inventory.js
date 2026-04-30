import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const router = Router()

// All inventory routes require admin
router.use(authRequired, adminOnly)

// ─── Persistence ─────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const INVENTORY_PATH = join(DATA_DIR, 'inventory.json')

const DEFAULT_ITEMS = [
  { id: 'tomada-inicial', name: 'Tomada Inicial', quantity: 0 },
  { id: 'tomada-nova', name: 'Tomada Nova', quantity: 0 },
  { id: 'tomada-original', name: 'Tomada Original', quantity: 0 },
  { id: 'cam-logitech', name: 'Câm Logitech', quantity: 0 },
  { id: 'raspberry-pi', name: 'Raspberry Pi', quantity: 0 },
  { id: 'micro-sd', name: 'Micro SD', quantity: 0 },
  { id: 'cooler', name: 'Cooler', quantity: 0 },
  { id: 'cabo-usb', name: 'Cabo USB', quantity: 0 },
  { id: 'falta-imprimir', name: 'Falta Imprimir', quantity: 0 },
  { id: 'completo', name: 'Completo', quantity: 0 },
]

function loadInventory() {
  try {
    if (existsSync(INVENTORY_PATH)) {
      const raw = readFileSync(INVENTORY_PATH, 'utf-8')
      const data = JSON.parse(raw)
      if (Array.isArray(data.items)) {
        // Merge with defaults to pick up any new items added later
        const existing = new Map(data.items.map(i => [i.id, i]))
        return DEFAULT_ITEMS.map(def => existing.get(def.id) || def)
      }
    }
  } catch (err) {
    console.warn('[inventory] ⚠️  Could not read inventory:', err.message)
  }
  return structuredClone(DEFAULT_ITEMS)
}

function saveInventory(items) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(INVENTORY_PATH, JSON.stringify({
      items,
      _savedAt: new Date().toISOString()
    }, null, 2))
  } catch (err) {
    console.error('[inventory] ❌ Failed to save:', err.message)
  }
}

let inventoryItems = loadInventory()

// ─── Routes ──────────────────────────────────────────────────────────

// GET all items
router.get('/', (_req, res) => {
  res.json({ items: inventoryItems })
})

// PATCH update a single item's quantity
router.patch('/:id', (req, res) => {
  const { id } = req.params
  const { quantity } = req.body

  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ message: 'Quantidade inválida.' })
  }

  const item = inventoryItems.find(i => i.id === id)
  if (!item) {
    return res.status(404).json({ message: 'Item não encontrado.' })
  }

  item.quantity = Math.max(0, Math.floor(quantity))
  saveInventory(inventoryItems)
  return res.json({ items: inventoryItems })
})

export default router
