import 'dotenv/config';
import mysql from 'mysql2/promise';
import { faker } from '@faker-js/faker';

/**
 * Seeder para a base de dados gestor_estacionamento.
 *
 * Este script:
 * - limpa as tabelas, se RESET_DATABASE=true;
 * - gera utilizadores, veículos, parques, zonas, vagas e sensores;
 * - gera reservas, estacionamentos, pagamentos e leituras de sensores;
 * - respeita a ordem das chaves estrangeiras.
 */

/**
 * Lê uma variável de ambiente.
 *
 * @param {string} name - Nome da variável.
 * @param {string} fallback - Valor por defeito.
 * @returns {string}
 */
function getStringEnv(name, fallback = '') {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  return value;
}

/**
 * Lê uma variável de ambiente obrigatória.
 *
 * @param {string} name - Nome da variável.
 * @returns {string}
 */
function getRequiredEnv(name) {
  const value = process.env[name];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Lê uma variável numérica de ambiente.
 *
 * @param {string} name - Nome da variável.
 * @param {number} fallback - Valor por defeito.
 * @returns {number}
 */
function getNumberEnv(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer.`);
  }

  return parsed;
}

/**
 * Escolhe aleatoriamente um elemento de uma lista.
 *
 * @template T
 * @param {T[]} items
 * @returns {T}
 */
function pick(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('pick() received an empty array.');
  }

  return items[faker.number.int({ min: 0, max: items.length - 1 })];
}

/**
 * Gera uma matrícula simples no formato português aproximado.
 *
 * @param {Set<string>} usedPlates - Conjunto de matrículas já usadas.
 * @returns {string}
 */
function generateUniquePlate(usedPlates) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const randomLetter = () => letters[faker.number.int({ min: 0, max: letters.length - 1 })];
  const randomDigit = () => faker.number.int({ min: 0, max: 9 }).toString();

  let plate = '';

  do {
    const format = faker.number.int({ min: 1, max: 3 });

    if (format === 1) {
      plate = `${randomDigit()}${randomDigit()}-${randomLetter()}${randomLetter()}-${randomDigit()}${randomDigit()}`;
    } else if (format === 2) {
      plate = `${randomLetter()}${randomLetter()}-${randomDigit()}${randomDigit()}-${randomLetter()}${randomLetter()}`;
    } else {
      plate = `${randomDigit()}${randomDigit()}-${randomDigit()}${randomDigit()}-${randomLetter()}${randomLetter()}`;
    }
  } while (usedPlates.has(plate));

  usedPlates.add(plate);
  return plate;
}

/**
 * Adiciona horas a uma data.
 *
 * @param {Date} date - Data original.
 * @param {number} hours - Número de horas a somar.
 * @returns {Date}
 */
function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Insere vários registos numa tabela.
 *
 * Atenção: table e columns devem ser constantes controladas pelo código.
 * Nunca devem vir directamente de input do utilizador.
 *
 * @param {mysql.Connection} connection - Ligação MySQL.
 * @param {string} table - Nome da tabela.
 * @param {string[]} columns - Colunas a preencher.
 * @param {Array<Array<string | number | Date | null>>} rows - Dados a inserir.
 * @returns {Promise<number[]>}
 */
async function insertMany(connection, table, columns, rows) {
  if (rows.length === 0) {
    return [];
  }

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ?
  `;

  const [result] = await connection.query(sql, [rows]);
  const insertResult = /** @type {mysql.ResultSetHeader} */ (result);

  return Array.from(
    { length: insertResult.affectedRows },
    (_, index) => insertResult.insertId + index,
  );
}

/**
 * Limpa as tabelas respeitando relações de chave estrangeira.
 *
 * @param {mysql.Connection} connection - Ligação MySQL.
 * @returns {Promise<void>}
 */
async function resetDatabase(connection) {
  const tables = [
    'leitura_sensor',
    'pagamento',
    'estacionamento',
    'reserva',
    'sensor',
    'vaga',
    'zona',
    'veiculo',
    'utilizador',
    'parque_estacionamento',
  ];

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of tables) {
    await connection.query(`TRUNCATE TABLE ${table}`);
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * Constrói uma lista auxiliar que liga veículos aos seus utilizadores.
 *
 * @param {number[]} vehicleIds - IDs dos veículos inseridos.
 * @param {Array<Array<string | number | Date | null>>} vehicleRows - Linhas usadas no INSERT.
 * @returns {{ id: number, idUtilizador: number }[]}
 */
function buildVehicleIndex(vehicleIds, vehicleRows) {
  return vehicleRows.map((row, index) => ({
    id: vehicleIds[index],
    idUtilizador: Number(row[0]),
  }));
}

/**
 * Função principal do seeder.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const dbConfig = {
    host: getStringEnv('DB_HOST', 'localhost'),
    port: getNumberEnv('DB_PORT', 3306),
    user: getRequiredEnv('DB_USER'),
    password: getStringEnv('DB_PASSWORD', ''),
    database: getRequiredEnv('DB_NAME'),
  };

  const config = {
    numClientes: getNumberEnv('NUM_CLIENTES', 40),
    numGestores: getNumberEnv('NUM_GESTORES', 4),
    numParques: getNumberEnv('NUM_PARQUES', 3),
    zonasPorParque: getNumberEnv('ZONAS_POR_PARQUE', 3),
    vagasPorZona: getNumberEnv('VAGAS_POR_ZONA', 20),
    numReservas: getNumberEnv('NUM_RESERVAS', 80),
    numEstacionamentos: getNumberEnv('NUM_ESTACIONAMENTOS', 60),
    leiturasPorSensor: getNumberEnv('LEITURAS_POR_SENSOR', 4),
    resetDatabase: process.env.RESET_DATABASE === 'true',
  };

  const connection = await mysql.createConnection(dbConfig);

  try {
    if (config.resetDatabase) {
      console.log('Cleaning database...');
      await resetDatabase(connection);
    }

    await connection.beginTransaction();

    console.log('Generating users...');

    const userRows = [];

    for (let i = 0; i < config.numClientes; i += 1) {
      const nome = faker.person.fullName();

      userRows.push([
        nome,
        `cliente.${i + 1}@example.com`,
        faker.phone.number(),
        '$2b$10$demo.hash.password.not.for.production',
        'CLIENTE',
        faker.number.int({ min: 100, max: 2000 })
      ]);
    }

    for (let i = 0; i < config.numGestores; i += 1) {
      const nome = faker.person.fullName();

      userRows.push([
        nome,
        `gestor.${i + 1}@example.com`,
        faker.phone.number(),
        '$2b$10$demo.hash.password.not.for.production',
        'GESTOR',
        0
      ]);
    }

    const userIds = await insertMany(
      connection,
      'utilizador',
      ['nome', 'email', 'telefone', 'palavra_passe', 'tipo_utilizador', 'pontos_fidelidade'],
      userRows,
    );

    const clienteIds = userIds.slice(0, config.numClientes);
    const usedPlates = new Set();

    console.log('Generating vehicles...');

    const marcas = [
      'Toyota',
      'Renault',
      'Peugeot',
      'Citroën',
      'BMW',
      'Mercedes',
      'Tesla',
      'Nissan',
      'Volkswagen',
    ];

    const modelos = [
      'Yaris',
      'Clio',
      '208',
      'C3',
      'Série 1',
      'Classe A',
      'Model 3',
      'Leaf',
      'Golf',
    ];

    const vehicleRows = [];

    for (const idUtilizador of clienteIds) {
      const vehiclesForUser = faker.number.int({ min: 1, max: 2 });

      for (let i = 0; i < vehiclesForUser; i += 1) {
        vehicleRows.push([
          idUtilizador,
          generateUniquePlate(usedPlates),
          pick(marcas),
          pick(modelos),
        ]);
      }
    }

    const vehicleIds = await insertMany(
      connection,
      'veiculo',
      ['id_utilizador', 'matricula', 'marca', 'modelo'],
      vehicleRows,
    );

    const vehicleIndex = buildVehicleIndex(vehicleIds, vehicleRows);

    console.log('Generating parks, zones and spots...');

    const parqueRows = [];
    const realParks = [
      { nome: 'Parque Pintos', localizacao: 'Rua de Júlio Dinis, Porto' },
      { nome: 'Parque estacionamento SABA - Casa da Música', localizacao: 'Avenida da Boavista, Porto' },
      { nome: 'Parking 5 Outubro', localizacao: 'Rua de 5 de Outubro, Porto' }
    ];

    for (let i = 0; i < config.numParques; i += 1) {
      const capacidadeTotal = config.zonasPorParque * config.vagasPorZona;
      const parkInfo = realParks[i] || {
        nome: `Parque Extra ${i + 1}`,
        localizacao: faker.location.streetAddress()
      };

      parqueRows.push([
        parkInfo.nome,
        parkInfo.localizacao,
        capacidadeTotal,
        'DISPONIVEL',
      ]);
    }

    const parqueIds = await insertMany(
      connection,
      'parque_estacionamento',
      ['nome', 'localizacao', 'capacidade_total', 'estado'],
      parqueRows,
    );

    const zonaRows = [];

    for (const idParque of parqueIds) {
      for (let piso = 0; piso < config.zonasPorParque; piso += 1) {
        zonaRows.push([
          idParque,
          `Zona ${String.fromCharCode(65 + piso)}`,
          piso,
        ]);
      }
    }

    const zonaIds = await insertMany(
      connection,
      'zona',
      ['id_parque', 'nome_zona', 'piso'],
      zonaRows,
    );

    const vagaRows = [];

    for (const idZona of zonaIds) {
      for (let i = 1; i <= config.vagasPorZona; i += 1) {
        const tipoVaga = faker.helpers.weightedArrayElement([
          { value: 'GERAL', weight: 75 },
          { value: 'ELETRICO', weight: 10 },
          { value: 'MOBILIDADE_REDUZIDA', weight: 10 },
          { value: 'MOTOCICLO', weight: 5 },
        ]);

        vagaRows.push([
          idZona,
          `V${String(i).padStart(3, '0')}`,
          tipoVaga,
          'LIVRE',
        ]);
      }
    }

    const vagaIds = await insertMany(
      connection,
      'vaga',
      ['id_zona', 'numero_vaga', 'tipo_vaga', 'estado'],
      vagaRows,
    );

    console.log('Generating sensors...');

    const sensorRows = vagaIds.map((idVaga) => [
      idVaga,
      'OCUPACAO',
      'LIVRE',
    ]);

    const sensorIds = await insertMany(
      connection,
      'sensor',
      ['id_vaga', 'tipo_sensor', 'estado_sensor'],
      sensorRows,
    );

    console.log('Generating sensor readings...');

    const leituraSensorRows = [];

    for (const idSensor of sensorIds) {
      for (let i = 0; i < config.leiturasPorSensor; i += 1) {
        leituraSensorRows.push([
          idSensor,
          pick(['LIVRE', 'OCUPADO']),
          faker.date.recent({ days: 7 }),
        ]);
      }
    }

    await insertMany(
      connection,
      'leitura_sensor',
      ['id_sensor', 'estado_detectado', 'data_leitura'],
      leituraSensorRows,
    );

    console.log('Generating reservations...');

    const reservaRows = [];
    const now = new Date();
    const reservedVagaIds = new Set();

    for (let i = 0; i < config.numReservas; i += 1) {
      const idUtilizador = pick(clienteIds);
      const userVehicles = vehicleIndex.filter(
        (vehicle) => vehicle.idUtilizador === idUtilizador,
      );

      const idVeiculo = pick(userVehicles).id;
      const idVaga = pick(vagaIds);

      const dataInicio = faker.date.between({
        from: addHours(now, -24 * 7),
        to: addHours(now, 24 * 4),
      });

      const dataFim = addHours(dataInicio, faker.number.int({ min: 1, max: 5 }));

      let estadoReserva = 'CONFIRMADA';

      if (dataFim < now) {
        estadoReserva = pick(['CONCLUIDA', 'CANCELADA']);
      } else if (dataInicio > now) {
        estadoReserva = pick(['PENDENTE', 'CONFIRMADA']);
      }

      if (estadoReserva === 'CONFIRMADA' && dataInicio > now) {
        reservedVagaIds.add(idVaga);
      }

      reservaRows.push([
        idUtilizador,
        idVeiculo,
        idVaga,
        dataInicio,
        dataFim,
        estadoReserva,
      ]);
    }

    const reservaIds = await insertMany(
      connection,
      'reserva',
      ['id_utilizador', 'id_veiculo', 'id_vaga', 'data_inicio', 'data_fim', 'estado_reserva'],
      reservaRows,
    );

    console.log('Generating parking sessions...');

    const estacionamentoRows = [];
    const occupiedVagaIds = new Set();

    for (let i = 0; i < config.numEstacionamentos; i += 1) {
      const idVeiculo = pick(vehicleIds);
      const idVaga = pick(vagaIds);
      const maybeReservaId = faker.datatype.boolean({ probability: 0.35 })
        ? pick(reservaIds)
        : null;

      const entrada = faker.date.between({
        from: addHours(now, -24 * 10),
        to: now,
      });

      const isActive = faker.datatype.boolean({ probability: 0.25 });

      const saida = isActive
        ? null
        : addHours(entrada, faker.number.int({ min: 1, max: 8 }));

      const estado = isActive ? 'ATIVO' : 'FINALIZADO';

      if (isActive) {
        occupiedVagaIds.add(idVaga);
      }

      estacionamentoRows.push([
        idVeiculo,
        idVaga,
        maybeReservaId,
        entrada,
        saida,
        estado,
      ]);
    }

    const estacionamentoIds = await insertMany(
      connection,
      'estacionamento',
      [
        'id_veiculo',
        'id_vaga',
        'id_reserva',
        'data_hora_entrada',
        'data_hora_saida',
        'estado_estacionamento',
      ],
      estacionamentoRows,
    );

    console.log('Generating payments...');

    const pagamentoRows = [];

    for (const idReserva of reservaIds) {
      if (faker.datatype.boolean({ probability: 0.75 })) {
        pagamentoRows.push([
          idReserva,
          null,
          faker.number.float({ min: 1.5, max: 25, fractionDigits: 2 }),
          pick(['MBWAY', 'CARTAO_CREDITO', 'CARTAO_DEBITO']),
          pick(['REALIZADO', 'PENDENTE', 'FALHADO']),
        ]);
      }
    }

    for (const idEstacionamento of estacionamentoIds) {
      if (faker.datatype.boolean({ probability: 0.85 })) {
        pagamentoRows.push([
          null,
          idEstacionamento,
          faker.number.float({ min: 2, max: 40, fractionDigits: 2 }),
          pick(['MBWAY', 'CARTAO_CREDITO', 'CARTAO_DEBITO']),
          pick(['REALIZADO', 'PENDENTE', 'FALHADO']),
        ]);
      }
    }

    await insertMany(
      connection,
      'pagamento',
      ['id_reserva', 'id_estacionamento', 'valor', 'metodo_pagamento', 'estado_pagamento'],
      pagamentoRows,
    );

    console.log('Updating spot and sensor states...');

    if (reservedVagaIds.size > 0) {
      await connection.query(
        "UPDATE vaga SET estado = 'RESERVADO' WHERE id_vaga IN (?)",
        [[...reservedVagaIds]],
      );
    }

    if (occupiedVagaIds.size > 0) {
      await connection.query(
        "UPDATE vaga SET estado = 'OCUPADO' WHERE id_vaga IN (?)",
        [[...occupiedVagaIds]],
      );

      await connection.query(
        `
        UPDATE sensor s
        JOIN vaga v ON s.id_vaga = v.id_vaga
        SET s.estado_sensor = 'OCUPADO'
        WHERE v.id_vaga IN (?)
        `,
        [[...occupiedVagaIds]],
      );
    }

    await connection.commit();

    console.log('Seed completed successfully.');
    console.log({
      users: userIds.length,
      vehicles: vehicleIds.length,
      parks: parqueIds.length,
      zones: zonaIds.length,
      spots: vagaIds.length,
      sensors: sensorIds.length,
      reservations: reservaIds.length,
      parkingSessions: estacionamentoIds.length,
      payments: pagamentoRows.length,
    });
  } catch (error) {
    await connection.rollback();

    console.error('Seed failed. Transaction rolled back.');
    console.error(error);

    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
