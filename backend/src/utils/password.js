import { scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

export function verifyPassword(rawPassword, storedValue) {
  const password = String(rawPassword || '')
  const packed = String(storedValue || '')

  if (!password || !packed.includes(':')) return false

  const [salt, expectedHex] = packed.split(':')
  if (!salt || !expectedHex) return false

  try {
    const expected = Buffer.from(expectedHex, 'hex')
    const derived = scryptSync(password, salt, expected.length || KEY_LENGTH)

    if (expected.length !== derived.length) return false
    return timingSafeEqual(expected, derived)
  } catch {
    return false
  }
}

