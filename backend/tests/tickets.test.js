import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app, adminCookie, userCookie } from './helpers.js'

describe('GET /api/tickets', () => {
  let cookie

  beforeAll(async () => { cookie = await adminCookie() })

  it('retorna 200 e array de tickets', async () => {
    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.tickets)).toBe(true)
  })

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/tickets', () => {
  let adminCk, userCk

  beforeAll(async () => {
    adminCk = await adminCookie()
    userCk  = await userCookie()
  })

  const validBody = {
    school: 'Escola Teste',
    classroom: '5B',
    device: '042',
    description: 'Câmera com obstrução parcial'
  }

  it('cria chamado com campos válidos (admin)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', adminCk)
      .send(validBody)

    expect(res.status).toBe(201)
    expect(res.body.ticket.id).toMatch(/^S4S-/)
    expect(res.body.ticket.school).toBe('Escola Teste')
    expect(res.body.ticket.description).toBe('Câmera com obstrução parcial')
  })

  it('não injeta campos extras (mass assignment protection)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', adminCk)
      .send({ ...validBody, __proto__: 'x', isAdmin: true, injected: 'bad' })

    expect(res.status).toBe(201)
    expect(res.body.ticket.injected).toBeUndefined()
    expect(res.body.ticket.isAdmin).toBeUndefined()
  })

  it('retorna 400 sem description', async () => {
    const { description: _, ...body } = validBody
    const res = await request(app)
      .post('/api/tickets').set('Cookie', adminCk).send(body)
    expect(res.status).toBe(400)
  })

  it('retorna 400 sem school', async () => {
    const { school: _, ...body } = validBody
    const res = await request(app)
      .post('/api/tickets').set('Cookie', adminCk).send(body)
    expect(res.status).toBe(400)
  })

  it('retorna 400 sem classroom', async () => {
    const { classroom: _, ...body } = validBody
    const res = await request(app)
      .post('/api/tickets').set('Cookie', adminCk).send(body)
    expect(res.status).toBe(400)
  })

  it('retorna 400 com description acima de 5000 chars', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', adminCk)
      .send({ ...validBody, description: 'x'.repeat(5001) })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com priority inválida', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', adminCk)
      .send({ ...validBody, priority: 'urgent' })
    expect(res.status).toBe(400)
  })

  it('aceita priority válida (alta)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', adminCk)
      .send({ ...validBody, priority: 'alta' })
    expect(res.status).toBe(201)
    expect(res.body.ticket.priority).toBe('alta')
  })

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).post('/api/tickets').send(validBody)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/tickets/:id', () => {
  let cookie, ticketId

  beforeAll(async () => {
    cookie = await adminCookie()
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({ school: 'Escola X', classroom: '3A', device: '010', description: 'Teste GET por ID' })
    ticketId = res.body.ticket.id
  })

  it('retorna 200 para ticket existente', async () => {
    const res = await request(app).get(`/api/tickets/${ticketId}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.ticket.id).toBe(ticketId)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/tickets/S4S-NAOEXISTE').set('Cookie', cookie)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/tickets/:id/move', () => {
  let cookie, ticketId

  beforeAll(async () => {
    cookie = await adminCookie()
    const res = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({ school: 'Escola Y', classroom: '4B', device: '020', description: 'Teste mover' })
    ticketId = res.body.ticket.id
  })

  it('move chamado para status válido (admin)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/move`)
      .set('Cookie', cookie)
      .send({ status: 'em-analise' })
    expect(res.status).toBe(200)
    expect(res.body.ticket.status).toBe('em-analise')
  })

  it('retorna 400 com status inválido', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/move`)
      .set('Cookie', cookie)
      .send({ status: 'nao-existe' })
    expect(res.status).toBe(400)
  })

  it('retorna 403 para não-admin', async () => {
    const uc = await userCookie()
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/move`)
      .set('Cookie', uc)
      .send({ status: 'recebido' })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/tickets/:id', () => {
  let adminCk, userCk

  beforeAll(async () => {
    adminCk = await adminCookie()
    userCk  = await userCookie()
  })

  it('retorna 403 para não-admin', async () => {
    const create = await request(app)
      .post('/api/tickets')
      .set('Cookie', adminCk)
      .send({ school: 'Escola Z', classroom: '1A', device: '001', description: 'Para delete' })
    const id = create.body.ticket.id

    const res = await request(app)
      .delete(`/api/tickets/${id}`)
      .set('Cookie', userCk)
    expect(res.status).toBe(403)
  })

  it('exclui chamado existente (admin) → 204', async () => {
    const create = await request(app)
      .post('/api/tickets')
      .set('Cookie', adminCk)
      .send({ school: 'Escola Z', classroom: '1A', device: '001', description: 'Para delete admin' })
    const id = create.body.ticket.id

    const res = await request(app).delete(`/api/tickets/${id}`).set('Cookie', adminCk)
    expect(res.status).toBe(204)
  })

  it('retorna 404 ao excluir ID inexistente', async () => {
    const res = await request(app).delete('/api/tickets/S4S-NAOEXISTE').set('Cookie', adminCk)
    expect(res.status).toBe(404)
  })
})
