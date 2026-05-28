const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Vaga = require('./vaga');

const Sensor = sequelize.define('Sensor', {
    id_sensor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo_sensor: { type: DataTypes.STRING(50), allowNull: false },
    estado_sensor: { type: DataTypes.ENUM('LIVRE', 'OCUPADO', 'INATIVO', 'ERRO'), defaultValue: 'LIVRE' },
    id_vaga: { type: DataTypes.INTEGER, references: { model: Vaga, key: 'id_vaga' } }
}, { tableName: 'sensor', timestamps: false });

Vaga.hasOne(Sensor, { foreignKey: 'id_vaga' });
Sensor.belongsTo(Vaga, { foreignKey: 'id_vaga' });

module.exports = Sensor;
