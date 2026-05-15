import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

export function hashPassword(rawPassword) {
  const password = String(rawPassword || '')
  if (!password) {
    throw new Error('Senha inválida.')
  }

  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, KEY_LENGTH)
  return `${salt}:${derived.toString('hex')}`
}

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
