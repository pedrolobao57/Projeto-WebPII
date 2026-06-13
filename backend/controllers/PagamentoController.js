/**
 * @file PagamentoController.js
 * @description Controlador responsável pelo checkout e faturação de reservas.
 * Permite a listagem de métodos de pagamento suportados e o processamento financeiro
 * das reservas, incluindo lógica de cupões de desconto e de conversão do sistema de fidelidade.
 */

const Pagamento = require('../models/pagamento');
const Reserva = require('../models/reserva');
const Vaga = require('../models/vaga');

/**
 * @function obterMetodosPagamento
 * @async
 * @description Retorna a lista de métodos de pagamento pré-configurados e suportados pela aplicação.
 * 
 * @param {Object} req - Objeto de pedido Express (Request).
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Array} Array de objetos contendo identificadores, nomes e detalhes dos métodos de pagamento.
 */
exports.obterMetodosPagamento = async (req, res) => {
    res.json([
        { id: 'visa', name: 'Visa', details: '**** 4242' },
        { id: 'applepay', name: 'Apple Pay', details: '' },
        { id: 'mbway', name: 'MB Way', details: '' }
    ]);
};

/**
 * @function criarPagamento
 * @async
 * @description Processa o pagamento financeiro para efetivar/confirmar uma reserva de estacionamento.
 * Implementa as seguintes etapas:
 * 1. Procura a reserva pelo ID.
 * 2. Define o valor base (amount enviado ou valor padrão de 25.50).
 * 3. Aplica o cupão promocional especial 'Codigo VSKI' (reduz o valor base para 0.67).
 * 4. Executa a dedução de pontos de fidelidade do utilizador autenticado (100 pontos = 1.00€), caso solicitado.
 * 5. Adiciona novos pontos de fidelidade ganhos com base no montante pago (10 pontos por cada 1€ pago).
 * 6. Cria o registo físico de Pagamento em estado 'REALIZADO'.
 * 7. Confirma o estado da reserva para 'CONFIRMADA' e atualiza a vaga de estacionamento para 'RESERVADO'.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém os dados do utilizador em `req.user`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Detalhes do pagamento efetuado, pontos acumulados/deduzidos e o estado final.
 */
exports.criarPagamento = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const { method, amount, promoCode, useLoyaltyPoints } = req.body;
        
        // Verifica a existência da reserva na base de dados.
        const reser = await Reserva.findByPk(reservationId);
        if (!reser) {
            return res.status(404).json({ message: 'Reserva não encontrada.' });
        }
        
        // Atribui o valor base enviado no pedido ou assume o valor padrão de checkout fixo (25.50).
        let baseAmount = amount || 25.50;
        // Validação do cupão especial (easter egg) para testes rápidos e demonstrações do sistema.
        if (promoCode === 'Codigo VSKI') {
            baseAmount = 0.67;
        }
        
        let discount = 0;
        let pointsToDeduct = 0;

        // --- Aplicação de Desconto por Fidelidade (100 pontos = 1€) ---
        if (useLoyaltyPoints && req.user.pontos_fidelidade > 0) {
            const maxPointsDiscount = req.user.pontos_fidelidade / 100;
            if (maxPointsDiscount >= baseAmount) {
                discount = baseAmount;
                pointsToDeduct = Math.floor(baseAmount * 100);
            } else {
                discount = maxPointsDiscount;
                pointsToDeduct = req.user.pontos_fidelidade;
            }
        }

        // Calcula o valor final pós-desconto (não permitindo valores negativos).
        const finalAmount = Math.max(0, baseAmount - discount);

        // Deduz os pontos gastos do saldo do utilizador autenticado.
        if (pointsToDeduct > 0) {
            req.user.pontos_fidelidade -= pointsToDeduct;
        }

        // --- Atribuição de Novos Pontos por Consumo ---
        // Atribui 10 pontos por cada euro efetivamente pago em dinheiro/cartão.
        const pointsEarned = Math.round(finalAmount * 10);
        req.user.pontos_fidelidade += pointsEarned;
        // Salva a alteração do saldo de pontos do utilizador.
        await req.user.save();
        
        // Cria a transação de pagamento persistente com o mapeamento correto dos cartões.
        const payment = await Pagamento.create({
            valor: finalAmount,
            metodo_pagamento: method === 'visa' ? 'CARTAO_CREDITO' : (method === 'mbway' ? 'MBWAY' : 'CARTAO_DEBITO'),
            estado_pagamento: 'REALIZADO',
            id_reserva: reservationId,
            id_utilizador: req.user.id_utilizador,
            data_pagamento: new Date()
        });
        
        // Atualiza o estado da reserva para 'CONFIRMADA' para permitir ao cliente estacionar na data marcada.
        await reser.update({ estado_reserva: 'CONFIRMADA' });
        // Mantém a vaga reservada/bloqueada para esta estadia programada.
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

