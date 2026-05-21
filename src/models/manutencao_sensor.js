const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sensor = require('./sensor');
const Gestor = require('./gestor');

const ManutencaoSensor = sequelize.define('ManutencaoSensor', {
    id_manutencao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_sensor: { type: DataTypes.INTEGER, references: { model: Sensor, key: 'id_sensor' } },
    id_gestor: { type: DataTypes.INTEGER, allowNull: true, references: { model: Gestor, key: 'id_gestor' } },
    data_avaria: { type: DataTypes.DATE, allowNull: false },
    descricao_problema: { type: DataTypes.TEXT, allowNull: false },
    data_reparacao: { type: DataTypes.DATE, allowNull: true },
    custo_reparacao: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0.00 },
    estado_manutencao: { type: DataTypes.ENUM('Reportado', 'Em Reparacao', 'Resolvido', 'Substituido'), defaultValue: 'Reportado' }
}, { tableName: 'manutencao_sensor', timestamps: false });

Sensor.hasMany(ManutencaoSensor, { foreignKey: 'id_sensor' });
ManutencaoSensor.belongsTo(Sensor, { foreignKey: 'id_sensor' });

module.exports = ManutencaoSensor;
