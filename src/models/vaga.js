const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Zona = require('./zona');

const Vaga = sequelize.define('Vaga', {
    id_vaga: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    numero_vaga: { type: DataTypes.STRING(10), allowNull: false },
    tipo_vaga: { type: DataTypes.ENUM('Normal', 'Mobilidade_Reduzida', 'Eletrico', 'Preferenciais'), allowNull: false },
    estado: { type: DataTypes.ENUM('Livre', 'Ocupada', 'Reservada', 'Manutencao'), defaultValue: 'Livre' },
    id_zona: { type: DataTypes.INTEGER, references: { model: Zona, key: 'id_zona' } }
}, { tableName: 'vaga', timestamps: false });

Zona.hasMany(Vaga, { foreignKey: 'id_zona' });
Vaga.belongsTo(Zona, { foreignKey: 'id_zona' });

module.exports = Vaga;
