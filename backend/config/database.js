/**
 * @file database.js
 * @description Configuração da ligação à base de dados MySQL utilizando o ORM Sequelize.
 * Lê os dados de configuração (credenciais, host, etc.) a partir das variáveis de ambiente (.env).
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * Instância principal do Sequelize configurada com o dialecto MySQL.
 * Representa a pool de ligações à base de dados do projeto.
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    // Endereço do servidor MySQL.
    host: process.env.DB_HOST,
    // Porta padrão do MySQL (3306), caso não seja especificada no ficheiro .env.
    port: process.env.DB_PORT || 3306,
    // Define que estamos a ligar a uma base de dados MySQL.
    dialect: 'mysql',
    // Desativa os logs de queries SQL brutas na consola para manter o terminal limpo durante o desenvolvimento.
    logging: false 
  }
);

module.exports = sequelize;

