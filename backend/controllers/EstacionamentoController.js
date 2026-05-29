const Estacionamento = require('../models/estacionamento');
const Vaga = require('../models/vaga');
const Tarifa = require('../models/tarifa');
const Pagamento = require('../models/pagamento');

exports.registarEntrada = async (req, res) => {
    try {
        const { id_veiculo, id_vaga, id_reserva } = req.body;

        const entrada = await Estacionamento.create({
            data_hora_entrada: new Date(),
            id_veiculo,
            id_vaga,
            id_reserva: id_reserva || null,
            estado_estacionamento: 'ATIVO'
        });

        // Atualiza a vaga para ocupada
        await Vaga.update({ estado: 'OCUPADO' }, { where: { id_vaga } });

        res.status(201).json({ message: 'Entrada registada!', entrada });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registar entrada.', detalhes: err.message });
    }
};

exports.registarSaida = async (req, res) => {
    try {
        const { id_estacionamento, id_tarifa, metodo_pagamento, id_utilizador, promoCode } = req.body;
        
        const estadia = await Estacionamento.findByPk(id_estacionamento);
        if (!estadia) return res.status(404).json({ error: 'Registo de estacionamento não encontrado.' });

        const dataSaida = new Date();
        const dataEntrada = new Date(estadia.data_hora_entrada);
        
        // Calcular tempo em minutos
        const minutosEstacionado = Math.ceil((dataSaida - dataEntrada) / (1000 * 60));

        // Buscar valor da Tarifa (se existir)
        let valorTotal = 0;
        if (promoCode === 'Codigo VSKI') {
            valorTotal = 0.67;
        } else if (id_tarifa) {
            const tarifaAplicada = await Tarifa.findByPk(id_tarifa);
            if (tarifaAplicada) {
                // Validar tolerância
                if (minutosEstacionado > tarifaAplicada.tempo_tolerancia) {
                    valorTotal = minutosEstacionado * parseFloat(tarifaAplicada.valor_por_minuto);
                }
            }
        } else {
            // Default rate calculation ($8/hour = ~0.133 per minute)
            valorTotal = minutosEstacionado * 0.133;
        }

        // Atualizar registo de saída
        await estadia.update({ data_hora_saida: dataSaida, estado_estacionamento: 'FINALIZADO' });

        // Libertar a Vaga
        await Vaga.update({ estado: 'LIVRE' }, { where: { id_vaga: estadia.id_vaga } });

        // Se houver reserva associada, fechá-la como concluída
        if (estadia.id_reserva) {
            const Reserva = require('../models/reserva');
            await Reserva.update({ estado_reserva: 'CONCLUIDA' }, { where: { id_reserva: estadia.id_reserva } });
        }

        // Gerar o Pagamento
        const pagamento = await Pagamento.create({
            valor: valorTotal.toFixed(2),
            metodo_pagamento: metodo_pagamento === 'MBWAY' ? 'MBWAY' : (metodo_pagamento === 'CARTAO_CREDITO' ? 'CARTAO_CREDITO' : 'CARTAO_DEBITO'),
            data_pagamento: dataSaida,
            estado_pagamento: 'REALIZADO',
            id_estacionamento,
            id_utilizador,
            id_tarifa: id_tarifa || null
        });

        res.json({ message: 'Saída processada e paga com sucesso!', minutosEstacionado, valorTotal: valorTotal.toFixed(2), pagamento });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar saída.', detalhes: err.message });
    }
};
