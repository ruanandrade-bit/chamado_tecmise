import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

// All inventory routes require admin
router.use(authRequired, adminOnly)

// Default items (used to initialize on first access)
const DEFAULT_ITEMS = [
  { id: 'tomada-inicial', name: 'Fonte Inicial', quantity: 0 },
  { id: 'tomada-nova', name: 'Fonte Nova', quantity: 0 },
  { id: 'tomada-original', name: 'Fonte Original', quantity: 0 },
  { id: 'cam-logitech', name: 'Câm Logitech', quantity: 0 },
  { id: 'usb-cam-logi', name: 'USB da Câmera Logi', quantity: 0 },
  { id: 'raspberry-pi', name: 'Raspberry Pi', quantity: 0 },
  { id: 'micro-sd', name: 'Micro SD', quantity: 0 },
  { id: 'cooler', name: 'Cooler', quantity: 0 },
  { id: 'cabo-usb', name: 'Cabo USB', quantity: 0 },
  { id: 'falta-imprimir', name: 'Falta Imprimir', quantity: 0 },
  { id: 'completo', name: 'Câmera Completa', quantity: 0 },
]

// GET all items
router.get('/', (_req, res) => {
  const items = memoryStore.getInventory(DEFAULT_ITEMS)
  res.json({ items })
})

// POST create a new inventory item
router.post('/', (req, res) => {
  memoryStore.getInventory(DEFAULT_ITEMS)

  const { name, quantity } = req.body
  const numericQuantity = Number(quantity ?? 0)

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ message: 'Nome inválido. Use entre 2 e 100 caracteres.' })
  }

  if (!Number.isFinite(numericQuantity) || numericQuantity < 0) {
    return res.status(400).json({ message: 'Quantidade inválida.' })
  }

  const items = memoryStore.createInventoryItem(name, numericQuantity)
  if (!items) {
    return res.status(500).json({ message: 'Não foi possível criar o item.' })
  }

  return res.status(201).json({ items })
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

// PATCH rename a custom inventory item
router.patch('/:id/name', (req, res) => {
  const { id } = req.params
  const { name } = req.body

  if (!id.startsWith('custom-')) {
    return res.status(400).json({ message: 'Só itens personalizados podem ter nome editado.' })
  }

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ message: 'Nome inválido. Use entre 2 e 100 caracteres.' })
  }

  const items = memoryStore.renameInventoryItem(id, name)
  if (!items) {
    return res.status(404).json({ message: 'Item não encontrado.' })
  }

  return res.json({ items })
})

// DELETE remove a custom inventory item
router.delete('/:id', (req, res) => {
  const { id } = req.params

  if (!id.startsWith('custom-')) {
    return res.status(400).json({ message: 'Só itens personalizados podem ser removidos.' })
  }

  const items = memoryStore.deleteInventoryItem(id)
  if (!items) {
    return res.status(404).json({ message: 'Item não encontrado.' })
  }

  return res.json({ items })
})

export default router
