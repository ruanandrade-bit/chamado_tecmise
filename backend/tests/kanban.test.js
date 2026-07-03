import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app, adminCookie } from './helpers.js'

function futureDate(daysAhead = 7) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}

const validTask = () => ({
  title: 'Tarefa de teste',
  description: 'Descrição da tarefa',
  status: 'todo',
  priority: 'medium',
  date: futureDate(),
})

describe('POST /api/kanban', () => {
  let cookie

  beforeAll(async () => { cookie = await adminCookie() })

  it('cria tarefa com campos válidos → 201', async () => {
    const res = await request(app)
      .post('/api/kanban')
      .set('Cookie', cookie)
      .send(validTask())

    expect(res.status).toBe(201)
    expect(res.body.id).toMatch(/^KB-/)
    expect(res.body.title).toBe('Tarefa de teste')
    expect(res.body.status).toBe('todo')
  })

  it('retorna 400 sem título', async () => {
    const { title: _, ...body } = validTask()
    const res = await request(app).post('/api/kanban').set('Cookie', cookie).send(body)
    expect(res.status).toBe(400)
  })

  it('retorna 400 com título vazio', async () => {
    const res = await request(app)
      .post('/api/kanban').set('Cookie', cookie)
      .send({ ...validTask(), title: '   ' })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com status inválido', async () => {
    const res = await request(app)
      .post('/api/kanban').set('Cookie', cookie)
      .send({ ...validTask(), status: 'invalid-status' })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com priority inválida', async () => {
    const res = await request(app)
      .post('/api/kanban').set('Cookie', cookie)
      .send({ ...validTask(), priority: 'urgente' })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com data no passado', async () => {
    const res = await request(app)
      .post('/api/kanban').set('Cookie', cookie)
      .send({ ...validTask(), date: '2020-01-01' })
    expect(res.status).toBe(400)
  })

  it('retorna 400 com data em formato errado', async () => {
    const res = await request(app)
      .post('/api/kanban').set('Cookie', cookie)
      .send({ ...validTask(), date: '01/01/2030' })
    expect(res.status).toBe(400)
  })

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).post('/api/kanban').send(validTask())
    expect(res.status).toBe(401)
  })
})

describe('GET /api/kanban', () => {
  let cookie

  beforeAll(async () => { cookie = await adminCookie() })

  it('retorna 200 e array de tarefas', async () => {
    const res = await request(app).get('/api/kanban').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('PUT /api/kanban/:id', () => {
  let cookie, taskId

  beforeAll(async () => {
    cookie = await adminCookie()
    const res = await request(app)
      .post('/api/kanban')
      .set('Cookie', cookie)
      .send(validTask())
    taskId = res.body.id
  })

  it('atualiza status da tarefa → 200', async () => {
    const res = await request(app)
      .put(`/api/kanban/${taskId}`)
      .set('Cookie', cookie)
      .send({ status: 'in_progress' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('in_progress')
  })

  it('retorna 400 com status inválido', async () => {
    const res = await request(app)
      .put(`/api/kanban/${taskId}`)
      .set('Cookie', cookie)
      .send({ status: 'fazendo' })
    expect(res.status).toBe(400)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app)
      .put('/api/kanban/KB-NAOEXISTE')
      .set('Cookie', cookie)
      .send({ status: 'done' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/kanban/:id', () => {
  let cookie

  beforeAll(async () => { cookie = await adminCookie() })

  it('criador pode excluir própria tarefa → 200', async () => {
    const create = await request(app)
      .post('/api/kanban').set('Cookie', cookie).send(validTask())
    const id = create.body.id

    const res = await request(app).delete(`/api/kanban/${id}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('retorna 404 para tarefa inexistente', async () => {
    const res = await request(app).delete('/api/kanban/KB-NAOEXISTE').set('Cookie', cookie)
    expect(res.status).toBe(404)
  })
})
