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
        const { method, amount, promoCode, useLoyaltyPoints } = req.body;
        
        const reser = await Reserva.findByPk(reservationId);
        if (!reser) {
            return res.status(404).json({ message: 'Reserva não encontrada.' });
        }
        
        let baseAmount = amount || 25.50;
        if (promoCode === 'Codigo VSKI') {
            baseAmount = 0.67;
        }
        
        let discount = 0;
        let pointsToDeduct = 0;

        if (useLoyaltyPoints && req.user.pontos_fidelidade > 0) {
            // 100 points = 1.00 discount.
            const maxPointsDiscount = req.user.pontos_fidelidade / 100;
            if (maxPointsDiscount >= baseAmount) {
                discount = baseAmount;
                pointsToDeduct = Math.floor(baseAmount * 100);
            } else {
                discount = maxPointsDiscount;
                pointsToDeduct = req.user.pontos_fidelidade;
            }
        }

        const finalAmount = Math.max(0, baseAmount - discount);

        // Deduct points if used
        if (pointsToDeduct > 0) {
            req.user.pontos_fidelidade -= pointsToDeduct;
        }

        // Earn new points on the remaining cash portion: 10 points per unit spent
        const pointsEarned = Math.round(finalAmount * 10);
        req.user.pontos_fidelidade += pointsEarned;
        await req.user.save();
        
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
        
        res.status(201).json({
            id_pagamento: payment.id_pagamento,
            id_reserva: payment.id_reserva,
            id_utilizador: payment.id_utilizador,
            valor: payment.valor,
            metodo_pagamento: payment.metodo_pagamento,
            estado_pagamento: payment.estado_pagamento,
            data_pagamento: payment.data_pagamento,
            loyaltyPoints: req.user.pontos_fidelidade,
            pointsEarned,
            pointsDeducted: pointsToDeduct
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao processar pagamento.', error: err.message });
    }
};
