const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gestor = sequelize.define('Gestor', {
    id_gestor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    palavra_passe: { type: DataTypes.STRING(255), allowNull: false },
    nivel_permissao: { type: DataTypes.ENUM('Admin_Geral', 'Operador', 'Suporte_Tecnico'), allowNull: false },
    data_registo: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
}, { tableName: 'gestor', timestamps: false });

module.exports = Gestor;
