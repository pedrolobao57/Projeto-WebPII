const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Utilizador = require('./utilizador');
const Vaga = require('./vaga');
const Veiculo = require('./veiculo');

const Reserva = sequelize.define('Reserva', {
    id_reserva: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: false, references: { model: Utilizador, key: 'id_utilizador' } },
    id_veiculo: { type: DataTypes.INTEGER, allowNull: false, references: { model: Veiculo, key: 'id_veiculo' } },
    id_vaga: { type: DataTypes.INTEGER, allowNull: false, references: { model: Vaga, key: 'id_vaga' } },
    data_criacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    data_inicio: { type: DataTypes.DATE, allowNull: false },
    data_fim: { type: DataTypes.DATE, allowNull: false },
    estado_reserva: { type: DataTypes.ENUM('PENDENTE', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA', 'CONCLUIDA'), defaultValue: 'PENDENTE' }
}, { tableName: 'reserva', timestamps: false });

Utilizador.hasMany(Reserva, { foreignKey: 'id_utilizador' });
Reserva.belongsTo(Utilizador, { foreignKey: 'id_utilizador' });

Veiculo.hasMany(Reserva, { foreignKey: 'id_veiculo' });
Reserva.belongsTo(Veiculo, { foreignKey: 'id_veiculo' });

Vaga.hasMany(Reserva, { foreignKey: 'id_vaga' });
Reserva.belongsTo(Vaga, { foreignKey: 'id_vaga' });

module.exports = Reserva;
