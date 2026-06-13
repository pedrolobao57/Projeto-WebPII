/**
 * @file ReservaController.js
 * @description Controlador encarregue da gestão de reservas de vagas de estacionamento.
 * Habilita a criação de novas reservas verificando sobreposição de horários, o cancelamento de reservas,
 * e a listagem de reservas formatadas para exibição direta na interface gráfica do utilizador.
 */

const { Op } = require('sequelize');
const Reserva = require('../models/reserva');
const Vaga = require('../models/vaga');
const Veiculo = require('../models/veiculo');
const Zona = require('../models/zona');
const ParqueEstacionamento = require('../models/parque_estacionamento');

/**
 * @function criarReserva
 * @async
 * @description Cria uma nova reserva de vaga de estacionamento para o utilizador autenticado.
 * Efetua as seguintes verificações de integridade:
 * 1. Verifica se a vaga existe e não está no estado 'INDISPONIVEL'.
 * 2. Verifica se a vaga já tem reservas no estado 'PENDENTE' ou 'CONFIRMADA' que coincidam ou
 *    se sobreponham temporalmente com o intervalo de datas selecionado (`data_inicio` e `data_fim`).
 * 3. Garante que o utilizador tem pelo menos um veículo associado. Se nenhum `id_veiculo` for enviado,
 *    associa automaticamente o primeiro veículo registado pelo utilizador.
 * 4. Altera o estado da vaga para 'RESERVADO' e persiste o registo da reserva.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `id_vaga`, `data_inicio`, `data_fim`, e `id_veiculo`. `req.user` deve estar definido pelo middleware de autenticação.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna a nova reserva criada ou erro 400/500 com o detalhe.
 */
exports.criarReserva = async (req, res) => {
    try {
        const { id_vaga, data_inicio, data_fim, id_veiculo } = req.body;
        const id_utilizador = req.user.id_utilizador;

        // 1. Validar a existência e operacionalidade da vaga de estacionamento pretendida.
        const vaga = await Vaga.findByPk(id_vaga);
        if (!vaga || vaga.estado === 'INDISPONIVEL') {
            return res.status(400).json({ error: 'A vaga selecionada não está disponível para reserva.' });
        }

        const dataInicioDate = new Date(data_inicio);
        const dataFimDate = new Date(data_fim);

        // --- Verificação de Sobreposição Temporal de Reservas ---
        // Procura alguma reserva existente para a mesma vaga, em estados ativos, cujo intervalo coincida:
        // (reserva.data_inicio < nova.data_fim) E (reserva.data_fim > nova.data_inicio)
        const reservaExistente = await Reserva.findOne({
            where: {
                id_vaga,
                estado_reserva: {
                    [Op.in]: ['PENDENTE', 'CONFIRMADA']
                },
                data_inicio: {
                    [Op.lt]: dataFimDate
                },
                data_fim: {
                    [Op.gt]: dataInicioDate
                }
            }
        });

        if (reservaExistente) {
            return res.status(400).json({ error: 'A vaga selecionada já está reservada para o período pretendido.' });
        }

        // 2. Determinar o ID do veículo a associar à reserva.
        let vehicleId = id_veiculo;
        // Caso o frontend não envie um ID de veículo específico, tenta associar o primeiro veículo do utilizador.
        if (!vehicleId) {
            const firstVehicle = await Veiculo.findOne({ where: { id_utilizador } });
            if (!firstVehicle) {
                return res.status(400).json({ error: 'Deve registar pelo menos um veículo antes de efetuar uma reserva.' });
            }
            vehicleId = firstVehicle.id_veiculo;
        }

        // 3. Efetivar a inserção do registo da nova reserva com estado inicial 'PENDENTE'.
        const novaReserva = await Reserva.create({
            id_utilizador,
            id_veiculo: vehicleId,
            id_vaga,
            data_inicio: new Date(data_inicio),
            data_fim: new Date(data_fim),
            estado_reserva: 'PENDENTE'
        });

        // 4. Bloquear/atualizar o estado imediato da vaga para 'RESERVADO'.
        await vaga.update({ estado: 'RESERVADO' });

        res.status(201).json({ message: 'Reserva efetuada com sucesso!', novaReserva });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar reserva.', detalhes: err.message });
    }
};

/**
 * @function cancelarReserva
 * @async
 * @description Cancela uma reserva ativa identificada pelo ID.
 * Liberta a vaga de estacionamento associada alterando o seu estado para 'LIVRE' e define a reserva como 'CANCELADA'.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém o ID da reserva em `req.params.id`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Mensagem de sucesso ou erro 404/500.
 */
exports.cancelarReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await Reserva.findByPk(id);
        
        if (!reserva) return res.status(404).json({ error: 'Reserva não encontrada.' });

        // Liberta a vaga de estacionamento que estava bloqueada por esta reserva.
        await Vaga.update({ estado: 'LIVRE' }, { where: { id_vaga: reserva.id_vaga } });
        // Modifica o estado lógico da reserva para 'CANCELADA'.
        await reserva.update({ estado_reserva: 'CANCELADA' });

        res.json({ message: 'Reserva cancelada com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao cancelar reserva.', detalhes: err.message });
    }
};

