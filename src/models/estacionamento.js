const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Veiculo = require('./veiculo');
const Vaga = require('./vaga');
const ParqueEstacionamento = require('./parque_estacionamento');
const Reserva = require('./reserva'); // Adicionado na alteração

const Estacionamento = sequelize.define('Estacionamento', {
    id_estacionamento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    data_hora_entrada: { type: DataTypes.DATE, allowNull: false },
    data_hora_saida: { type: DataTypes.DATE },
    id_veiculo: { type: DataTypes.INTEGER, references: { model: Veiculo, key: 'id_veiculo' } },
    id_vaga: { type: DataTypes.INTEGER, references: { model: Vaga, key: 'id_vaga' } },
    id_parque: { type: DataTypes.INTEGER, references: { model: ParqueEstacionamento, key: 'id_parque' } },
    id_reserva: { type: DataTypes.INTEGER, allowNull: true, references: { model: Reserva, key: 'id_reserva' } } // Nova FK
}, { tableName: 'estacionamento', timestamps: false });

module.exports = Estacionamento;
