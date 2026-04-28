import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'

const router = Router()

// All device routes require admin
router.use(authRequired, adminOnly)

// ─── School → Device mapping (same as frontend) ─────────────────────
const SCHOOL_DEVICES = {
  'Colégio Frei': ['059', '063', '064'],
  'Colégio Dom José': ['048', '053', '069'],
  'Colégio Honorata': ['035', '055'],
  'Colégio Rotary': ['074', '066'],
  'Colégio Mercedes': ['056', '072'],
  'Colégio Cemma': ['050', '067', '071', '076'],
  'Colégio Grace': ['032', '036', '037', '038'],
  'Colégio Graziela': ['012', '014'],
  'Colégio Antônio': ['011', '013'],
  'Colégio Médici': ['034', '070', '073'],
  'Colégio CeFrei': ['061'],
}

// Flatten all known device IDs for quick lookup
const ALL_DEVICE_IDS = new Set(Object.values(SCHOOL_DEVICES).flat())

// ─── Cache ───────────────────────────────────────────────────────────
let cachedResult = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

// ─── Tailscale API ───────────────────────────────────────────────────
const TAILSCALE_API_KEY = process.env.TAILSCALE_API_KEY || 'tskey-api-kMZfnBBNHG11CNTRL-hH4VJjWbUKKi3ysGZZTYKK3b5jh23ruaU'

async function fetchTailscaleDevices() {
  const now = Date.now()

  // Return cached if still valid
  if (cachedResult && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedResult
  }

  try {
    const response = await fetch('https://api.tailscale.com/api/v2/tailnet/-/devices', {
      headers: {
        'Authorization': `Bearer ${TAILSCALE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Tailscale API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const devices = data.devices || []

    // Build a map: hostname → { online, lastSeen, ipv4, os, ... }
    const deviceMap = {}
    for (const device of devices) {
      // The hostname in Tailscale might contain the device number
      // Try matching by hostname or name containing the device ID
      const hostname = (device.hostname || device.name || '').toLowerCase()

      for (const id of ALL_DEVICE_IDS) {
        // Match if hostname contains the device id (e.g., "device-059" or "059" or "s4s-059")
        if (hostname.includes(id)) {
          deviceMap[id] = {
            online: device.connectedToControl === true,
            lastSeen: device.lastSeen || null,
            hostname: device.hostname || device.name || '',
            os: device.os || '',
            ipv4: (device.addresses || []).find(a => !a.includes(':')) || null,
            clientVersion: device.clientVersion || '',
          }
        }
      }
    }

    // Build school-grouped result
    const schools = {}
    for (const [schoolName, deviceIds] of Object.entries(SCHOOL_DEVICES)) {
      schools[schoolName] = deviceIds.map(id => ({
        id,
        ...(deviceMap[id] || {
          online: false,
          lastSeen: null,
          hostname: '',
          os: '',
          ipv4: null,
          clientVersion: '',
        }),
        found: !!deviceMap[id],
      }))
    }

    cachedResult = {
      schools,
      lastFetched: new Date().toISOString(),
      totalDevices: ALL_DEVICE_IDS.size,
      onlineCount: Object.values(deviceMap).filter(d => d.online).length,
      offlineCount: ALL_DEVICE_IDS.size - Object.values(deviceMap).filter(d => d.online).length,
    }
    cacheTimestamp = now

    console.log(`[tailscale] ✅ Fetched ${devices.length} devices from Tailscale. ${cachedResult.onlineCount} online.`)

    return cachedResult
  } catch (err) {
    console.error('[tailscale] ❌ Error fetching devices:', err.message)

    // Return stale cache if available
    if (cachedResult) {
      console.log('[tailscale] ↩️  Returning stale cache.')
      return { ...cachedResult, stale: true }
    }

    // Return empty result
    const schools = {}
    for (const [schoolName, deviceIds] of Object.entries(SCHOOL_DEVICES)) {
      schools[schoolName] = deviceIds.map(id => ({
        id,
        online: false,
        lastSeen: null,
        hostname: '',
        os: '',
        ipv4: null,
        clientVersion: '',
        found: false,
      }))
    }

    return {
      schools,
      lastFetched: null,
      totalDevices: ALL_DEVICE_IDS.size,
      onlineCount: 0,
      offlineCount: ALL_DEVICE_IDS.size,
      error: err.message,
    }
  }
}

// ─── Routes ──────────────────────────────────────────────────────────
router.get('/status', async (_req, res) => {
  try {
    const result = await fetchTailscaleDevices()
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erro ao consultar Tailscale.' })
  }
})

// Force refresh (bypass cache)
router.post('/refresh', async (_req, res) => {
  // Invalidate cache
  cacheTimestamp = 0
  cachedResult = null

  try {
    const result = await fetchTailscaleDevices()
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message || 'Erro ao consultar Tailscale.' })
  }
})

export default router
