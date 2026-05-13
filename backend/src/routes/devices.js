import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { memoryStore } from '../services/memoryStore.js'

const router = Router()

// All device routes require admin
router.use(authRequired, adminOnly)

// ─── Dynamic School → Device mapping from config ─────────────────────
function buildSchoolDeviceMap() {
  const schoolData = memoryStore.getSchoolData()
  const result = {}
  for (const [schoolName, devices] of Object.entries(schoolData)) {
    result[schoolName] = Object.keys(devices)
  }
  return result
}

function getAllDeviceIds() {
  const map = buildSchoolDeviceMap()
  return new Set(Object.values(map).flat())
}

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

  const SCHOOL_DEVICES = buildSchoolDeviceMap()
  const ALL_DEVICE_IDS = getAllDeviceIds()

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
      const hostname = (device.hostname || device.name || '').toLowerCase()

      for (const id of ALL_DEVICE_IDS) {
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
