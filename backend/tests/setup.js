// Must run before any module is loaded — sets env so memoryStore skips MongoDB
process.env.MONGODB_URI = ''
process.env.JWT_SECRET = 'test-secret-minimum-32-chars-long-ok!'
process.env.NODE_ENV = 'test'

import { USERS } from '../src/data/mockData.js'
import { hashPassword } from '../src/utils/password.js'

export const TEST_PASSWORD = 'TestPass123!'
export const ADMIN_EMAIL   = 'ruan@s4s.com'
export const USER_EMAIL    = 'ana@s4s.com'

// Inject known passwords so login works without MongoDB
for (const email of Object.keys(USERS)) {
  USERS[email].passwordHash = hashPassword(TEST_PASSWORD)
}
