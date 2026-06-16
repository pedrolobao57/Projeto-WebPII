/**
 * @file ParqueController.js
 * @description Controlador responsável por gerir as consultas públicas dos parques de estacionamento.
 * Habilita a listagem geral dos parques com contagem de vagas em tempo real, consulta de detalhes individuais
 * e mapeamento de vagas e zonas para exibição nos mapas e layout físico da UI.
 */

const ParqueEstacionamento = require('../models/parque_estacionamento');
const Zona = require('../models/zona');
const Vaga = require('../models/vaga');

const PARK_AMENITIES = {
  1: ['EV Charging', 'Covered', 'Security', '24/7', 'Accessible'],           // Parque Pintos
  2: ['Covered', '24/7', 'Accessible', 'Motorcycle'],                        // SABA - Casa da Música
  3: ['EV Charging', 'Accessible']                                           // Parking 5 Outubro
};

/**
 * @function listarParques
 * @async
 * @description Obtém a lista completa dos parques de estacionamento.
 * Para cada parque, calcula dinamicamente o número total de vagas e vagas disponíveis (estado = 'LIVRE'),
 * estimando também uma distância teórica fictícia e faixa de preços base para exibição na listagem.
 * 
 * @param {Object} req - Objeto de pedido Express (Request).
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Array} Array contendo parques estruturados e formatados para consumo do cliente.
 */
exports.listarParques = async (req, res) => {
    try {
        const parks = await ParqueEstacionamento.findAll();
        const results = [];
        
        // Loop para obter a contagem de lugares de cada parque de forma reativa.
        for (const park of parks) {
            const zones = await Zona.findAll({ where: { id_parque: park.id_parque } });
            const zoneIds = zones.map(z => z.id_zona);
            
            let totalSpots = 0;
            let availableSpots = 0;
            let evCount = 0;
            
            // Só executa o count se existirem zonas associadas a este parque.
            if (zoneIds.length > 0) {
                totalSpots = await Vaga.count({ where: { id_zona: zoneIds } });
                availableSpots = await Vaga.count({ where: { id_zona: zoneIds, estado: 'LIVRE' } });
                evCount = await Vaga.count({ where: { id_zona: zoneIds, tipo_vaga: 'ELETRICO' } });
            }
            
            // Constrói o modelo de resposta formatado para consumo do frontend.
            results.push({
                id: park.id_parque.toString(),
                name: park.nome,
                // Distância simulada para dar maior fidelidade à interface visual
                distance: `${(park.id_parque * 0.3).toFixed(1)} mi`,
                spots: `${availableSpots}/${totalSpots}`,
                // Preço estimado com base no índice numérico do parque (para demonstração)
                price: `€${(park.id_parque * 2 + 4)}`,
                isAvailable: availableSpots > 0,
                amenities: PARK_AMENITIES[park.id_parque] || ['Security'],
                hasEV: evCount > 0,
                evSpots: evCount
            });
        }
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar parques.', error: err.message });
    }
};

/**
 * @function obterParque
 * @async
 * @description Obtém a ficha detalhada de um determinado parque de estacionamento.
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém body/params com `parkId`.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Object} Detalhes do parque com estatísticas de vagas, localização e preço base.
 */
exports.obterParque = async (req, res) => {
    try {
        const { parkId } = req.params;
        const park = await ParqueEstacionamento.findByPk(parkId);
        if (!park) {
            return res.status(404).json({ message: 'Parque não encontrado' });
        }
        
        const zones = await Zona.findAll({ where: { id_parque: parkId } });
        const zoneIds = zones.map(z => z.id_zona);
        
        let totalSpots = 0;
        let availableSpots = 0;
        let evCount = 0;
        
        // Efetua a contagem acumulada de vagas livres/totais nas zonas deste parque.
        if (zoneIds.length > 0) {
            totalSpots = await Vaga.count({ where: { id_zona: zoneIds } });
            availableSpots = await Vaga.count({ where: { id_zona: zoneIds, estado: 'LIVRE' } });
            evCount = await Vaga.count({ where: { id_zona: zoneIds, tipo_vaga: 'ELETRICO' } });
        }
        
        res.json({
            id: park.id_parque.toString(),
            name: park.nome,
            location: park.localizacao,
            totalSpots,
            availableSpots,
            price: (park.id_parque * 2 + 4),
            amenities: PARK_AMENITIES[park.id_parque] || ['Security'],
            hasEV: evCount > 0,
            evSpots: evCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao obter detalhes do parque.', error: err.message });
    }
};

/**
 * @function listarVagas
 * @async
 * @description Lista todas as vagas e layouts de um parque específico agrupadas por zona (ex: Piso 1, Piso 2).
 * Formata os estados internos do banco de dados para corresponder ao formato lido pela interface UI (free, occupied, reserved).
 * 
 * @param {Object} req - Objeto de pedido Express (Request). Contém `parkId` em params.
 * @param {Object} res - Objeto de resposta Express (Response).
 * @returns {Array} Array de zonas e respetivas listas de vagas formatadas.
 */
exports.listarVagas = async (req, res) => {
    try {
        const { parkId } = req.params;
        const zones = await Zona.findAll({ where: { id_parque: parkId } });
        const results = [];
        
        // Itera sobre cada zona para carregar e formatar as vagas físicas.
        for (const zone of zones) {
            const spots = await Vaga.findAll({ where: { id_zona: zone.id_zona } });
            
            const formattedSpots = spots.map(s => {
                let status = 'free';
                // Mapeia os estados internos do Sequelize/BD para as classes CSS/estados reativos do Frontend
                if (s.estado === 'OCUPADO') status = 'occupied';
                else if (s.estado === 'RESERVADO') status = 'reserved';
                
                return {
                    id: s.id_vaga.toString(),
                    name: s.numero_vaga,
                    status: status,
                    type: s.tipo_vaga
                };
            });
            
            results.push({
                name: zone.nome_zona,
                spots: formattedSpots
            });
        }
        
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao obter vagas do parque.', error: err.message });
    }
};

