import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

// All inventory routes require admin
router.use(authRequired, adminOnly)

// Default items (used to initialize on first access)
const DEFAULT_ITEMS = [
  { id: 'tomada-inicial', name: 'Tomada Inicial', quantity: 0 },
  { id: 'tomada-nova', name: 'Tomada Nova', quantity: 0 },
  { id: 'tomada-original', name: 'Tomada Original', quantity: 0 },
  { id: 'cam-logitech', name: 'Câm Logitech', quantity: 0 },
  { id: 'usb-cam-logi', name: 'USB da Câmera Logi', quantity: 0 },
  { id: 'raspberry-pi', name: 'Raspberry Pi', quantity: 0 },
  { id: 'micro-sd', name: 'Micro SD', quantity: 0 },
  { id: 'cooler', name: 'Cooler', quantity: 0 },
  { id: 'cabo-usb', name: 'Cabo USB', quantity: 0 },
  { id: 'falta-imprimir', name: 'Falta Imprimir', quantity: 0 },
  { id: 'completo', name: 'Completo', quantity: 0 },
]

// GET all items
router.get('/', (_req, res) => {
  const items = memoryStore.getInventory(DEFAULT_ITEMS)
  res.json({ items })
})

// PATCH update a single item's quantity
router.patch('/:id', (req, res) => {
  const { id } = req.params
  const { quantity } = req.body

  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ message: 'Quantidade inválida.' })
  }

  const items = memoryStore.updateInventoryItem(id, quantity)
  if (!items) {
    return res.status(404).json({ message: 'Item não encontrado.' })
  }
  return res.json({ items })
})

export default router
