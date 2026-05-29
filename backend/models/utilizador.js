const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Utilizador = sequelize.define('Utilizador', {
    id_utilizador: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    telefone: { type: DataTypes.STRING(40), allowNull: true },
    palavra_passe: { type: DataTypes.STRING(255), allowNull: false },
    tipo_utilizador: { type: DataTypes.ENUM('CLIENTE', 'GESTOR', 'ADMIN'), allowNull: false, defaultValue: 'CLIENTE' },
    data_registo: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'utilizador', timestamps: false });

module.exports = Utilizador;
