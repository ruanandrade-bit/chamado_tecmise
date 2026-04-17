const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')

function getAuthToken() {
  return localStorage.getItem('s4s_auth_token')
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')

  const token = getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    const message = payload?.message || 'Erro na requisição.'
    throw new Error(message)
  }

  return payload
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  baseUrl: API_BASE_URL
}
