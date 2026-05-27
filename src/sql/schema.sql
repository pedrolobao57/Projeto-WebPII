CREATE DATABASE IF NOT EXISTS estacionamento_inteligente1
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE estacionamento_inteligente1;

-- ==========================================================
-- LIMPEZA DAS TABELAS
-- ==========================================================

DROP TABLE IF EXISTS leitura_sensor;
DROP TABLE IF EXISTS pagamento;
DROP TABLE IF EXISTS estacionamento;
DROP TABLE IF EXISTS reserva;
DROP TABLE IF EXISTS sensor;
DROP TABLE IF EXISTS vaga;
DROP TABLE IF EXISTS zona;
DROP TABLE IF EXISTS veiculo;
DROP TABLE IF EXISTS utilizador;
DROP TABLE IF EXISTS parque_estacionamento;

-- ==========================================================
-- UTILIZADORES
-- ==========================================================

CREATE TABLE utilizador (
    id_utilizador INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(40),
    palavra_passe VARCHAR(255) NOT NULL,
    tipo_utilizador ENUM('CLIENTE', 'GESTOR', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',
    data_registo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_email_utilizador
        CHECK (email LIKE '%@%.%')
);

-- ==========================================================
-- VEÍCULOS
-- ==========================================================

CREATE TABLE veiculo (
    id_veiculo INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizador INT NOT NULL,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(50),
    modelo VARCHAR(50),

    CONSTRAINT fk_veiculo_utilizador
        FOREIGN KEY (id_utilizador)
        REFERENCES utilizador(id_utilizador)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================================
-- PARQUES DE ESTACIONAMENTO
-- ==========================================================

CREATE TABLE parque_estacionamento (
    id_parque INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    localizacao VARCHAR(255) NOT NULL,
    capacidade_total INT NOT NULL,
    estado ENUM('DISPONIVEL', 'CHEIO', 'ENCERRADO') NOT NULL DEFAULT 'DISPONIVEL',

    CONSTRAINT chk_capacidade_parque
        CHECK (capacidade_total > 0)
);

-- ==========================================================
-- ZONAS
-- ==========================================================

CREATE TABLE zona (
    id_zona INT AUTO_INCREMENT PRIMARY KEY,
    id_parque INT NOT NULL,
    nome_zona VARCHAR(100) NOT NULL,
    piso INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_zona_parque
        FOREIGN KEY (id_parque)
        REFERENCES parque_estacionamento(id_parque)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_zona_parque
        UNIQUE (id_parque, nome_zona, piso)
);

-- ==========================================================
-- VAGAS / LUGARES
-- ==========================================================

CREATE TABLE vaga (
    id_vaga INT AUTO_INCREMENT PRIMARY KEY,
    id_zona INT NOT NULL,
    numero_vaga VARCHAR(20) NOT NULL,
    tipo_vaga ENUM('GERAL', 'MOBILIDADE_REDUZIDA', 'ELETRICO', 'MOTOCICLO') 
        NOT NULL DEFAULT 'GERAL',
    estado ENUM('LIVRE', 'OCUPADO', 'RESERVADO', 'INDISPONIVEL') 
        NOT NULL DEFAULT 'LIVRE',

    CONSTRAINT fk_vaga_zona
        FOREIGN KEY (id_zona)
        REFERENCES zona(id_zona)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_vaga_zona
        UNIQUE (id_zona, numero_vaga)
);

-- ==========================================================
-- SENSORES
-- ==========================================================

CREATE TABLE sensor (
    id_sensor INT AUTO_INCREMENT PRIMARY KEY,
    id_vaga INT NOT NULL UNIQUE,
    tipo_sensor VARCHAR(50) NOT NULL DEFAULT 'OCUPACAO',
    estado_sensor ENUM('LIVRE', 'OCUPADO', 'INATIVO', 'ERRO') 
        NOT NULL DEFAULT 'LIVRE',
    data_instalacao DATE,
    ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sensor_vaga
        FOREIGN KEY (id_vaga)
        REFERENCES vaga(id_vaga)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================================
-- LEITURAS DOS SENSORES
-- Guarda histórico das alterações de estado.
-- Útil para relatórios e auditoria.
-- ==========================================================

CREATE TABLE leitura_sensor (
    id_leitura INT AUTO_INCREMENT PRIMARY KEY,
    id_sensor INT NOT NULL,
    estado_detectado ENUM('LIVRE', 'OCUPADO') NOT NULL,
    data_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_leitura_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES sensor(id_sensor)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ==========================================================
-- RESERVAS
-- Reserva é diferente de estacionamento.
-- Uma reserva pode ou não originar um estacionamento real.
-- ==========================================================

CREATE TABLE reserva (
    id_reserva INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizador INT NOT NULL,
    id_veiculo INT NOT NULL,
    id_vaga INT NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    estado_reserva ENUM('PENDENTE', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA', 'CONCLUIDA') 
        NOT NULL DEFAULT 'PENDENTE',
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reserva_utilizador
        FOREIGN KEY (id_utilizador)
        REFERENCES utilizador(id_utilizador)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reserva_veiculo
        FOREIGN KEY (id_veiculo)
        REFERENCES veiculo(id_veiculo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reserva_vaga
        FOREIGN KEY (id_vaga)
        REFERENCES vaga(id_vaga)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_periodo_reserva
        CHECK (data_fim > data_inicio)
);

-- ==========================================================
-- ESTACIONAMENTOS
-- Regista a entrada e saída reais de um veículo.
-- ==========================================================

CREATE TABLE estacionamento (
    id_estacionamento INT AUTO_INCREMENT PRIMARY KEY,
    id_veiculo INT NOT NULL,
    id_vaga INT NOT NULL,
    id_reserva INT NULL,
    data_hora_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_hora_saida DATETIME NULL,
    estado_estacionamento ENUM('ATIVO', 'FINALIZADO') NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT fk_estacionamento_veiculo
        FOREIGN KEY (id_veiculo)
        REFERENCES veiculo(id_veiculo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_estacionamento_vaga
        FOREIGN KEY (id_vaga)
        REFERENCES vaga(id_vaga)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_estacionamento_reserva
        FOREIGN KEY (id_reserva)
        REFERENCES reserva(id_reserva)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_periodo_estacionamento
        CHECK (
            data_hora_saida IS NULL 
            OR data_hora_saida > data_hora_entrada
        )
);

-- ==========================================================
-- PAGAMENTOS
-- O pagamento pode estar associado a uma reserva ou a um estacionamento.
-- ==========================================================

CREATE TABLE pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_reserva INT NULL,
    id_estacionamento INT NULL,
    valor DECIMAL(8,2) NOT NULL,

    metodo_pagamento ENUM(
        'MBWAY',
        'CARTAO_CREDITO',
        'CARTAO_DEBITO'
    ) NOT NULL,

    estado_pagamento ENUM(
        'PENDENTE',
        'REALIZADO',
        'FALHADO',
        'REEMBOLSADO'
    ) NOT NULL DEFAULT 'PENDENTE',

    data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pagamento_reserva
        FOREIGN KEY (id_reserva)
        REFERENCES reserva(id_reserva)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_pagamento_estacionamento
        FOREIGN KEY (id_estacionamento)
        REFERENCES estacionamento(id_estacionamento)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_valor_pagamento
        CHECK (valor >= 0)
);
-- ==========================================================
-- TRIGGERS
-- ==========================================================
DELIMITER $$

CREATE TRIGGER trg_pagamento_before_insert
BEFORE INSERT ON pagamento
FOR EACH ROW
BEGIN
    IF NEW.id_reserva IS NULL
       AND NEW.id_estacionamento IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pagamento deve estar associado a uma reserva ou estacionamento';
    END IF;
END$$

CREATE TRIGGER trg_pagamento_before_update
BEFORE UPDATE ON pagamento
FOR EACH ROW
BEGIN
    IF NEW.id_reserva IS NULL
       AND NEW.id_estacionamento IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pagamento deve estar associado a uma reserva ou estacionamento';
    END IF;
END$$

DELIMITER ;

-- ==========================================================
-- ÍNDICES ÚTEIS
-- ==========================================================

CREATE INDEX idx_vaga_estado ON vaga(estado);
CREATE INDEX idx_vaga_tipo ON vaga(tipo_vaga);
CREATE INDEX idx_reserva_periodo ON reserva(data_inicio, data_fim);
CREATE INDEX idx_estacionamento_ativo ON estacionamento(estado_estacionamento);
CREATE INDEX idx_pagamento_estado ON pagamento(estado_pagamento);
CREATE INDEX idx_leitura_sensor_data ON leitura_sensor(data_leitura);
