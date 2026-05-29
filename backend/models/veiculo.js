const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Utilizador = require('./utilizador');

const Veiculo = sequelize.define('Veiculo', {
    id_veiculo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    matricula: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    marca: { type: DataTypes.STRING(50) },
    modelo: { type: DataTypes.STRING(50) },
    id_utilizador: { type: DataTypes.INTEGER, references: { model: Utilizador, key: 'id_utilizador' } }
}, { tableName: 'veiculo', timestamps: false });

Utilizador.hasMany(Veiculo, { foreignKey: 'id_utilizador' });
Veiculo.belongsTo(Utilizador, { foreignKey: 'id_utilizador' });

module.exports = Veiculo;
