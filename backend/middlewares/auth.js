const Utilizador = require('../models/utilizador');

async function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Sessão expirada. Por favor faça login novamente.' });
    }
    
    // Extract user ID from fake-jwt-token-{id}
    const userId = token.replace('fake-jwt-token-', '');
    try {
        const user = await Utilizador.findByPk(userId);
        if (!user) {
            return res.status(401).json({ message: 'Sessão inválida. Por favor faça login novamente.' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ message: 'Erro ao autenticar utilizador.', error: err.message });
    }
}

function verifyAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Utilizador não autenticado.' });
    }
    if (req.user.tipo_utilizador !== 'ADMIN') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores têm permissão para aceder a esta funcionalidade.' });
    }
    next();
}

module.exports = {
    verifyToken,
    verifyAdmin
};
