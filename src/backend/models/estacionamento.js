const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Veiculo = require('./veiculo');
const Vaga = require('./vaga');
const Reserva = require('./reserva');

const Estacionamento = sequelize.define('Estacionamento', {
    id_estacionamento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    data_hora_entrada: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    data_hora_saida: { type: DataTypes.DATE, allowNull: true },
    id_veiculo: { type: DataTypes.INTEGER, allowNull: false, references: { model: Veiculo, key: 'id_veiculo' } },
    id_vaga: { type: DataTypes.INTEGER, allowNull: false, references: { model: Vaga, key: 'id_vaga' } },
    id_reserva: { type: DataTypes.INTEGER, allowNull: true, references: { model: Reserva, key: 'id_reserva' } },
    estado_estacionamento: { type: DataTypes.ENUM('ATIVO', 'FINALIZADO'), defaultValue: 'ATIVO', allowNull: false }
}, { tableName: 'estacionamento', timestamps: false });

Veiculo.hasMany(Estacionamento, { foreignKey: 'id_veiculo' });
Estacionamento.belongsTo(Veiculo, { foreignKey: 'id_veiculo' });

Vaga.hasMany(Estacionamento, { foreignKey: 'id_vaga' });
Estacionamento.belongsTo(Vaga, { foreignKey: 'id_vaga' });

Reserva.hasMany(Estacionamento, { foreignKey: 'id_reserva' });
Estacionamento.belongsTo(Reserva, { foreignKey: 'id_reserva' });

module.exports = Estacionamento;
