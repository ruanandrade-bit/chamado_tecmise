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
function firstNonEmptyEnv(...keys) {
  for (const key of keys) {
    const value = String(process.env[key] || '').trim()
    if (value) return { key, value }
  }
  return { key: null, value: '' }
}

function getTailscaleApiKey() {
  return firstNonEmptyEnv(
    'TAILSCALE_API_KEY',
    'TAILSCALE_API_TOKEN',
    'TAILSCALE_ACCESS_TOKEN',
    'TAILSCALE_TOKEN',
    'TS_API_KEY',
    'TAILSCALE_AUTHKEY',
    'TS_AUTHKEY'
  )
}

function detectTailscaleKeyType(value) {
  const token = String(value || '').trim()
  if (!token) return 'missing'
  if (token.startsWith('tskey-api-')) return 'api_access_token'
  if (token.startsWith('tskey-auth-')) return 'auth_key'
  if (token.startsWith('tskey-client-')) return 'oauth_client_secret'
  if (token.startsWith('tskey-')) return 'other_tskey'
  return 'unknown'
}

const TAILSCALE_TAILNET = String(process.env.TAILSCALE_TAILNET || '-').trim() || '-'
const BOOT_TAILSCALE_AUTH = getTailscaleApiKey()
const BOOT_TAILSCALE_KEY_TYPE = detectTailscaleKeyType(BOOT_TAILSCALE_AUTH.value)

if (!BOOT_TAILSCALE_AUTH.value) {
  console.warn(
    '[tailscale] variável de token não encontrada. ' +
    'Esperado: TAILSCALE_API_KEY|TAILSCALE_API_TOKEN|TAILSCALE_ACCESS_TOKEN|TAILSCALE_TOKEN|TS_API_KEY|TAILSCALE_AUTHKEY|TS_AUTHKEY'
  )
} else {
  console.log(
    `[tailscale] token detectado em ${BOOT_TAILSCALE_AUTH.key} (tipo: ${BOOT_TAILSCALE_KEY_TYPE}, tailnet: ${TAILSCALE_TAILNET}).`
  )
}

function parseTimeMs(value) {
  const ms = new Date(value || 0).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

function normalizeNumericToken(value) {
  const raw = String(value || '').replace(/\D/g, '')
  if (!raw) return null
  const compact = raw.replace(/^0+/, '') || '0'
  return { raw, compact }
}

function getAliasCandidates(value) {
  const normalized = normalizeNumericToken(value)
  if (!normalized) return []

  const out = new Set()
  out.add(normalized.raw)
  out.add(normalized.compact)
  out.add(normalized.compact.padStart(3, '0'))
  out.add(normalized.compact.padStart(4, '0'))
  out.add(normalized.compact.padStart(5, '0'))
  out.add(normalized.compact.padStart(6, '0'))
  return Array.from(out)
}

function extractNumericAliases(...values) {
  const aliases = new Set()
  values.forEach((value) => {
    const tokens = String(value || '').match(/\d+/g) || []
    tokens.forEach((token) => {
      getAliasCandidates(token).forEach((alias) => aliases.add(alias))
    })
  })
  return aliases
}

function buildConfiguredAliasMap(deviceIds) {
  const aliasToDeviceId = new Map()
  for (const id of deviceIds) {
    const deviceId = String(id)
    getAliasCandidates(deviceId).forEach((alias) => {
      aliasToDeviceId.set(alias, deviceId)
    })
  }
  return aliasToDeviceId
}

function chooseBestStatus(previous, current) {
  if (!previous) return current
  if (current.online && !previous.online) return current
  if (!current.online && previous.online) return previous

  const previousLastSeen = parseTimeMs(previous.lastSeen)
  const currentLastSeen = parseTimeMs(current.lastSeen)
  return currentLastSeen > previousLastSeen ? current : previous
}

async function safeJson(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function fetchTailscaleDevices() {
  const now = Date.now()

  // Return cached if still valid
  if (cachedResult && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedResult
  }

  const SCHOOL_DEVICES = buildSchoolDeviceMap()
  const ALL_DEVICE_IDS = getAllDeviceIds()
  const configuredAliasMap = buildConfiguredAliasMap(ALL_DEVICE_IDS)
  const tailscaleAuth = getTailscaleApiKey()

  try {
    if (!tailscaleAuth.value) {
      throw new Error(
        'Chave da API do Tailscale não configurada. Defina uma destas variáveis: ' +
        'TAILSCALE_API_KEY, TAILSCALE_API_TOKEN, TAILSCALE_ACCESS_TOKEN, TAILSCALE_TOKEN, TS_API_KEY, TAILSCALE_AUTHKEY ou TS_AUTHKEY.'
      )
    }

    if (tailscaleAuth.value.startsWith('tskey-auth-')) {
      throw new Error(
        'A chave informada é Auth Key (tskey-auth), usada para adicionar devices. ' +
        'Para esta tela, use API Access Token (tskey-api).'
      )
    }

    if (tailscaleAuth.value.startsWith('tskey-client-')) {
      throw new Error(
        'A chave informada é OAuth Client Secret (tskey-client). ' +
        'Use um API Access Token (tskey-api) ou obtenha access_token OAuth para chamada da API.'
      )
    }

    const apiUrl = `https://api.tailscale.com/api/v2/tailnet/${encodeURIComponent(TAILSCALE_TAILNET)}/devices`
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${tailscaleAuth.value}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const payload = await safeJson(response)
      const details = payload?.message || response.statusText
      throw new Error(`Tailscale API retornou ${response.status}: ${details}`)
    }

    const data = await safeJson(response)
    const devices = Array.isArray(data?.devices)
      ? data.devices
      : (Array.isArray(data?.nodes) ? data.nodes : [])

    // Build a map: hostname → { online, lastSeen, ipv4, os, ... }
    const deviceMap = {}
    for (const device of devices) {
      const hostname = device.hostname || ''
      const machineName = device.name || ''
      const haystack = `${hostname} ${machineName}`.toLowerCase()
      const candidateAliases = extractNumericAliases(hostname, machineName, device.id)
      let matchedId = null

      for (const alias of candidateAliases) {
        const found = configuredAliasMap.get(alias)
        if (found) {
          matchedId = found
          break
        }
      }

      if (!matchedId) {
        for (const id of ALL_DEVICE_IDS) {
          if (haystack.includes(String(id).toLowerCase())) {
            matchedId = String(id)
            break
          }
        }
      }

      if (!matchedId) continue

      const mappedStatus = {
        online: device.connectedToControl === true || device.online === true,
        lastSeen: device.lastSeen || null,
        hostname: hostname || machineName || '',
        os: device.os || '',
        ipv4: (device.addresses || []).find((addr) => !String(addr).includes(':')) || null,
        clientVersion: device.clientVersion || '',
      }

      deviceMap[matchedId] = chooseBestStatus(deviceMap[matchedId], mappedStatus)
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
      tailscaleDeviceCount: devices.length,
      matchedDeviceCount: Object.keys(deviceMap).length,
      authSource: tailscaleAuth.key,
      warning: devices.length > 0 && Object.keys(deviceMap).length === 0
        ? 'Nenhum device configurado foi relacionado aos nomes vindos da API do Tailscale.'
        : null,
    }
    cacheTimestamp = now

    console.log(
      `[tailscale] ✅ Fetched ${devices.length} devices from Tailscale. ` +
      `${cachedResult.onlineCount} online. ${cachedResult.matchedDeviceCount} relacionados.`
    )

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
      tailscaleDeviceCount: 0,
      matchedDeviceCount: 0,
      authSource: tailscaleAuth.key,
      warning: null,
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
