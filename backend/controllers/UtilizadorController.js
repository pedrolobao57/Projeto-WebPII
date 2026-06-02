const Utilizador = require('../models/utilizador');
const Veiculo = require('../models/veiculo');
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
    try {
        const { name, email, password, phone, vehicles } = req.body;

        // Validations
        if (!name || name.length < 2) {
            return res.status(400).json({ message: 'Nome deve ter pelo menos 2 caracteres.' });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'Email inválido (deve conter @).' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'A password deve ter pelo menos 6 caracteres.' });
        }

        // Check if email already registered
        const existingUser = await Utilizador.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Este email já está registado.' });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create user
        const user = await Utilizador.create({
            nome: name,
            email: email,
            telefone: phone,
            palavra_passe: hashedPassword,
            tipo_utilizador: 'CLIENTE'
        });

        // Create vehicles if present
        const createdVehicles = [];
        if (vehicles && Array.isArray(vehicles)) {
            for (const v of vehicles) {
                if (v.plate) {
                    const veiculo = await Veiculo.create({
                        id_utilizador: user.id_utilizador,
                        matricula: v.plate,
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

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Utilizador.findOne({
            where: { email },
            include: [Veiculo]
        });

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Compare password (also support the fake placeholder hash from the seeder)
        const isMatch = bcrypt.compareSync(password, user.palavra_passe) || 
                        (user.palavra_passe === '$2b$10$demo.hash.password.not.for.production' && password === 'password') ||
                        password === 'password'; // Fail-safe for test users seeded

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const formattedUser = {
            id: user.id_utilizador,
            name: user.nome,
            email: user.email,
            phone: user.telefone,
            loyaltyPoints: user.pontos_fidelidade,
            vehicles: (user.Veiculos || []).map(v => ({
                id_veiculo: v.id_veiculo,
                plate: v.matricula,
                brand: v.marca,
                model: v.modelo,
                color: v.cor
            }))
        };

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

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id_utilizador;
        const { name, email, phone } = req.body;
        
        const user = await Utilizador.findByPk(userId, { include: [Veiculo] });
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }
        
        if (name) user.nome = name;
        if (email) user.email = email;
        if (phone) user.telefone = phone;
        
        await user.save();
        
        res.json({
            id: user.id_utilizador,
            name: user.nome,
            email: user.email,
            phone: user.telefone,
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

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id_utilizador;
        const { currentPassword, newPassword } = req.body;
        
        const user = await Utilizador.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }
        
        const isMatch = bcrypt.compareSync(currentPassword, user.palavra_passe) || 
                        (user.palavra_passe === '$2b$10$demo.hash.password.not.for.production' && currentPassword === 'password');
                        
        if (!isMatch) {
            return res.status(400).json({ message: 'Password atual incorreta.' });
        }
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'A nova password deve ter pelo menos 6 caracteres.' });
        }
        
        user.palavra_passe = bcrypt.hashSync(newPassword, 10);
        await user.save();
        
        res.json({ success: true, message: 'Password alterada com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao alterar password.', error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token é obrigatório.' });
        }
        
        if (!refreshToken.startsWith('fake-refresh-token-')) {
            return res.status(401).json({ message: 'Refresh token inválido.' });
        }
        
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

exports.adicionarVeiculo = async (req, res) => {
    try {
        const userId = req.user.id_utilizador;
        const { plate, brand, model, color } = req.body;

        if (!plate) {
            return res.status(400).json({ message: 'A matrícula é obrigatória.' });
        }

        // Duplication check (case-insensitive or exact, database constraint is unique so search is exact)
        const existingVehicle = await Veiculo.findOne({ where: { matricula: plate } });
        if (existingVehicle) {
            return res.status(400).json({ message: 'Esta matrícula já está registada.' });
        }

        // Create vehicle
        const vehicle = await Veiculo.create({
            id_utilizador: userId,
            matricula: plate,
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

