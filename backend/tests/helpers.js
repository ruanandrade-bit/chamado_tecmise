import request from 'supertest'
import app from '../src/app.js'
import { ADMIN_EMAIL, USER_EMAIL, TEST_PASSWORD } from './setup.js'

export { app }

export async function loginAs(email = ADMIN_EMAIL) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: TEST_PASSWORD })
  return res.headers['set-cookie']
}

export async function adminCookie() {
  return loginAs(ADMIN_EMAIL)
}

export async function userCookie() {
  return loginAs(USER_EMAIL)
}
