const Pagamento = require('../models/pagamento');
const Reserva = require('../models/reserva');
const Vaga = require('../models/vaga');

exports.obterMetodosPagamento = async (req, res) => {
    res.json([
        { id: 'visa', name: 'Visa', details: '**** 4242' },
        { id: 'applepay', name: 'Apple Pay', details: '' },
        { id: 'mbway', name: 'MB Way', details: '' }
    ]);
};

exports.criarPagamento = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const { method, amount, promoCode } = req.body;
        
        const reser = await Reserva.findByPk(reservationId);
        if (!reser) {
            return res.status(404).json({ message: 'Reserva não encontrada.' });
        }
        
        let finalAmount = amount || 25.50;
        if (promoCode === 'Codigo VSKI') {
            finalAmount = 0.67;
        }
        
        // Create payment
        const payment = await Pagamento.create({
            valor: finalAmount,
            metodo_pagamento: method === 'visa' ? 'CARTAO_CREDITO' : (method === 'mbway' ? 'MBWAY' : 'CARTAO_DEBITO'),
            estado_pagamento: 'REALIZADO',
            id_reserva: reservationId,
            id_utilizador: req.user.id_utilizador,
            data_pagamento: new Date()
        });
        
        // Confirm reservation and mark the vaga as RESERVED
        await reser.update({ estado_reserva: 'CONFIRMADA' });
        await Vaga.update({ estado: 'RESERVADO' }, { where: { id_vaga: reser.id_vaga } });
        
        res.status(201).json(payment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao processar pagamento.', error: err.message });
    }
};
