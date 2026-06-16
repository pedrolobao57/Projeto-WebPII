/**
 * @file ManutencaoController.js
 * @description Controlador encarregue de gerir os relatórios de avarias e reparações
 * de sensores IoT associados aos lugares de estacionamento.
 */

const ManutencaoSensor = require('../models/manutencao_sensor');
const Sensor = require('../models/sensor');
const Vaga = require('../models/vaga');
const Utilizador = require('../models/utilizador');
const Zona = require('../models/zona');
const ParqueEstacionamento = require('../models/parque_estacionamento');

/**
 * @function reportarAvaria
 * @async
 * @description Cria um novo relatório de avaria para um sensor específico e atualiza
 * o estado físico do sensor para 'ERRO'.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `id_vaga` ou `id_sensor` e `descricao_problema`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna o alerta de manutenção criado ou erro 500.
 */
exports.reportarAvaria = async (req, res) => {
    try {
        let { id_sensor, id_vaga, descricao_problema } = req.body;
        const id_utilizador = req.user ? req.user.id_utilizador : null;

        // Se passar apenas id_vaga, procuramos o sensor correspondente
        if (!id_sensor && id_vaga) {
            const sensor = await Sensor.findOne({ where: { id_vaga } });
            if (!sensor) {
                return res.status(404).json({ error: 'Sensor não encontrado para a vaga especificada.' });
            }
            id_sensor = sensor.id_sensor;
        }

        if (!id_sensor) {
            return res.status(400).json({ error: 'É necessário especificar o sensor ou a vaga.' });
        }

        // Cria a linha de registo na tabela de manutenções de sensores, indicando a data atual e marcando como "Reportado".
        const alertaManutencao = await ManutencaoSensor.create({
            id_sensor,
            id_utilizador,
            data_avaria: new Date(),
            descricao_problema,
            estado_manutencao: 'Reportado'
        });

        // Atualiza o estado operacional do sensor na tabela de hardware para 'ERRO' (valor correto na base de dados)
        await Sensor.update({ estado_sensor: 'ERRO' }, { where: { id_sensor } });

        res.status(201).json({ message: 'Avaria registada e enviada à equipa técnica.', alertaManutencao });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registar avaria.' });
    }
};

/**
 * @function concluirReparacao
 * @async
 * @description Conclui um processo de reparação de um sensor ativo.
 * Regista o custo da reparação, altera o estado da manutenção para 'Resolvido' e atualiza o estado operacional
 * do sensor para o valor indicado (ex: 'LIVRE').
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body com `id_manutencao`, `custo_reparacao` e `novo_estado_sensor`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Retorna mensagem de sucesso ou erro 404/500.
 */
exports.concluirReparacao = async (req, res) => {
    try {
        const { id_manutencao, custo_reparacao, novo_estado_sensor } = req.body; 

        // Tenta encontrar o registo de manutenção ativo correspondente.
        const manutencao = await ManutencaoSensor.findByPk(id_manutencao);
        if (!manutencao) return res.status(404).json({ error: 'Registo de manutenção não encontrado.' });

        // Grava a conclusão do processo, preenchendo a data de reparação, o custo envolvido e marcando-o como "Resolvido".
        await manutencao.update({
            data_reparacao: new Date(),
            custo_reparacao: custo_reparacao || 0.00,
            estado_manutencao: 'Resolvido'
        });

        // Coloca o sensor online novamente, atualizando o seu estado operacional para o estado pretendido (LIVRE por defeito).
        await Sensor.update({ estado_sensor: novo_estado_sensor || 'LIVRE' }, { where: { id_sensor: manutencao.id_sensor } });

        res.json({ message: 'Manutenção fechada e sensor restabelecido com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao fechar relatório de manutenção.' });
    }
};

/**
 * @function listarAvariasPendentes
 * @async
 * @description Lista todas as manutenções com estado 'Reportado' ou 'Em Reparacao',
 * incluindo dados associados de utilizador, sensor, vaga, zona e parque de estacionamento.
 * 
 * @param {Object} req - Objeto de pedido Express (Request).
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Array} Retorna a lista de avarias pendentes em formato JSON.
 */
exports.listarAvariasPendentes = async (req, res) => {
    try {
        const avarias = await ManutencaoSensor.findAll({
            where: {
                estado_manutencao: ['Reportado', 'Em Reparacao']
            },
            include: [
                {
                    model: Utilizador,
                    attributes: ['id_utilizador', 'nome', 'email']
                },
                {
                    model: Sensor,
                    include: [
                        {
                            model: Vaga,
                            include: [
                                {
                                    model: Zona,
                                    include: [
                                        {
                                            model: ParqueEstacionamento,
                                            attributes: ['id_parque', 'nome']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['data_avaria', 'DESC']]
        });
        res.json(avarias);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar avarias pendentes.' });
    }
};

