import { computed } from 'vue'

/**
 * Composable centralizado de autenticação.
 * Lê o token e os dados do utilizador do localStorage.
 */
export function useAuth() {
  const token = computed(() => localStorage.getItem('token'))

  const user = computed(() => {
    const stored = localStorage.getItem('user')
    try {
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const isLoggedIn = computed(() => !!token.value)

  /**
   * Termina a sessão do utilizador e redireciona para a landing page.
   */
  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  /**
   * Persiste o token e o utilizador no localStorage após login/signup.
   */
  function saveSession(tokenValue, userValue) {
    localStorage.setItem('token', tokenValue)
    localStorage.setItem('user', JSON.stringify(userValue))
  }

  return { token, user, isLoggedIn, logout, saveSession }
}
