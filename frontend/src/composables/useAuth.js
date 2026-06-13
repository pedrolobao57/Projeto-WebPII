import { computed } from 'vue'

/**
 * @function useAuth
 * @description Composable centralizado de autenticação para a aplicação Vue 3.
 * Expõe propriedades reativas computadas (computed) para ler informações de sessão do utilizador
 * diretamente do `localStorage` e disponibiliza funções utilitárias para iniciar ou terminar sessões.
 * 
 * @returns {Object} Um objeto contendo:
 * - {ComputedRef<string|null>} token: O token JWT fictício ativo.
 * - {ComputedRef<string|null>} refreshToken: O token de renovação de sessão.
 * - {ComputedRef<Object|null>} user: Objeto contendo o perfil do utilizador autenticado (Parsed).
 * - {ComputedRef<boolean>} isLoggedIn: Indica se o utilizador está atualmente autenticado.
 * - {Function} logout: Termina a sessão limpando o armazenamento local.
 * - {Function} saveSession: Persiste os dados da sessão após autenticação bem-sucedida.
 */
export function useAuth() {
  // Propriedade computada reativa que obtém o token de acesso.
  const token = computed(() => localStorage.getItem('token'))
  
  // Propriedade computada reativa que obtém o token de renovação (refresh token).
  const refreshToken = computed(() => localStorage.getItem('refreshToken'))

  // Propriedade computada reativa que faz o parsing seguro do JSON do perfil do utilizador armazenado.
  const user = computed(() => {
    const stored = localStorage.getItem('user')
    try {
      // Retorna null ou tenta converter a string JSON para um objeto JavaScript.
      return stored ? JSON.parse(stored) : null
    } catch {
      // Previne quebras de renderização na aplicação em caso de formato corrompido no localStorage.
      return null
    }
  })

  // Booleano reativo que indica se existe uma sessão válida baseada na presença do token.
  const isLoggedIn = computed(() => !!token.value)

  /**
   * @function logout
   * @description Termina a sessão do utilizador. Remove todos os dados guardados em `localStorage`
   * relacionados com a autenticação e redireciona de imediato o browser para a landing page (página inicial).
   */
  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    // Redirecionamento forçado para limpar eventuais estados residuais em memória na SPA (Single Page Application).
    window.location.href = '/'
  }

  /**
   * @function saveSession
   * @description Persiste o token de acesso, o token de renovação e os dados estruturados do utilizador
   * no `localStorage` após um login ou registo bem-sucedidos.
   * Suporta assinaturas de chamada flexíveis (sobrecarga dinâmica de argumentos):
   * - Caso com 2 argumentos: saveSession(token, user)
   * - Caso com 3 argumentos: saveSession(token, refreshToken, user)
   * 
   * @param {string} tokenValue - O token de acesso gerado pela API.
   * @param {string|Object} secondArg - Pode ser o refreshToken (se houver 3 args) ou o objeto user (se houver 2 args).
   * @param {Object} [thirdArg=null] - O objeto user, caso seja passado o refreshToken como segundo argumento.
   */
  function saveSession(tokenValue, secondArg, thirdArg = null) {
    let finalRefreshToken = null
    let finalUser = secondArg

    // Lógica para detetar se o utilizador passou 3 argumentos e ajustar os parâmetros correspondentes.
    if (thirdArg !== null) {
      finalRefreshToken = secondArg
      finalUser = thirdArg
    }

    // Grava as informações no armazenamento local persistente do navegador.
    localStorage.setItem('token', tokenValue)
    if (finalRefreshToken) {
      localStorage.setItem('refreshToken', finalRefreshToken)
    }
    // Serializa o objeto JavaScript para uma string JSON antes de guardar.
    localStorage.setItem('user', JSON.stringify(finalUser))
  }

  return { token, refreshToken, user, isLoggedIn, logout, saveSession }
}

