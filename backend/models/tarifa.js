const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ParqueEstacionamento = require('./parque_estacionamento');

const Tarifa = sequelize.define('Tarifa', {
    id_tarifa: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_parque: { type: DataTypes.INTEGER, references: { model: ParqueEstacionamento, key: 'id_parque' } },
    nome_tarifa: { type: DataTypes.STRING(50), allowNull: false },
    valor_por_minuto: { type: DataTypes.DECIMAL(5, 4), allowNull: false },
    tempo_tolerancia: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'tarifa', timestamps: false });

ParqueEstacionamento.hasMany(Tarifa, { foreignKey: 'id_parque' });
Tarifa.belongsTo(ParqueEstacionamento, { foreignKey: 'id_parque' });

module.exports = Tarifa;
