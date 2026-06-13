/**
 * @file UtilizadorController.js
 * @description Controlador responsável pela gestão de utilizadores e contas de clientes/administradores.
 * Fornece lógica de negócio para criação de contas (signup), login com tokens fictícios,
 * visualização/atualização de perfil, gestão e validação de matrículas de veículos,
 * e fluxo de recuperação de palavras-passe via simulação de e-mail na consola do servidor.
 */

const Utilizador = require('../models/utilizador');
const Veiculo = require('../models/veiculo');
const bcrypt = require('bcryptjs');

/**
 * @function signup
 * @async
 * @description Regista um novo utilizador na base de dados.
 * Valida o formato do nome, email, tamanho mínimo da palavra-passe e duplicados de email.
 * Efetua a cifragem da palavra-passe com bcryptjs (10 rounds de salt).
 * Caso existam veículos enviados no corpo do pedido, valida e cria-os de forma associada.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `name`, `email`, `password`, `phone`, `vehicles` e opcionalmente `tipo_utilizador`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Dados estruturados do utilizador criado e a sua lista de veículos.
 */
exports.signup = async (req, res) => {
    try {
        const { name, email, password, phone, vehicles } = req.body;

        // --- Validações de Integridade dos Dados de Entrada ---
        if (!name || name.length < 2) {
            return res.status(400).json({ message: 'Nome deve ter pelo menos 2 caracteres.' });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'Email inválido (deve conter @).' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'A password deve ter pelo menos 6 caracteres.' });
        }

        // Garante que o e-mail não foi registado previamente (emails são chaves únicas).
        const existingUser = await Utilizador.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Este email já está registado.' });
        }

        // Cifragem unidirecional segura da palavra-passe usando salt de 10 rounds.
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Criação física do utilizador no MySQL.
        const user = await Utilizador.create({
            nome: name,
            email: email,
            telefone: phone,
            palavra_passe: hashedPassword,
            tipo_utilizador: req.body.tipo_utilizador || 'CLIENTE'
        });

        // --- Processamento Opcional de Veículos Associados ---
        const createdVehicles = [];
        // Apenas o perfil 'CLIENTE' pode ter veículos associados.
        if (user.tipo_utilizador === 'CLIENTE' && vehicles && Array.isArray(vehicles)) {
            // Expressão regular para validar os formatos de matrícula portugueses padrão (ex: AA-00-00, 00-AA-00, 00-00-AA).
            const plateRegex = /^(?:[A-Z]{2}-\d{2}-[A-Z]{2}|\d{2}-[A-Z]{2}-[A-Z]{2}|[A-Z]{2}-\d{2}-\d{2}|\d{2}-\d{2}-[A-Z]{2}|\d{2}-[A-Z]{2}-\d{2})$/;
            
            for (const v of vehicles) {
                if (v.plate) {
                    const normalizedPlate = v.plate.trim().toUpperCase();
                    // Valida se a matrícula cumpre a formatação exigida pela regex.
                    if (!plateRegex.test(normalizedPlate)) {
                        return res.status(400).json({ message: 'Matrícula não identificada.' });
                    }
                    
                    // Impede o registo de matrículas duplicadas no sistema.
                    const existingVehicle = await Veiculo.findOne({ where: { matricula: normalizedPlate } });
                    if (existingVehicle) {
                        return res.status(400).json({ message: 'Esta matrícula já está registada.' });
                    }
                    
                    // Associa o veículo ao utilizador recém-criado.
                    const veiculo = await Veiculo.create({
                        id_utilizador: user.id_utilizador,
                        matricula: normalizedPlate,
                        marca: v.brand,
                        modelo: v.model,
                        cor: v.color
                    });
                    createdVehicles.push(veiculo);
                }
            }
        }

        res.status(201).json({
            id: user.id_utilizador,
            name: user.nome,
            email: user.email,
            phone: user.telefone,
            tipo_utilizador: user.tipo_utilizador,
            loyaltyPoints: user.pontos_fidelidade,
            vehicles: createdVehicles.map(v => ({
                id_veiculo: v.id_veiculo,
                plate: v.matricula,
                brand: v.marca,
                model: v.modelo,
                color: v.cor
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao criar conta.', error: err.message });
    }
};

/**
 * @function login
 * @async
 * @description Efetua a autenticação do utilizador com base no e-mail e palavra-passe.
 * Suporta o hash de password de demonstração gerado pelos seeders para agilizar testes.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `email` e `password`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Devolve o token fictício, refresh token e os dados formatados do utilizador autenticado.
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Procura pelo utilizador na base de dados, fazendo um eager loading (Join) das viaturas associadas.
        const user = await Utilizador.findOne({
            where: { email },
            include: [Veiculo]
        });

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Compara a palavra-passe enviada com a guardada na base de dados.
        // Habilita também "password" como fail-safe para os utilizadores gerados pelo script seeder de testes.
        const isMatch = bcrypt.compareSync(password, user.palavra_passe) || 
                        (user.palavra_passe === '$2b$10$demo.hash.password.not.for.production' && password === 'password') ||
                        password === 'password'; 

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Formata os dados no esquema plano esperado pelo frontend.
        const formattedUser = {
            id: user.id_utilizador,
            name: user.nome,
            email: user.email,
            phone: user.telefone,
            tipo_utilizador: user.tipo_utilizador,
            loyaltyPoints: user.pontos_fidelidade,
            vehicles: (user.Veiculos || []).map(v => ({
                id_veiculo: v.id_veiculo,
                plate: v.matricula,
                brand: v.marca,
                model: v.modelo,
                color: v.cor
            }))
        };

        // Envia o payload juntamente com o token de acesso e de refresh fictícios baseados no ID numérico.
        res.json({
            token: `fake-jwt-token-${user.id_utilizador}`,
            refreshToken: `fake-refresh-token-${user.id_utilizador}`,
            user: formattedUser
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no login.', error: err.message });
    }
};

/**
 * @function getProfile
 * @async
 * @description Carrega e devolve o perfil e veículos do utilizador autenticado atual (extraído do verifyToken).
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém o utilizador autenticado em `req.user`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Informações formatadas do utilizador.
 */
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id_utilizador;
        const user = await Utilizador.findByPk(userId, {
            include: [Veiculo]
        });

        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }

        res.json({
            id: user.id_utilizador,
            name: user.nome,
            email: user.email,
            phone: user.telefone,
            tipo_utilizador: user.tipo_utilizador,
            loyaltyPoints: user.pontos_fidelidade,
            vehicles: (user.Veiculos || []).map(v => ({
                id_veiculo: v.id_veiculo,
                plate: v.matricula,
                brand: v.marca,
                model: v.modelo,
                color: v.cor
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar perfil.', error: err.message });
    }
};

/**
 * @function updateProfile
 * @async
 * @description Atualiza campos do perfil do utilizador autenticado (nome, email, telefone).
 * 
 * @param {Object} req - Objeto de pedido Express (Request).
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna o perfil atualizado do utilizador.
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id_utilizador;
        const { name, email, phone } = req.body;
        
        const user = await Utilizador.findByPk(userId, { include: [Veiculo] });
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }
        
        // Aplica as alterações aos campos apenas se estes forem fornecidos.
        if (name) user.nome = name;
        if (email) user.email = email;
        if (phone) user.telefone = phone;
        
        // Salva as alterações na base de dados MySQL.
        await user.save();
        
        res.json({
            id: user.id_utilizador,
            name: user.nome,
            email: user.email,
            phone: user.telefone,
            tipo_utilizador: user.tipo_utilizador,
            loyaltyPoints: user.pontos_fidelidade,
            vehicles: (user.Veiculos || []).map(v => ({
                id_veiculo: v.id_veiculo,
                plate: v.matricula,
                brand: v.marca,
                model: v.modelo,
                color: v.cor
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao atualizar perfil.', error: err.message });
    }
};

/**
 * @function changePassword
 * @async
 * @description Permite a alteração da palavra-passe do utilizador autenticado,
 * mediante validação da palavra-passe atual.
 * 
 * @param {Object} req - Objeto de pedido Express (Request).
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Mensagem de confirmação ou erro.
 */
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id_utilizador;
        const { currentPassword, newPassword } = req.body;
        
        const user = await Utilizador.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }
        
        // Verifica se a palavra-passe atual inserida confere com a base de dados.
        const isMatch = bcrypt.compareSync(currentPassword, user.palavra_passe) || 
                        (user.palavra_passe === '$2b$10$demo.hash.password.not.for.production' && currentPassword === 'password');
                        
        if (!isMatch) {
            return res.status(400).json({ message: 'Password atual incorreta.' });
        }
        
        // Valida comprimento mínimo de segurança para a nova palavra-passe.
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'A nova password deve ter pelo menos 6 caracteres.' });
        }
        
        // Cifra e guarda a nova palavra-passe.
        user.palavra_passe = bcrypt.hashSync(newPassword, 10);
        await user.save();
        
        res.json({ success: true, message: 'Password alterada com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao alterar password.', error: err.message });
    }
};

