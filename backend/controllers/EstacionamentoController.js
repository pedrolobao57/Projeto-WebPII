/**
 * @file EstacionamentoController.js
 * @description Controlador responsável por gerir o fluxo físico de veículos nos parques.
 * Trata o registo de entradas, cálculo de tempos de estadia, aplicação de tarifas,
 * processamento de descontos por fidelização/cupões, libertação de vagas e faturação de saídas.
 */

const Estacionamento = require('../models/estacionamento');
const Vaga = require('../models/vaga');
const Tarifa = require('../models/tarifa');
const Pagamento = require('../models/pagamento');

/**
 * @function registarEntrada
 * @async
 * @description Regista a entrada física de um veículo numa vaga de estacionamento.
 * Cria um registo de estacionamento 'ATIVO' com a hora atual e marca a vaga como 'OCUPADO'.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `id_veiculo`, `id_vaga` e opcionalmente `id_reserva`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna o registo de estacionamento criado ou erro 500.
 */
exports.registarEntrada = async (req, res) => {
    try {
        const { id_veiculo, id_vaga, id_reserva } = req.body;

        // Cria o registo de estacionamento no banco de dados.
        // O estado inicial é 'ATIVO' e a hora de entrada é a hora corrente do sistema.
        const entrada = await Estacionamento.create({
            data_hora_entrada: new Date(),
            id_veiculo,
            id_vaga,
            id_reserva: id_reserva || null,
            estado_estacionamento: 'ATIVO'
        });

        // Atualiza o estado da vaga correspondente para 'OCUPADO' na tabela de vagas.
        await Vaga.update({ estado: 'OCUPADO' }, { where: { id_vaga } });

        res.status(201).json({ message: 'Entrada registada!', entrada });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registar entrada.', detalhes: err.message });
    }
};

/**
 * @function registarSaida
 * @async
 * @description Regista e processa a saída de um veículo do parque.
 * Realiza as seguintes operações:
 * 1. Calcula os minutos totais de estadia.
 * 2. Determina o valor base de faturação (usando cupão especial, tarifa parametrizada ou taxa por omissão).
 * 3. Se houver utilizador registado, aplica descontos de pontos de fidelidade (100 pontos = 1.00) e calcula os pontos ganhos nesta transação (valor final * 10).
 * 4. Atualiza o registo de estacionamento para 'FINALIZADO' e a vaga para 'LIVRE'.
 * 5. Se aplicável, conclui a reserva associada.
 * 6. Cria um registo de pagamento ('REALIZADO').
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `id_estacionamento`, `id_tarifa`, `metodo_pagamento`, `id_utilizador`, `promoCode` e `useLoyaltyPoints`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna estatísticas da estadia, valor total cobrado, pontos acumulados/deduzidos e o objeto do pagamento gerado.
 */
