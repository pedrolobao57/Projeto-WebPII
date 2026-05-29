const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function request(method, path, body = null, params = null) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let url = `${BASE_URL}${path}`
  if (params) {
    const query = new URLSearchParams(params).toString()
    url += `?${query}`
  }

  const options = { method, headers }
  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    window.location.href = '/'
    return
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw { ...error, status: response.status } // Inclui o status HTTP no objeto de erro
  }

  // Return null for 204 No Content
  if (response.status === 204) return null

  return response.json()
}

const apiClient = {
  get: (path, params) => request('GET', path, null, params),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
}

export default apiClient
