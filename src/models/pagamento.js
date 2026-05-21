const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Estacionamento = require('./estacionamento');
const Utilizador = require('./utilizador');
const Tarifa = require('./tarifa'); // Adicionado na alteração

const Pagamento = sequelize.define('Pagamento', {
    id_pagamento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    valor: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    metodo_pagamento: { type: DataTypes.STRING(30), allowNull: false },
    data_pagamento: { type: DataTypes.DATE, allowNull: false },
    estado_pagamento: { type: DataTypes.ENUM('Pendente', 'Pago', 'Falhado'), defaultValue: 'Pendente' },
    id_estacionamento: { type: DataTypes.INTEGER, references: { model: Estacionamento, key: 'id_estacionamento' } },
    id_utilizador: { type: DataTypes.INTEGER, references: { model: Utilizador, key: 'id_utilizador' } },
    id_tarifa: { type: DataTypes.INTEGER, allowNull: true, references: { model: Tarifa, key: 'id_tarifa' } } // Nova FK
}, { tableName: 'pagamento', timestamps: false });

module.exports = Pagamento;
