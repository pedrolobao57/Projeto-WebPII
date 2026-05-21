const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParqueEstacionamento = sequelize.define('ParqueEstacionamento', {
    id_parque: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    localizacao: { type: DataTypes.STRING(200) },
    capacidade_total: { type: DataTypes.INTEGER, allowNull: false },
    estado: { type: DataTypes.ENUM('Aberto', 'Cheio', 'Fechado'), defaultValue: 'Aberto' }
}, { tableName: 'parque_estacionamento', timestamps: false });

module.exports = ParqueEstacionamento;
