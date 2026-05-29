import { computed } from 'vue'

/**
 * Composable centralizado de autenticação.
 * Lê o token e os dados do utilizador do localStorage.
 */
export function useAuth() {
  const token = computed(() => localStorage.getItem('token'))
  const refreshToken = computed(() => localStorage.getItem('refreshToken'))

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
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  /**
   * Persiste o token, o refresh token e o utilizador no localStorage após login/signup.
   */
  function saveSession(tokenValue, secondArg, thirdArg = null) {
    let finalRefreshToken = null
    let finalUser = secondArg

    if (thirdArg !== null) {
      finalRefreshToken = secondArg
      finalUser = thirdArg
    }

    localStorage.setItem('token', tokenValue)
    if (finalRefreshToken) {
      localStorage.setItem('refreshToken', finalRefreshToken)
    }
    localStorage.setItem('user', JSON.stringify(finalUser))
  }

  return { token, refreshToken, user, isLoggedIn, logout, saveSession }
}
