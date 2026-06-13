/**
 * @file auth.js
 * @description Middleware para autenticação e autorização de utilizadores na aplicação.
 * Implementa uma validação simplificada por token fictício, ideal para ambientes de desenvolvimento/teste.
 */

const Utilizador = require('../models/utilizador');

/**
 * @function verifyToken
 * @async
 * @description Middleware para verificar a presença de um token de autorização HTTP (Bearer)
 * no cabeçalho (Header) do pedido. Descodifica o token fictício, extrai o ID do utilizador,
 * procura o registo correspondente na base de dados e anexa o objeto utilizador ao objeto do pedido (`req.user`).
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Expects 'Authorization' header in format: "Bearer fake-jwt-token-{id}".
 * @param {Object} res - Objeto de resposta Express (Response).
 * @param {Function} next - Função next para passar o controlo para o próximo middleware/route handler.
 * @returns {Object} Retorna uma resposta HTTP 401 ou 500 em caso de falha de autenticação.
 */
async function verifyToken(req, res, next) {
    // Obtém o cabeçalho Authorization do pedido HTTP.
    const authHeader = req.headers['authorization'];
    // Extrai o token do formato 'Bearer <token>'.
    const token = authHeader && authHeader.split(' ')[1];
    
    // Se nenhum token for enviado, rejeita o pedido com erro 401.
    if (!token) {
        return res.status(401).json({ message: 'Sessão expirada. Por favor faça login novamente.' });
    }
    
    // Extração do ID do utilizador a partir do formato customizado do token fictício: 'fake-jwt-token-{id}'
    const userId = token.replace('fake-jwt-token-', '');
    try {
        // Procura o utilizador na base de dados pela chave primária (PK).
        const user = await Utilizador.findByPk(userId);
        if (!user) {
            return res.status(401).json({ message: 'Sessão inválida. Por favor faça login novamente.' });
        }
        // Anexa os dados do utilizador autenticado ao pedido para que as rotas seguintes possam consumi-los.
        req.user = user;
        next();
    } catch (err) {
        // Captura e reporta eventuais falhas na comunicação com a base de dados.
        return res.status(500).json({ message: 'Erro ao autenticar utilizador.', error: err.message });
    }
}

/**
 * @function verifyAdmin
 * @description Middleware de autorização para garantir que o utilizador autenticado atual
 * possui a função (role) de 'ADMIN'. Deve ser executado sempre a seguir ao verifyToken.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Deve conter `req.user` definido.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @param {Function} next - Função next para passar o controlo.
 * @returns {Object} Retorna resposta HTTP 401 se não autenticado, ou 403 se o perfil não for de administrador.
 */
function verifyAdmin(req, res, next) {
    // Se o middleware verifyToken não tiver sido executado previamente, rejeita o pedido.
    if (!req.user) {
        return res.status(401).json({ message: 'Utilizador não autenticado.' });
    }
    // Valida se o tipo do utilizador é estritamente 'ADMIN'.
    if (req.user.tipo_utilizador !== 'ADMIN') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores têm permissão para aceder a esta funcionalidade.' });
    }
    next();
}

module.exports = {
    verifyToken,
    verifyAdmin
};

