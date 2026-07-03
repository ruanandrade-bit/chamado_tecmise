import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app, adminCookie } from './helpers.js'

function futureDate(daysAhead = 5) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}

const validDeadline = () => ({
  title: 'Prazo de teste',
  description: 'Descrição do prazo',
  date: futureDate(),
  category: 'pedagoga',
  status: 'pendente',
  priority: 'media',
})

describe('POST /api/deadlines', () => {
  let cookie

  beforeAll(async () => { cookie = await adminCookie() })

  it('cria prazo com campos válidos → 201', async () => {
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send(validDeadline())

    expect(res.status).toBe(201)
    expect(res.body.id).toMatch(/^DL-/)
    expect(res.body.title).toBe('Prazo de teste')
    expect(res.body.category).toBe('pedagoga')
  })

  it('retorna 400 sem título', async () => {
    const { title: _, ...body } = validDeadline()
    const res = await request(app).post('/api/deadlines').set('Cookie', cookie).send(body)
    expect(res.status).toBe(400)
  })

  it('retorna 400 sem data', async () => {
    const { date: _, ...body } = validDeadline()
    const res = await request(app).post('/api/deadlines').set('Cookie', cookie).send(body)
    expect(res.status).toBe(400)
  })

  it('retorna 400 com data em formato inválido (dd/mm/yyyy)', async () => {
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send({ ...validDeadline(), date: '31/12/2030' })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com data não-ISO (texto livre)', async () => {
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send({ ...validDeadline(), date: 'amanha' })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com category inválida', async () => {
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send({ ...validDeadline(), category: 'admin' })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com status inválido', async () => {
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send({ ...validDeadline(), status: 'atrasado' })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com priority inválida', async () => {
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send({ ...validDeadline(), priority: 'urgent' })
    expect(res.status).toBe(400)
  })

  it('aceita horário válido (HH:MM)', async () => {
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send({ ...validDeadline(), time: '14:30' })
    expect(res.status).toBe(201)
    expect(res.body.time).toBe('14:30')
  })

  it('retorna 400 com horário em formato inválido', async () => {
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send({ ...validDeadline(), time: '25:00' })
    expect(res.status).toBe(400)
  })

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).post('/api/deadlines').send(validDeadline())
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/deadlines/:id', () => {
  let cookie, deadlineId

  beforeAll(async () => {
    cookie = await adminCookie()
    const res = await request(app)
      .post('/api/deadlines')
      .set('Cookie', cookie)
      .send(validDeadline())
    deadlineId = res.body.id
  })

  it('criador pode excluir próprio prazo → 200', async () => {
    const res = await request(app)
      .delete(`/api/deadlines/${deadlineId}`)
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('retorna 404 para prazo inexistente', async () => {
    const res = await request(app)
      .delete('/api/deadlines/DL-NAOEXISTE')
      .set('Cookie', cookie)
    expect(res.status).toBe(404)
  })
})
