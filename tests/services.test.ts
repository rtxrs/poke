import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pokedexService from '../services/pokedexService';
import playerDataService from '../services/playerDataService';
import { DATA_PATH } from '../config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Service Validation with Real Data', () => {
    
    beforeAll(async () => {
        // Ensure required directories exist
        const directories = [
            path.join(__dirname, '../data/public'),
            path.join(__dirname, '../data/private'),
            path.join(__dirname, '../data/private/sessions'),
            path.join(__dirname, '../data/user/custom'),
            path.join(__dirname, '../data/user/generated'),
            DATA_PATH
        ];

        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }

        // Initialize services
        await pokedexService.initialize();
        await playerDataService.init();
    });

    it('should have a loaded pokedex', () => {
        expect(pokedexService.pokedex).toBeDefined();
        expect(Object.keys(pokedexService.pokedex || {}).length).toBeGreaterThan(0);
    });

    it('should validate player data files and rankings', async () => {
        const files = await fs.readdir(DATA_PATH);
        const playerFiles = files.filter(f => f.endsWith('.json') && f !== 'PGSStats.json');

        if (playerFiles.length === 0) {
            console.warn('⚠️ No player data files found in pgsharp_player_data. Skipping data validation.');
            return;
        }

        console.log(`🔍 Validating ${playerFiles.length} player files...`);

        // Test global rankings generation
        const rankings = await playerDataService.generateAndSaveRankings();
        
        expect(rankings).toBeDefined();
        expect(rankings.recentPlayers).toBeInstanceOf(Array);
        expect(rankings.strongestPokemon).toBeInstanceOf(Array);
        expect(rankings.rarestPokemon).toBeInstanceOf(Array);

        // Validate a specific player detail if files exist
        const firstPlayerId = playerFiles[0].replace('.json', '');
        const playerDetail = await playerDataService.getPlayerDetail(firstPlayerId);
        
        expect(playerDetail).toBeDefined();
        expect(playerDetail.name).toBeDefined();
        expect(playerDetail.highlights).toBeInstanceOf(Array);
        expect(playerDetail.highlights.length).toBeGreaterThan(0);
    });

    it('should correctly calculate Pokémon names and sprites', async () => {
        const files = await fs.readdir(DATA_PATH);
        const playerFiles = files.filter(f => f.endsWith('.json') && f !== 'PGSStats.json');

        if (playerFiles.length > 0) {
            const content = JSON.parse(await fs.readFile(path.join(DATA_PATH, playerFiles[0]), 'utf-8'));
            const pokemon = content.pokemons[0];

            if (pokemon && !pokemon.isEgg) {
                const name = pokedexService.getPokemonName(pokemon.pokemonId, pokemon.pokemonDisplay.formName);
                const sprite = pokedexService.getPokemonSprite(pokemon);

                expect(typeof name).toBe('string');
                expect(name.length).toBeGreaterThan(0);
                expect(sprite).toContain('http');
            }
        }
    });

    it('should validate shiny rate logic', () => {
        // Test standard shiny rate
        const rate = pokedexService.getShinyRate(1, 0, undefined, undefined);
        expect(rate).toBeGreaterThanOrEqual(64);
        expect(rate).toBeLessThanOrEqual(512);

        // Test community day rate
        const cdRate = pokedexService.getShinyRate(1, 0, undefined, ['community_day_2023']);
        expect(cdRate).toBeLessThan(rate);
    });
});