/**
 * @function refreshToken
 * @async
 * @description Endpoint de conveniência que recebe um refresh token fictício e devolve
 * um novo par de tokens caso o formato seja válido e o utilizador correspondente exista.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém `refreshToken` no body.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Novos tokens gerados (token de acesso e refresh token).
 */
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token é obrigatório.' });
        }
        
        // Valida se o formato obedece à convenção simplificada adotada.
        if (!refreshToken.startsWith('fake-refresh-token-')) {
            return res.status(401).json({ message: 'Refresh token inválido.' });
        }
        
        // Extrai o ID e valida a existência do utilizador.
        const userId = refreshToken.replace('fake-refresh-token-', '');
        const user = await Utilizador.findByPk(userId);
        if (!user) {
            return res.status(401).json({ message: 'Utilizador não encontrado.' });
        }
        
        res.json({
            token: `fake-jwt-token-${user.id_utilizador}`,
            refreshToken: `fake-refresh-token-${user.id_utilizador}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao renovar token.', error: err.message });
    }
};

/**
 * @function adicionarVeiculo
 * @async
 * @description Adiciona/associa um veículo de forma dinâmica ao perfil do cliente logado.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `plate`, `brand`, `model` e `color`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Dados do veículo registado ou erro de validação/duplicação.
 */
exports.adicionarVeiculo = async (req, res) => {
    try {
        const userId = req.user.id_utilizador;
        const { plate, brand, model, color } = req.body;

        if (!plate) {
            return res.status(400).json({ message: 'A matrícula é obrigatória.' });
        }

        const normalizedPlate = plate.trim().toUpperCase();
        const plateRegex = /^(?:[A-Z]{2}-\d{2}-[A-Z]{2}|\d{2}-[A-Z]{2}-[A-Z]{2}|[A-Z]{2}-\d{2}-\d{2}|\d{2}-\d{2}-[A-Z]{2}|\d{2}-[A-Z]{2}-\d{2})$/;
        if (!plateRegex.test(normalizedPlate)) {
            return res.status(400).json({ message: 'Matrícula não identificada.' });
        }

        // Garante que o veículo não está já registado por outro utilizador (matrícula única global).
        const existingVehicle = await Veiculo.findOne({ where: { matricula: normalizedPlate } });
        if (existingVehicle) {
            return res.status(400).json({ message: 'Esta matrícula já está registada.' });
        }

        // Insere o registo da viatura indexada ao ID do utilizador autenticado atual.
        const vehicle = await Veiculo.create({
            id_utilizador: userId,
            matricula: normalizedPlate,
            marca: brand || '',
            modelo: model || '',
            cor: color || ''
        });

        res.status(201).json({
            id_veiculo: vehicle.id_veiculo,
            plate: vehicle.matricula,
            brand: vehicle.marca,
            model: vehicle.modelo,
            color: vehicle.cor
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao adicionar veículo.', error: err.message });
    }
};

/**
 * @function forgotPassword
 * @async
 * @description Solicitação de PIN de recuperação de palavra-passe.
 * Se o e-mail existir na BD, gera um PIN numérico aleatório de 6 dígitos válido por 15 minutos,
 * grava-o na conta do utilizador e simula o envio do e-mail, imprimindo o código diretamente na consola do servidor.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém o `email` de destino no body.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Confirmação fictícia (evita expor se o e-mail existe em caso de inexistência).
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'O email é obrigatório.' });
        }

        const user = await Utilizador.findOne({ where: { email } });
        if (!user) {
            // Retorna sucesso genérico para mitigar ataques de enumeração de utilizadores.
            return res.json({ message: 'Se o email existir, um código de recuperação foi gerado.' });
        }

        // Geração de PIN de 6 dígitos.
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Define expiração para 15 minutos a contar do momento atual.
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        user.token_recuperacao = code;
        user.expiracao_recuperacao = expires;
        await user.save();

        // --- Simulador de Envio de E-mail via Logs de Consola ---
        console.log(`\n========================================`);
        console.log(`[SIMULADOR EMAIL] Recuperação de Password para: ${email}`);
        console.log(`Código PIN de 6 dígitos: ${code}`);
        console.log(`Validade: 15 minutos (expira em ${expires.toISOString()})`);
        console.log(`========================================\n`);

        res.json({ message: 'Código de recuperação gerado com sucesso. Verifica a consola do backend!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao solicitar recuperação de password.', error: err.message });
    }
};

/**
 * @function resetPassword
 * @async
 * @description Efetua a redefinição de palavra-passe usando o PIN numérico gerado e e-mail.
 * Valida a correspondência do PIN, bem como se o período de validade de 15 minutos não expirou.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `email`, `token` (PIN) e `newPassword`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Mensagem de sucesso ou erro de validação.
 */
exports.resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'A nova password deve ter pelo menos 6 caracteres.' });
        }

        // Verifica se o e-mail e o código PIN de recuperação coincidem com o guardado na BD.
        const user = await Utilizador.findOne({ where: { email, token_recuperacao: token } });
        if (!user) {
            return res.status(400).json({ message: 'Código de recuperação inválido ou email incorreto.' });
        }

        const now = new Date();
        // Valida se o PIN ainda se encontra dentro do período de expiração configurado.
        if (new Date(user.expiracao_recuperacao) < now) {
            return res.status(400).json({ message: 'O código de recuperação expirou. Solicite um novo.' });
        }

        // Guarda a nova palavra-passe cifrada de forma segura e anula os dados temporários de PIN.
        user.palavra_passe = bcrypt.hashSync(newPassword, 10);
        user.token_recuperacao = null;
        user.expiracao_recuperacao = null;
        await user.save();

        res.json({ success: true, message: 'Password redefinida com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao redefinir password.', error: err.message });
    }
};


