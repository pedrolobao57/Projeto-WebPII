const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sensor = require('./sensor');
const Utilizador = require('./utilizador');

const ManutencaoSensor = sequelize.define('ManutencaoSensor', {
    id_manutencao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_sensor: { type: DataTypes.INTEGER, references: { model: Sensor, key: 'id_sensor' } },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: true, references: { model: Utilizador, key: 'id_utilizador' } },
    data_avaria: { type: DataTypes.DATE, allowNull: false },
    descricao_problema: { type: DataTypes.TEXT, allowNull: false },
    data_reparacao: { type: DataTypes.DATE, allowNull: true },
    custo_reparacao: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0.00 },
    estado_manutencao: { type: DataTypes.ENUM('Reportado', 'Em Reparacao', 'Resolvido', 'Substituido'), defaultValue: 'Reportado' }
}, { tableName: 'manutencao_sensor', timestamps: false });

Sensor.hasMany(ManutencaoSensor, { foreignKey: 'id_sensor' });
ManutencaoSensor.belongsTo(Sensor, { foreignKey: 'id_sensor' });
Utilizador.hasMany(ManutencaoSensor, { foreignKey: 'id_utilizador' });
ManutencaoSensor.belongsTo(Utilizador, { foreignKey: 'id_utilizador' });

module.exports = ManutencaoSensor;
