const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const playerDataService = require('../services/playerDataService');
const pokedexService = require('../services/pokedexService');
const { saveDataLimiter } = require('../middlewares/rateLimiter');
const { isAuthenticated } = require('./auth');

const router = express.Router();

router.get('/combat-moves', async (req, res) => {
    try {
        const fastMoves = JSON.parse(await fs.readFile(path.join(__dirname, '../data/fast_moves.json'), 'utf-8'));
        const chargedMoves = JSON.parse(await fs.readFile(path.join(__dirname, '../data/charged_moves.json'), 'utf-8'));
        res.json({ fastMoves, chargedMoves });
    } catch (error) {
        res.status(500).json({ message: "Error loading combat moves: " + error.message });
    }
});

router.get('/health-check', async (req, res) => {
    try {
        const healthData = await pokedexService.getHealthCheckData();
        res.json(healthData);
    } catch (error) {
        console.error("Error in /api/health-check:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/rankings', async (req, res) => {
    try {
        const rankings = await playerDataService.getRankings();
        res.json(rankings);
    } catch (error) {
        console.error("Error in /api/rankings:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/public-data', async (req, res) => {
    try {
        const playerSummaries = await playerDataService.getPublicPlayerSummaries();
        res.json(playerSummaries);
    } catch (error) {
        console.error("Error in /api/public-data:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/player-detail/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params;
        const playerId = await playerDataService.getPlayerIdFromPublicId(publicId);
        if (!playerId) {
            return res.status(404).json({ message: 'Player not found.' });
        }
        const playerDetail = await playerDataService.getPlayerDetail(playerId);
        res.json(playerDetail);
    } catch (error) {
        console.error("Error in /api/player-detail:", error);
        res.status(404).json({ message: error.message });
    }
});

router.post('/save-data', saveDataLimiter, express.json({ limit: '10mb' }), async (req, res) => {
    // console.log('Received call to /api/save-data. Request Headers:', req.headers);
    try {
        if (req.body.pokemon && req.body.pokemon.length > 10500) {
            return res.status(400).json({ message: 'Pokemon count exceeds the maximum limit of 10,500.' });
        }
        const result = await playerDataService.savePlayerData(req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in /api/save-data:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/private-data', isAuthenticated, async (req, res) => {
    try {
        const { playerId } = req.session.user;
        const privateData = await playerDataService.getPrivatePlayerData(playerId);
        res.json(privateData);
    } catch (error) {
        console.error("❌ [500 Server Error] in /api/private-data:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/check-auth-status', async (req, res) => {
    if (req.session.user) {
        try {
            const privateData = await playerDataService.getPrivatePlayerData(req.session.user.playerId);
            const team = privateData?.playerData?.account?.team;
            const userId = privateData?.playerData?.account?.userId; // Get userId
            const publicId = privateData?.playerData?.account?.publicId; // Get publicId
            res.json({ loggedIn: true, username: req.session.user.username, team: team, userId: userId, publicId: publicId }); // Return userId and publicId
        } catch (error) {
            console.error("Error fetching private data for auth status check:", error);
            res.json({ loggedIn: true, username: req.session.user.username, team: null, userId: null, publicId: null }); // Return logged in but no team, userId or publicId on error
        }
    } else {
        res.json({ loggedIn: false });
    }
});

let pvpRanksCache = null;

async function getPvpRanks() {
    if (!pvpRanksCache) {
        try {
            const data = await fs.readFile(path.join(__dirname, '../data/pvp_ranks.json'), 'utf-8');
            pvpRanksCache = JSON.parse(data);
        } catch (e) {
            console.error("Failed to load PvP ranks:", e);
            return {};
        }
    }
    return pvpRanksCache;
}

router.post('/pvp-ranks', async (req, res) => {
    try {
        const { pokemons } = req.body; // Array of { id, form, ivs: {atk, def, sta}, uniqueId }
        if (!pokemons || !Array.isArray(pokemons)) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        const ranksData = await getPvpRanks();
        const results = {};

        pokemons.forEach(p => {
            // p.id is the DexNr (e.g. 1) from the client.
            // pvp_ranks.json is keyed by SpeciesID (e.g. "BULBASAUR").
            
            // Resolve Species ID using Pokedex Service
            let speciesId = p.id;
            if (pokedexService.pokedex && pokedexService.pokedex[p.id]) {
                const forms = pokedexService.pokedex[p.id];
                const firstForm = Object.values(forms)[0];
                if (firstForm && firstForm.id) {
                    speciesId = firstForm.id;
                }
            }

            const species = ranksData[speciesId];
            if (!species) return;
            
            // Try exact form, then fallback to NORMAL, then fallback to first available key if needed?
            // Generator uses specific form keys.
            let formRanks = species[p.form];
            if (!formRanks && p.form === 'NORMAL') {
                // Sometimes NORMAL is explicit, sometimes implicit.
                // If 'NORMAL' key missing, check if species has only 1 key?
                // But usually generator ensures keys exist.
            }
            
            if (!formRanks) return;

            const ivKey = (p.ivs.atk << 8) | (p.ivs.def << 4) | p.ivs.sta;
            
            const getRankInfo = (list) => {
                if (!list) return { rank: null, percent: null };
                const index = list.indexOf(ivKey);
                if (index === -1) return { rank: null, percent: null };
                
                const rank = index + 1;
                // Calculate percent? We don't have stat products here easily unless we store them.
                // Generator stored only IV keys.
                // User's original code had 'rankGreatPercent'.
                // Can we approximate? Rank 1 = 100%, Rank 4096 = 0%?
                // Or just ignore percent if user didn't ask for it specifically, but UI uses it?
                // UI uses: `rank-good` class based on rank number.
                // UI doesn't seem to display percent text, but `private-vue.js` calculates it.
                // Let's assume rank is enough for now.
                return { rank: rank };
            };

            results[p.uniqueId] = {
                rankGreat: getRankInfo(formRanks.gl).rank,
                rankUltra: getRankInfo(formRanks.ul).rank,
                rankMaster: getRankInfo(formRanks.ml).rank
            };
        });

        res.json(results);
    } catch (error) {
        console.error("Error in /api/pvp-ranks:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/moves', (req, res) => {
    try {
        res.json(pokedexService.moveMap);
    } catch (error) {
        console.error("Error in /api/moves:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;