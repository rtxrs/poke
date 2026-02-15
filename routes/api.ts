import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import playerDataService from '../services/playerDataService.js';
import pokedexService from '../services/pokedexService.js';
import pvpService from '../services/pvpService.js';
import { saveDataLimiter } from '../middlewares/rateLimiter.js';
import { isAuthenticated } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/combat-moves', async (req: Request, res: Response) => {
    try {
        const fastMoves = JSON.parse(await fs.readFile(path.join(__dirname, '../data/public/fast_moves.json'), 'utf-8'));
        const chargedMoves = JSON.parse(await fs.readFile(path.join(__dirname, '../data/public/charged_moves.json'), 'utf-8'));
        res.json({ fastMoves, chargedMoves });
    } catch (error: any) {
        res.status(500).json({ message: "Error loading combat moves: " + error.message });
    }
});

router.get('/health-check', async (req: Request, res: Response) => {
    try {
        const healthData = await pokedexService.getHealthCheckData();
        res.json(healthData);
    } catch (error: any) {
        console.error("Error in /api/health-check:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/rankings', async (req: Request, res: Response) => {
    try {
        const rankings = await playerDataService.getRankings();
        
        const version = rankings.lastHeavyUpdate || 'initial';
        res.set('ETag', `"${version}"`);

        if (req.fresh) {
            return res.sendStatus(304);
        }

        res.json(rankings);
    } catch (error: any) {
        console.error("Error in /api/rankings:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/public-data', async (req: Request, res: Response) => {
    try {
        const playerSummaries = await playerDataService.getPublicPlayerSummaries();
        res.json(playerSummaries);
    } catch (error: any) {
        console.error("Error in /api/public-data:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/player-detail/:publicId', async (req: Request, res: Response) => {
    try {
        const publicId = req.params.publicId as string;
        const playerId = await playerDataService.getPlayerIdFromPublicId(publicId);
        if (!playerId) {
            return res.status(404).json({ message: 'Player not found.' });
        }
        const playerDetail = await playerDataService.getPlayerDetail(playerId);
        res.json(playerDetail);
    } catch (error: any) {
        console.error("Error in /api/player-detail:", error);
        res.status(404).json({ message: error.message });
    }
});

router.post('/save-data', saveDataLimiter, express.json({ limit: '10mb' }), async (req: Request, res: Response) => {
    try {
        if (req.body.pokemon && req.body.pokemon.length > 10500) {
            return res.status(400).json({ message: 'Pokemon count exceeds the maximum limit of 10,500.' });
        }
        const result = await playerDataService.savePlayerData(req.body);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Error in /api/save-data:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/private-data', isAuthenticated, async (req: Request, res: Response) => {
    try {
        if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });
        const { playerId } = req.session.user;
        const privateData = await playerDataService.getPrivatePlayerData(playerId);
        res.json(privateData);
    } catch (error: any) {
        console.error("❌ [500 Server Error] in /api/private-data:", error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/update-preferences', isAuthenticated, async (req: Request, res: Response) => {
    try {
        if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });
        const { playerId } = req.session.user;
        const { preferences } = req.body;
        if (!preferences) {
            return res.status(400).json({ message: 'No preferences provided.' });
        }
        const userService = (await import('../services/userService.js')).default;
        const updatedPrefs = await userService.updateUserPreferences(playerId, preferences);
        res.json({ success: true, preferences: updatedPrefs });
    } catch (error: any) {
        console.error("Error in /api/update-preferences:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/check-auth-status', async (req: Request, res: Response) => {
    if (req.session.user) {
        try {
            const privateData = await playerDataService.getPrivatePlayerData(req.session.user.playerId);
            const team = privateData?.playerData?.account?.team;
            const userId = privateData?.playerData?.account?.userId;
            const publicId = privateData?.playerData?.account?.publicId;
            
            res.json({ loggedIn: true, username: req.session.user.username, team: team, userId: userId, publicId: publicId });
        } catch (error) {
            console.error("Error fetching private data for auth status check:", error);
            res.json({ loggedIn: true, username: req.session.user.username, team: null, userId: null, publicId: null });
        }
    } else {
        res.json({ loggedIn: false });
    }
});

router.post('/pvp-ranks', async (req: Request, res: Response) => {
    try {
        const { pokemons } = req.body;
        if (!pokemons || !Array.isArray(pokemons)) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        const results: { [key: string]: any } = {};

        for (const p of pokemons) {
            let speciesId = p.id;
            if (pokedexService.pokedex && pokedexService.pokedex[p.id]) {
                const forms = pokedexService.pokedex[p.id];
                const firstForm = Object.values(forms)[0];
                if (firstForm && (firstForm as any).id) {
                    speciesId = (firstForm as any).id;
                }
            }

            const getRank = (league: string) => {
                const row = pvpService.getRank(speciesId, p.form, league, p.ivs.atk, p.ivs.def, p.ivs.sta);
                return row ? row.rank : null;
            };

            results[p.uniqueId] = {
                rankGreat: getRank('great'),
                rankUltra: getRank('ultra'),
                rankMaster: getRank('master')
            };
        }

        res.json(results);
    } catch (error: any) {
        console.error("Error in /api/pvp-ranks:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/moves', (req: Request, res: Response) => {
    try {
        res.json(pokedexService.moveMap);
    } catch (error: any) {
        console.error("Error in /api/moves:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
