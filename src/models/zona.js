const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ParqueEstacionamento = require('./parque_estacionamento');

const Zona = sequelize.define('Zona', {
    id_zona: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome_zona: { type: DataTypes.STRING(50), allowNull: false },
    piso: { type: DataTypes.INTEGER, allowNull: false },
    id_parque: { type: DataTypes.INTEGER, references: { model: ParqueEstacionamento, key: 'id_parque' } }
}, { tableName: 'zona', timestamps: false });

ParqueEstacionamento.hasMany(Zona, { foreignKey: 'id_parque' });
Zona.belongsTo(ParqueEstacionamento, { foreignKey: 'id_parque' });

module.exports = Zona;
