const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Zona = require('./zona');

const Vaga = sequelize.define('Vaga', {
    id_vaga: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    numero_vaga: { type: DataTypes.STRING(10), allowNull: false },
    tipo_vaga: { type: DataTypes.ENUM('GERAL', 'MOBILIDADE_REDUZIDA', 'ELETRICO', 'MOTOCICLO'), allowNull: false, defaultValue: 'GERAL' },
    estado: { type: DataTypes.ENUM('LIVRE', 'OCUPADO', 'RESERVADO', 'INDISPONIVEL'), defaultValue: 'LIVRE' },
    id_zona: { type: DataTypes.INTEGER, references: { model: Zona, key: 'id_zona' } }
}, { tableName: 'vaga', timestamps: false });

Zona.hasMany(Vaga, { foreignKey: 'id_zona' });
Vaga.belongsTo(Zona, { foreignKey: 'id_zona' });

module.exports = Vaga;
