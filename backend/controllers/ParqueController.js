const ParqueEstacionamento = require('../models/parque_estacionamento');
const Zona = require('../models/zona');
const Vaga = require('../models/vaga');

exports.listarParques = async (req, res) => {
    try {
        const parks = await ParqueEstacionamento.findAll();
        const results = [];
        
        for (const park of parks) {
            const zones = await Zona.findAll({ where: { id_parque: park.id_parque } });
            const zoneIds = zones.map(z => z.id_zona);
            
            let totalSpots = 0;
            let availableSpots = 0;
            
            if (zoneIds.length > 0) {
                totalSpots = await Vaga.count({ where: { id_zona: zoneIds } });
                availableSpots = await Vaga.count({ where: { id_zona: zoneIds, estado: 'LIVRE' } });
            }
            
            results.push({
                id: park.id_parque.toString(),
                name: park.nome,
                distance: `${(park.id_parque * 0.3).toFixed(1)} mi`,
                spots: `${availableSpots}/${totalSpots}`,
                price: `$${(park.id_parque * 2 + 4)}`,
                isAvailable: availableSpots > 0
            });
        }
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar parques.', error: err.message });
    }
};

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
        
        if (zoneIds.length > 0) {
            totalSpots = await Vaga.count({ where: { id_zona: zoneIds } });
            availableSpots = await Vaga.count({ where: { id_zona: zoneIds, estado: 'LIVRE' } });
        }
        
        res.json({
            id: park.id_parque.toString(),
            name: park.nome,
            location: park.localizacao,
            totalSpots,
            availableSpots,
            price: (park.id_parque * 2 + 4)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao obter detalhes do parque.', error: err.message });
    }
};

exports.listarVagas = async (req, res) => {
    try {
        const { parkId } = req.params;
        const zones = await Zona.findAll({ where: { id_parque: parkId } });
        const results = [];
        
        for (const zone of zones) {
            const spots = await Vaga.findAll({ where: { id_zona: zone.id_zona } });
            
            const formattedSpots = spots.map(s => {
                let status = 'free';
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
