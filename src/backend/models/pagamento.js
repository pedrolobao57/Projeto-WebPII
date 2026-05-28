const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Estacionamento = require('./estacionamento');
const Utilizador = require('./utilizador');
const Tarifa = require('./tarifa');
const Reserva = require('./reserva');

const Pagamento = sequelize.define('Pagamento', {
    id_pagamento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    valor: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    metodo_pagamento: { type: DataTypes.ENUM('MBWAY', 'CARTAO_CREDITO', 'CARTAO_DEBITO'), allowNull: false },
    data_pagamento: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    estado_pagamento: { type: DataTypes.ENUM('PENDENTE', 'REALIZADO', 'FALHADO', 'REEMBOLSADO'), defaultValue: 'PENDENTE' },
    id_reserva: { type: DataTypes.INTEGER, allowNull: true, references: { model: Reserva, key: 'id_reserva' } },
    id_estacionamento: { type: DataTypes.INTEGER, allowNull: true, references: { model: Estacionamento, key: 'id_estacionamento' } },
    id_utilizador: { type: DataTypes.INTEGER, allowNull: true, references: { model: Utilizador, key: 'id_utilizador' } },
    id_tarifa: { type: DataTypes.INTEGER, allowNull: true, references: { model: Tarifa, key: 'id_tarifa' } }
}, { tableName: 'pagamento', timestamps: false });

Reserva.hasMany(Pagamento, { foreignKey: 'id_reserva' });
Pagamento.belongsTo(Reserva, { foreignKey: 'id_reserva' });

Estacionamento.hasMany(Pagamento, { foreignKey: 'id_estacionamento' });
Pagamento.belongsTo(Estacionamento, { foreignKey: 'id_estacionamento' });

Utilizador.hasMany(Pagamento, { foreignKey: 'id_utilizador' });
Pagamento.belongsTo(Utilizador, { foreignKey: 'id_utilizador' });

Tarifa.hasMany(Pagamento, { foreignKey: 'id_tarifa' });
Pagamento.belongsTo(Tarifa, { foreignKey: 'id_tarifa' });

module.exports = Pagamento;
