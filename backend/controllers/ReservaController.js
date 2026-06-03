const { Op } = require('sequelize');
const Reserva = require('../models/reserva');
const Vaga = require('../models/vaga');
const Veiculo = require('../models/veiculo');
const Zona = require('../models/zona');
const ParqueEstacionamento = require('../models/parque_estacionamento');

exports.criarReserva = async (req, res) => {
    try {
        const { id_vaga, data_inicio, data_fim, id_veiculo } = req.body;
        const id_utilizador = req.user.id_utilizador;

        // 1. Verificar se a vaga existe e não está indisponível
        const vaga = await Vaga.findByPk(id_vaga);
        if (!vaga || vaga.estado === 'INDISPONIVEL') {
            return res.status(400).json({ error: 'A vaga selecionada não está disponível para reserva.' });
        }

        // Verificar se já existe uma reserva ativa (PENDENTE ou CONFIRMADA) para a mesma vaga no mesmo período
        const dataInicioDate = new Date(data_inicio);
        const dataFimDate = new Date(data_fim);

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

        // 2. Determinar id_veiculo se não enviado
        let vehicleId = id_veiculo;
        if (!vehicleId) {
            const firstVehicle = await Veiculo.findOne({ where: { id_utilizador } });
            if (!firstVehicle) {
                return res.status(400).json({ error: 'Deve registar pelo menos um veículo antes de efetuar uma reserva.' });
            }
            vehicleId = firstVehicle.id_veiculo;
        }

        // 3. Criar a reserva
        const novaReserva = await Reserva.create({
            id_utilizador,
            id_veiculo: vehicleId,
            id_vaga,
            data_inicio: new Date(data_inicio),
            data_fim: new Date(data_fim),
            estado_reserva: 'PENDENTE'
        });

        // 4. Atualizar o estado da Vaga para 'RESERVADO'
        await vaga.update({ estado: 'RESERVADO' });

        res.status(201).json({ message: 'Reserva efetuada com sucesso!', novaReserva });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar reserva.', detalhes: err.message });
    }
};

exports.cancelarReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await Reserva.findByPk(id);
        
        if (!reserva) return res.status(404).json({ error: 'Reserva não encontrada.' });

        // Libertar a vaga associada
        await Vaga.update({ estado: 'LIVRE' }, { where: { id_vaga: reserva.id_vaga } });
        await reserva.update({ estado_reserva: 'CANCELADA' });

        res.json({ message: 'Reserva cancelada com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao cancelar reserva.', detalhes: err.message });
    }
};

exports.listarReservas = async (req, res) => {
    try {
        const id_utilizador = req.user.id_utilizador;
        const reservations = await Reserva.findAll({
            where: { id_utilizador },
            include: [
                {
                    model: Vaga,
                    include: [{ model: Zona, include: [ParqueEstacionamento] }]
                },
                Veiculo
            ],
            order: [['data_inicio', 'DESC']]
        });

        // Format to match DashboardView reservations schema
        const results = reservations.map(r => {
            const timeStart = new Date(r.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const timeEnd = new Date(r.data_fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(r.data_inicio).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            
            let status = 'Upcoming';
            if (r.estado_reserva === 'CONFIRMADA') {
                const now = new Date();
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
                level: r.Vaga?.Zona?.nome_zona || 'Piso 1',
                time: `${timeStart} - ${timeEnd} ${dateStr}`,
                spotId: r.Vaga?.id_vaga.toString(),
                spotNumber: r.Vaga?.numero_vaga || 'A-01',
                vehiclePlate: r.Veiculo?.matricula || '',
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
            vehicleBrand: r.Veiculo?.marca || '',
            vehicleModel: r.Veiculo?.modelo || ''
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar reserva.', detalhes: err.message });
    }
};