/**
 * @function listarReservas
 * @async
 * @description Obtém a lista de todas as reservas do utilizador autenticado atual,
 * ordenadas cronologicamente por data de início de forma decrescente.
 * Formata os dados para corresponder ao esquema de apresentação esperado pela DashboardView do frontend
 * (ex: gera strings amigáveis para horas, localizações e mapeia estados internos para termos da UI).
 * 
 * @param {Object} req - Objeto de pedido Express (Request). `req.user` deve conter o utilizador autenticado.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Array} Array de objetos contendo os dados formatados das reservas.
 */
exports.listarReservas = async (req, res) => {
    try {
        const id_utilizador = req.user.id_utilizador;
        const reservations = await Reserva.findAll({
            where: { id_utilizador },
            // Realiza Joins complexos para carregar informação da vaga, da sua zona e do respetivo parque de estacionamento, bem como a viatura associada.
            include: [
                {
                    model: Vaga,
                    include: [{ model: Zona, include: [ParqueEstacionamento] }]
                },
                Veiculo
            ],
            order: [['data_inicio', 'DESC']]
        });

        // Formata os registos da BD no formato ideal consumido pela Dashboard do Frontend
        const results = reservations.map(r => {
            // Conversão de datas e horas em strings formatadas de leitura fácil.
            const timeStart = new Date(r.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const timeEnd = new Date(r.data_fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(r.data_inicio).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            
            // Lógica de mapeamento dinâmico do estado da reserva para a interface gráfica
            let status = 'Upcoming';
            if (r.estado_reserva === 'CONFIRMADA') {
                const now = new Date();
                // Se o período de reserva coincidir com a hora atual, define-a como ativa na UI.
                if (now >= new Date(r.data_inicio) && now <= new Date(r.data_fim)) {
                    status = 'Active';
                }
            } else if (r.estado_reserva === 'CANCELADA') {
                status = 'Cancelled';
            } else if (r.estado_reserva === 'CONCLUIDA') {
                status = 'Completed';
            }

            return {
                id: r.id_reserva.toString(),
                resIdHex: `R-${r.id_reserva.toString().padStart(3, '0')}`,
                status: status,
                location: r.Vaga?.Zona?.ParqueEstacionamento?.nome || 'ParkSmart Garage',
                address: r.Vaga?.Zona?.ParqueEstacionamento?.localizacao || 'Street Address',
                level: r.Vaga?.Zona?.nome_zona || 'Piso 1',
                time: `${timeStart} - ${timeEnd} ${dateStr}`,
                spotId: r.Vaga?.id_vaga.toString(),
                spotNumber: r.Vaga?.numero_vaga || 'A-01',
                vehiclePlate: r.Veiculo?.matricula || '',
                id_veiculo: r.id_veiculo,
                data_inicio: r.data_inicio,
                data_fim: r.data_fim
            };
        });

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reservas.', detalhes: err.message });
    }
};

/**
 * @function obterReserva
 * @async
 * @description Obtém a informação pormenorizada de uma reserva específica a partir do ID.
 * Semelhante à listagem, inclui associações profundas e devolve os dados formatados em formato plano.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém `id` da reserva em `req.params.id`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna o objeto formatado com detalhes da reserva ou erro 404/500.
 */
exports.obterReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const r = await Reserva.findByPk(id, {
            include: [
                {
                    model: Vaga,
                    include: [{ model: Zona, include: [ParqueEstacionamento] }]
                },
                Veiculo
            ]
        });

        if (!r) {
            return res.status(404).json({ error: 'Reserva não encontrada.' });
        }

        const timeStart = new Date(r.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeEnd = new Date(r.data_fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(r.data_inicio).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

        res.json({
            id: r.id_reserva.toString(),
            resIdHex: `R-${r.id_reserva.toString().padStart(3, '0')}`,
            status: r.estado_reserva,
            location: r.Vaga?.Zona?.ParqueEstacionamento?.nome || 'ParkSmart Garage',
            address: r.Vaga?.Zona?.ParqueEstacionamento?.localizacao || 'Street Address',
            level: r.Vaga?.Zona?.nome_zona || 'Piso 1',
            time: `${timeStart} - ${timeEnd} ${dateStr}`,
            spotId: r.Vaga?.id_vaga.toString(),
            spotNumber: r.Vaga?.numero_vaga || 'A-01',
            vehiclePlate: r.Veiculo?.matricula || '',
            id_veiculo: r.id_veiculo,
            vehicleBrand: r.Veiculo?.marca || '',
            vehicleModel: r.Veiculo?.modelo || ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reserva.', detalhes: err.message });
    }
};

