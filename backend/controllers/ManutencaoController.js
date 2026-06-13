/**
 * @file ManutencaoController.js
 * @description Controlador encarregue de gerir os relatórios de avarias e reparações
 * de sensores IoT associados aos lugares de estacionamento.
 */

const ManutencaoSensor = require('../models/manutencao_sensor');
const Sensor = require('../models/sensor');

/**
 * @function reportarAvaria
 * @async
 * @description Cria um novo relatório de avaria para um sensor específico e atualiza
 * o estado físico do sensor para 'Avaria'.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `id_sensor`, `id_utilizador` e `descricao_problema`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna o alerta de manutenção criado ou erro 500.
 */
exports.reportarAvaria = async (req, res) => {
    try {
        const { id_sensor, id_utilizador, descricao_problema } = req.body;

        // Cria a linha de registo na tabela de manutenções de sensores, indicando a data atual e marcando como "Reportado".
        const alertaManutencao = await ManutencaoSensor.create({
            id_sensor,
            id_utilizador,
            data_avaria: new Date(),
            descricao_problema,
            estado_manutencao: 'Reportado'
        });

        // Atualiza o estado operacional do sensor na tabela de hardware para 'Avaria' para que seja marcado no mapa/sistema.
        await Sensor.update({ estado_sensor: 'Avaria' }, { where: { id_sensor } });

        res.status(201).json({ message: 'Avaria registada e enviada à equipa técnica.', alertaManutencao });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao registar avaria.' });
    }
};

/**
 * @function concluirReparacao
 * @async
 * @description Conclui um processo de reparação de um sensor ativo.
 * Regista o custo da reparação, altera o estado da manutenção para 'Resolvido' e atualiza o estado operacional
 * do sensor para o valor indicado (ex: 'Ativo').
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `id_manutencao`, `custo_reparacao` e `novo_estado_sensor`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna mensagem de sucesso ou erro 404/500.
 */
exports.concluirReparacao = async (req, res) => {
    try {
        const { id_manutencao, custo_reparacao, novo_estado_sensor } = req.body; // novo_estado_sensor ex: 'Ativo'

        // Tenta encontrar o registo de manutenção ativo correspondente.
        const manutencao = await ManutencaoSensor.findByPk(id_manutencao);
        if (!manutencao) return res.status(404).json({ error: 'Registo de manutenção não encontrado.' });

        // Grava a conclusão do processo, preenchendo a data de reparação, o custo envolvido e marcando-o como "Resolvido".
        await manutencao.update({
            data_reparacao: new Date(),
            custo_reparacao,
            estado_manutencao: 'Resolvido'
        });

        // Coloca o sensor online novamente, atualizando o seu estado operacional para o estado pretendido (Ativo/Inativo/etc.).
        await Sensor.update({ estado_sensor: novo_estado_sensor }, { where: { id_sensor: manutencao.id_sensor } });

        res.json({ message: 'Manutenção fechada e sensor restabelecido com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao fechar relatório de manutenção.' });
    }
};
