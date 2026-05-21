const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Utilizador = require('./utilizador');
const Vaga = require('./vaga');

const Reserva = sequelize.define('Reserva', {
    id_reserva: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_utilizador: { type: DataTypes.INTEGER, references: { model: Utilizador, key: 'id_utilizador' } },
    id_vaga: { type: DataTypes.INTEGER, references: { model: Vaga, key: 'id_vaga' } },
    data_hora_criacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    data_hora_inicio_prevista: { type: DataTypes.DATE, allowNull: false },
    data_hora_fim_prevista: { type: DataTypes.DATE, allowNull: false },
    estado_reserva: { type: DataTypes.ENUM('Pendente', 'Ativa', 'Cancelada', 'Concluida', 'Expirada'), defaultValue: 'Pendente' }
}, { tableName: 'reserva', timestamps: false });

Utilizador.hasMany(Reserva, { foreignKey: 'id_utilizador' });
Reserva.belongsTo(Utilizador, { foreignKey: 'id_utilizador' });
Vaga.hasMany(Reserva, { foreignKey: 'id_vaga' });
Reserva.belongsTo(Vaga, { foreignKey: 'id_vaga' });

module.exports = Reserva;