exports.registarSaida = async (req, res) => {
    try {
        const { id_estacionamento, id_tarifa, metodo_pagamento, id_utilizador, promoCode, useLoyaltyPoints } = req.body;
        
        // Procura pelo registo de estacionamento ativo correspondente à entrada.
        const estadia = await Estacionamento.findByPk(id_estacionamento);
        if (!estadia) return res.status(404).json({ error: 'Registo de estacionamento não encontrado.' });

        const dataSaida = new Date();
        const dataEntrada = new Date(estadia.data_hora_entrada);
        
        // Calcula a diferença de tempo em minutos, arredondando por excesso (ceil) para cobrar o minuto iniciado.
        const minutosEstacionado = Math.ceil((dataSaida - dataEntrada) / (1000 * 60));

        // --- Cálculo do Valor Base da Estadia ---
        let baseAmount = 0;
        // Cupão promocional específico que define uma tarifa fixa e promocional de 0.67.
        if (promoCode === 'Codigo VSKI') {
            baseAmount = 0.67;
        } else if (id_tarifa) {
            // Caso exista uma tarifa definida na base de dados, carrega e valida-a.
            const tarifaAplicada = await Tarifa.findByPk(id_tarifa);
            if (tarifaAplicada) {
                // Só fatura se o tempo estacionado ultrapassar o período de tolerância (em minutos) parametrizado.
                if (minutosEstacionado > tarifaAplicada.tempo_tolerancia) {
                    baseAmount = minutosEstacionado * parseFloat(tarifaAplicada.valor_por_minuto);
                }
            }
        } else {
            // Taxa padrão por omissão (aprox. 8€ por hora = 0.133€ por minuto).
            baseAmount = minutosEstacionado * 0.133;
        }

        const Utilizador = require('../models/utilizador');
        const user = id_utilizador ? await Utilizador.findByPk(id_utilizador) : null;

        let discount = 0;
        let pointsToDeduct = 0;
        let pointsEarned = 0;

        // --- Gestão do Sistema de Pontos de Fidelidade ---
        if (user) {
            // Se o utilizador optar por usar pontos de fidelidade acumulados.
            if (useLoyaltyPoints && user.pontos_fidelidade > 0) {
                // Rácio de conversão: 100 pontos equivalem a 1.00 de desconto monetário.
                const maxPointsDiscount = user.pontos_fidelidade / 100;
                
                if (maxPointsDiscount >= baseAmount) {
                    // O saldo de pontos cobre a totalidade do valor a pagar.
                    discount = baseAmount;
                    pointsToDeduct = Math.floor(baseAmount * 100);
                } else {
                    // O saldo de pontos cobre apenas uma parte, gastando todos os pontos disponíveis.
                    discount = maxPointsDiscount;
                    pointsToDeduct = user.pontos_fidelidade;
                }
            }

            // O valor final nunca pode ser negativo.
            const finalAmount = Math.max(0, baseAmount - discount);
            baseAmount = finalAmount;

            // Deduz os pontos gastos do saldo do utilizador.
            if (pointsToDeduct > 0) {
                user.pontos_fidelidade -= pointsToDeduct;
            }

            // Cálculo dos pontos ganhos: Utilizador ganha 10 pontos por cada 1€ efetivamente pago.
            pointsEarned = Math.round(finalAmount * 10);
            user.pontos_fidelidade += pointsEarned;
            
            // Persiste as alterações do saldo de pontos na base de dados.
            await user.save();
        }

        // Atualiza a hora de saída e finaliza o estado da estadia física.
        await estadia.update({ data_hora_saida: dataSaida, estado_estacionamento: 'FINALIZADO' });

        // Liberta a vaga física de estacionamento correspondente para 'LIVRE'.
        await Vaga.update({ estado: 'LIVRE' }, { where: { id_vaga: estadia.id_vaga } });

        // Se o estacionamento foi originado a partir de uma reserva prévia, conclui a reserva.
        if (estadia.id_reserva) {
            const Reserva = require('../models/reserva');
            await Reserva.update({ estado_reserva: 'CONCLUIDA' }, { where: { id_reserva: estadia.id_reserva } });
        }

        // --- Registo da Transação de Pagamento ---
        // Garante que o método de pagamento mapeia para uma das opções suportadas (MBWAY, CARTAO_CREDITO ou CARTAO_DEBITO).
        const pagamento = await Pagamento.create({
            valor: baseAmount.toFixed(2),
            metodo_pagamento: metodo_pagamento === 'MBWAY' ? 'MBWAY' : (metodo_pagamento === 'CARTAO_CREDITO' ? 'CARTAO_CREDITO' : 'CARTAO_DEBITO'),
            data_pagamento: dataSaida,
            estado_pagamento: 'REALIZADO',
            id_estacionamento,
            id_utilizador,
            id_tarifa: id_tarifa || null
        });

        res.json({
            message: 'Saída processada e paga com sucesso!',
            minutosEstacionado,
            valorTotal: baseAmount.toFixed(2),
            pagamento,
            loyaltyPoints: user ? user.pontos_fidelidade : 0,
            pointsEarned,
            pointsDeducted: pointsToDeduct
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar saída.', detalhes: err.message });
    }
};

