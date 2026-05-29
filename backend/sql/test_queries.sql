USE estacionamento_inteligente1;

SELECT COUNT(*) AS total_utilizadores FROM utilizador;
SELECT COUNT(*) AS total_veiculos FROM veiculo;
SELECT COUNT(*) AS total_parques FROM parque_estacionamento;
SELECT COUNT(*) AS total_zonas FROM zona;
SELECT COUNT(*) AS total_vagas FROM vaga;
SELECT COUNT(*) AS total_sensores FROM sensor;
SELECT COUNT(*) AS total_leituras_sensor FROM leitura_sensor;
SELECT COUNT(*) AS total_reservas FROM reserva;
SELECT COUNT(*) AS total_estacionamentos FROM estacionamento;
SELECT COUNT(*) AS total_pagamentos FROM pagamento;

SELECT 
    estado,
    COUNT(*) AS total
FROM vaga
GROUP BY estado;

SELECT 
    p.nome AS parque,
    z.nome_zona,
    z.piso,
    v.numero_vaga,
    v.tipo_vaga,
    v.estado
FROM vaga v
JOIN zona z ON v.id_zona = z.id_zona
JOIN parque_estacionamento p ON z.id_parque = p.id_parque
WHERE v.estado = 'LIVRE'
LIMIT 20;

SELECT
    r.id_reserva,
    u.nome AS utilizador,
    ve.matricula,
    v.numero_vaga,
    r.data_inicio,
    r.data_fim,
    r.estado_reserva
FROM reserva r
JOIN utilizador u ON r.id_utilizador = u.id_utilizador
JOIN veiculo ve ON r.id_veiculo = ve.id_veiculo
JOIN vaga v ON r.id_vaga = v.id_vaga
ORDER BY r.data_inicio DESC
LIMIT 20;
