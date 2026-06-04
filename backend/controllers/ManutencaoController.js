const ManutencaoSensor = require('../models/manutencao_sensor');
const Sensor = require('../models/sensor');

exports.reportarAvaria = async (req, res) => {
    try {
        const { id_sensor, id_utilizador, descricao_problema } = req.body;

        const alertaManutencao = await ManutencaoSensor.create({
            id_sensor,
            id_utilizador,
            data_avaria: new Date(),
            descricao_problema,
            estado_manutencao: 'Reportado'
        });

        // Atualizar o hardware para o estado de Avaria
        await Sensor.update({ estado_sensor: 'Avaria' }, { where: { id_sensor } });

        res.status(201).json({ message: 'Avaria registada e enviada à equipa técnica.', alertaManutencao });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao registar avaria.' });
    }
};

exports.concluirReparacao = async (req, res) => {
    try {
        const { id_manutencao, custo_reparacao, novo_estado_sensor } = req.body; // novo_estado_sensor ex: 'Ativo'

        const manutencao = await ManutencaoSensor.findByPk(id_manutencao);
        if (!manutencao) return res.status(404).json({ error: 'Registo de manutenção não encontrado.' });

        await manutencao.update({
            data_reparacao: new Date(),
            custo_reparacao,
            estado_manutencao: 'Resolvido'
        });

        // Coloca o sensor online novamente
        await Sensor.update({ estado_sensor: novo_estado_sensor }, { where: { id_sensor: manutencao.id_sensor } });

        res.json({ message: 'Manutenção fechada e sensor restabelecido com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao fechar relatório de manutenção.' });
    }
};
