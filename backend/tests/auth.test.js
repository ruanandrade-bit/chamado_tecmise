import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app, adminCookie } from './helpers.js'
import { ADMIN_EMAIL, USER_EMAIL, TEST_PASSWORD } from './setup.js'

describe('POST /api/auth/login', () => {
  it('retorna 200 e cookie httpOnly com credenciais válidas (admin)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(ADMIN_EMAIL)
    expect(res.body.user.role).toBe('Admin')
    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    expect(cookies.some(c => c.startsWith('s4s_auth='))).toBe(true)
    expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true)
  })

  it('retorna 200 com credenciais válidas (usuário comum)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: USER_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(USER_EMAIL)
  })

  it('retorna 401 com senha errada', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'senha-errada' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBeDefined()
  })

  it('retorna 401 com email inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@s4s.com', password: TEST_PASSWORD })

    expect(res.status).toBe(401)
  })

  it('retorna 401 com body vazio', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})

    expect(res.status).toBe(401)
  })

  it('não expõe passwordHash na resposta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: TEST_PASSWORD })

    expect(res.body.user.passwordHash).toBeUndefined()
  })
})

describe('GET /api/auth/me', () => {
  let cookie

  beforeAll(async () => {
    cookie = await adminCookie()
  })

  it('retorna 200 e dados do usuário com cookie válido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(ADMIN_EMAIL)
    expect(res.body.user.role).toBe('Admin')
  })

  it('retorna 401 sem cookie', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('retorna 401 com token inválido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['s4s_auth=token-invalido'])

    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('retorna 200 e limpa o cookie', async () => {
    const cookie = await adminCookie()
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    const setCookie = res.headers['set-cookie'] || []
    const authCookie = setCookie.find(c => c.startsWith('s4s_auth='))
    expect(authCookie).toBeDefined()
    expect(authCookie).toMatch(/Max-Age=0|Expires=.*1970/i)
  })
})
