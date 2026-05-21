const Reserva = require('../models/reserva');
const Vaga = require('../models/vaga');

exports.criarReserva = async (req, res) => {
    try {
        const { id_utilizador, id_vaga, data_hora_inicio_prevista, data_hora_fim_prevista } = req.body;

        // 1. Verificar se a vaga está livre
        const vaga = await Vaga.findByPk(id_vaga);
        if (!vaga || vaga.estado !== 'Livre') {
            return res.status(400).json({ error: 'A vaga selecionada não está disponível para reserva.' });
        }

        // 2. Criar a reserva
        const novaReserva = await Reserva.create({
            id_utilizador,
            id_vaga,
            data_hora_inicio_prevista,
            data_hora_fim_prevista,
            estado_reserva: 'Pendente'
        });

        // 3. Atualizar o estado da Vaga para 'Reservada'
        await vaga.update({ estado: 'Reservada' });

        res.status(201).json({ message: 'Reserva efetuada com sucesso!', novaReserva });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao processar reserva.', detalhes: err.message });
    }
};

exports.cancelarReserva = async (req, res) => {
    try {
        const { id_reserva } = req.params;
        const reserva = await Reserva.findByPk(id_reserva);
        
        if (!reserva) return res.status(404).json({ error: 'Reserva não encontrada.' });

        // Libertar a vaga associada
        await Vaga.update({ estado: 'Livre' }, { where: { id_vaga: reserva.id_vaga } });
        await reserva.update({ estado: 'Cancelada' });

        res.json({ message: 'Reserva cancelada com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao cancelar reserva.' });
    }
};
