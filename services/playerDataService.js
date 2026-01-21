const fs = require('fs/promises');
const path = require('path');
const cron = require('node-cron');
let uuidv4;

const { DATA_PATH, DATA_FOLDER, RANKINGS_FILE, DATA_DIR, PUBLIC_ID_MAP_FILE } = require('../config');
const pokedexService = require('./pokedexService');
const pvpService = require('./pvpService');
const { readUsers, writeUsers } = require('./userService');

const playerDataService = {
    publicIdMap: new Map(), // Stores publicId -> playerId mapping
    playerIdToPublicIdMap: new Map(), // Stores playerId -> publicId mapping
    _initialized: false,

    async init() {
        if (this._initialized) return;
        
        if (!uuidv4) {
            const uuidModule = await import('uuid');
            uuidv4 = uuidModule.v4;
        }
        // Ensure the data directory exists before trying to access map file
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(path.join(DATA_DIR, 'private'), { recursive: true });
        await fs.mkdir(path.join(DATA_DIR, 'private/sessions'), { recursive: true });

        // Load publicIdMap from file
        try {
            const mapContent = await fs.readFile(PUBLIC_ID_MAP_FILE, 'utf-8');
            const parsedMap = JSON.parse(mapContent);
            this.publicIdMap = new Map(parsedMap.publicIdMap);
            this.playerIdToPublicIdMap = new Map(parsedMap.playerIdToPublicIdMap);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('🔄 publicIdMap.json not found. Initializing from users.json.');
            } else {
                console.error('Error reading or parsing publicIdMap.json. Re-initializing from users.json.', error);
            }
            
            try {
                const users = await readUsers();
                let mapUpdated = false;
                // Ensure maps are clean before regenerating
                this.publicIdMap = new Map();
                this.playerIdToPublicIdMap = new Map();

                for (const user of users) {
                    if (user.playerId) {
                        const newPublicId = uuidv4();
                        this.publicIdMap.set(newPublicId, user.playerId);
                        this.playerIdToPublicIdMap.set(user.playerId, newPublicId);
                        mapUpdated = true;
                    }
                }
                if (mapUpdated) {
                    await this.savePublicIdMap();
                    console.log('👍 publicIdMap regenerated from users.json.');

                    // Force rankings regeneration by deleting the file
                    try {
                        await fs.unlink(RANKINGS_FILE);
                        console.log('Deleted rankings.json to force regeneration.');
                    } catch (unlinkError) {
                        if (unlinkError.code !== 'ENOENT') {
                            console.error('Error deleting rankings.json:', unlinkError);
                        }
                    }
                }
            } catch (recoveryError) {
                console.error('Failed to regenerate publicIdMap from users.json:', recoveryError);
            }
        }

        // Schedule background rankings update every 15 minutes of the hour
        this.scheduleRankingsUpdate();
        this._initialized = true;
    },

    scheduleRankingsUpdate() {
        if (this._rankingsJob) this._rankingsJob.stop();
        this._rankingsJob = cron.schedule('0,15,30,45 * * * *', () => {
            console.log('⏰ Running scheduled global rankings update (Fixed Interval)...');
            this.generateAndSaveRankings().catch(err => console.error('Rankings update failed:', err));
        });
        console.log('📅 Global rankings update scheduled (Fixed intervals: :00, :15, :30, :45).');
    },

    async savePublicIdMap() {
        const mapData = {
            publicIdMap: Array.from(this.publicIdMap.entries()),
            playerIdToPublicIdMap: Array.from(this.playerIdToPublicIdMap.entries()),
        };
        try {
            await fs.writeFile(PUBLIC_ID_MAP_FILE, JSON.stringify(mapData, null, 2));
        } catch (error) {
            console.error('Error saving publicIdMap.json:', error);
        }
    },

    async generatePublicId(playerId) {
        await this.init(); // Ensure uuidv4 is loaded
        if (this.playerIdToPublicIdMap.has(playerId)) {
            return this.playerIdToPublicIdMap.get(playerId);
        }
        const newPublicId = uuidv4();
        this.publicIdMap.set(newPublicId, playerId);
        this.playerIdToPublicIdMap.set(playerId, newPublicId);
        await this.savePublicIdMap(); // Save map after generating new ID
        return newPublicId;
    },

    async getPlayerIdFromPublicId(publicId) {
        await this.init(); // Ensure publicIdMap is loaded
        const playerId = this.publicIdMap.get(publicId);
        return playerId;
    },

    async initializeRankings() {
        await this.init(); // Ensure uuidv4 and publicIdMap are loaded
        // Ensure the data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Check for rankings.json in the root directory and move it if found
        const oldRankingsPath = path.join(process.cwd(), 'rankings.json');
        try {
            await fs.access(oldRankingsPath);
            console.log('Found rankings.json in root directory. Moving to new data directory...');
            await fs.rename(oldRankingsPath, RANKINGS_FILE);
            console.log('rankings.json moved successfully.');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error checking for old rankings.json:', error);
            }
        }

        try {
            await fs.access(RANKINGS_FILE);
            return;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('🔄 rankings.json not found. Initializing from player data files...');
                await this.generateAndSaveRankings();
            } else {
                console.error('Error accessing rankings.json:', error);
                throw error;
            }
        }
    },

    async _calculatePokemonRankings(playerFiles, playerIdToUserId) {
        let totalPokemonEvaluated = 0;
        const getPokedexEntry = (p) => {
            if (!pokedexService.pokedex || !pokedexService.pokedex[p.pokemonId]) return null;
            const allFormsForPokemon = pokedexService.pokedex[p.pokemonId];
            const basePokemonData = allFormsForPokemon['NORMAL'] || Object.values(allFormsForPokemon)[0];
            if (!basePokemonData) return null;
            const playerFormName = p.pokemonDisplay.formName?.toUpperCase() || '';
            if (basePokemonData.regionForms) {
                for (const regionFormKey in basePokemonData.regionForms) {
                    if (playerFormName.includes(regionFormKey.replace(/_/g, ''))) return basePokemonData.regionForms[regionFormKey];
                }
            }
            const normalEntry = basePokemonData;
            if (!playerFormName || playerFormName === 'UNSET' || playerFormName.includes('NORMAL')) return normalEntry;
            const normalizedPlayerForm = playerFormName.replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');
            for (const formKey in allFormsForPokemon) {
                const pokedexForm = allFormsForPokemon[formKey];
                const normalizedPokedexForm = formKey.toUpperCase().replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');
                if (normalizedPlayerForm.includes(normalizedPokedexForm)) return pokedexForm;
            }
            return normalEntry;
        };

        // Heaps to keep track of top 50 without storing everything in memory
        const strongestCandidates = [];
        const rarestCandidates = [];

        const addToCandidateList = (list, item, scoreField, max = 50) => {
            list.push(item);
            list.sort((a, b) => b[scoreField] - a[scoreField]);
            if (list.length > max) list.pop();
        };

        for (const file of playerFiles) {
            try {
                const filePath = path.join(DATA_PATH, file);
                const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
                if (!content.account || !content.player || !content.pokemons) continue;

                const playerName = content.account.name;
                const playerId = content.account.playerSupportId;
                const publicId = await this.generatePublicId(playerId);
                const userId = playerIdToUserId.get(playerId);

                content.pokemons.forEach(p => {
                    if (p.isEgg || !p.pokemonDisplay) return;
                    totalPokemonEvaluated++;

                    const pokedexEntry = getPokedexEntry(p);
                    const shinyRate = pokedexService.getShinyRate(p.pokemonId, p.originDetail?.originDetailCase, pokedexEntry?.pokemonClass, p.originEvents);
                    
                    const rarity = {
                        score: 1,
                        breakdown: {
                            iv: { value: 1, text: '' },
                            shiny: { value: 1, text: '' },
                            lucky: { value: 1, text: '' },
                            origin: { value: 1, text: '' }
                        }
                    };

                    // IV Rarity
                    if (p.individualAttack === 0 && p.individualDefense === 0 && p.individualStamina === 0) {
                        rarity.breakdown.iv.value = 4097;
                        rarity.breakdown.iv.text = '0 IV';
                    } else if (p.individualAttack === 15 && p.individualDefense === 15 && p.individualStamina === 15) {
                        const origin = p.originDetail?.originDetailCase;
                        const alignment = p.pokemonDisplay.alignment;
                        if (alignment === 1) {
                            rarity.breakdown.iv.value = (origin === 3 || origin === 28) ? 1000 : 4096;
                            rarity.breakdown.iv.text = 'Shadow Hundo';
                        } else if (alignment === 2) {
                            rarity.breakdown.iv.value = 152;
                            rarity.breakdown.iv.text = 'Purified Hundo';
                        } else {
                            if (p.isLucky) {
                                rarity.breakdown.iv.value = 64;
                                rarity.breakdown.iv.text = 'Lucky Hundo';
                            } else if (p.tradedTimeMs > 0) {
                                rarity.breakdown.iv.value = 987;
                                rarity.breakdown.iv.text = 'Traded Hundo';
                            } else {
                                rarity.breakdown.iv.value = 4096;
                                rarity.breakdown.iv.text = 'Wild Hundo';
                            }
                        }
                    }

                    // Shiny Rarity
                    if (p.pokemonDisplay?.shiny) {
                        rarity.breakdown.shiny.value = shinyRate;
                        rarity.breakdown.shiny.text = (p.originEvents && p.originEvents.some(event => event.includes('community_day'))) ? 'Community Day' : 'Shiny';
                    }

                    // Lucky Rarity
                    if (p.isLucky) {
                        rarity.breakdown.lucky.value = 20;
                        rarity.breakdown.lucky.text = 'Lucky';
                    }

                    rarity.score = rarity.breakdown.iv.value * rarity.breakdown.shiny.value * rarity.breakdown.lucky.value;
                    const currentCpm = p.cpMultiplier + (p.additionalCpMultiplier || 0);

                    const baseData = {
                        name: pokedexService.getPokemonName(p.pokemonId, p.pokemonDisplay.formName),
                        sprite: pokedexService.getPokemonSprite(p),
                        owner: playerName,
                        ownerId: playerId,
                        ownerPublicId: publicId,
                        userId: userId,
                        cp: p.cp,
                        iv: {
                            attack: p.individualAttack,
                            defense: p.individualDefense,
                            stamina: p.individualStamina
                        },
                        cpm: currentCpm,
                        pokemonDisplay: p.pokemonDisplay,
                        isShiny: p.pokemonDisplay.shiny,
                        isLucky: p.isLucky,
                        isPerfect: p.individualAttack === 15 && p.individualDefense === 15 && p.individualStamina === 15,
                        isZeroIv: p.individualAttack === 0 && p.individualDefense === 0 && p.individualStamina === 0,
                        isShadow: p.pokemonDisplay.alignment === 1,
                        isPurified: p.pokemonDisplay.alignment === 2,
                        isLegendary: pokedexEntry?.pokemonClass === 'POKEMON_CLASS_LEGENDARY',
                        isMythical: pokedexEntry?.pokemonClass === 'POKEMON_CLASS_MYTHIC',
                        isTraded: p.tradedTimeMs > 0,
                        isMaxLevel: currentCpm > 0.83,
                        rarity: rarity
                    };

                    addToCandidateList(strongestCandidates, baseData, 'cp');
                    if (rarity.score > 1) {
                        addToCandidateList(rarestCandidates, { ...baseData, rarityScore: rarity.score }, 'rarityScore');
                    }
                });
            } catch (err) {
                console.error(`Error processing file ${file} for rankings:`, err);
            }
        }

        return { strongestPokemon: strongestCandidates, rarestPokemon: rarestCandidates, totalPokemonEvaluated };
    },

    async generateAndSaveRankings() {
        await this.init();
        const startTime = Date.now();
        try {
            const files = await fs.readdir(DATA_PATH);
            const playerFiles = files.filter(f => f.endsWith('.json') && f !== 'PGSStats.json');

            const users = await readUsers();
            const playerIdToUserId = new Map(users.map((user, index) => [user.playerId, (index + 1).toString().padStart(3, '0')]));

            let recentPlayers = [];
            // Check if existing rankings file exists to preserve recent players if possible
            try {
                const existing = JSON.parse(await fs.readFile(RANKINGS_FILE, 'utf-8'));
                recentPlayers = existing.recentPlayers || [];
            } catch (e) {
                // rankings.json might not exist, will rebuild recent list
                for (const file of playerFiles) {
                    const filePath = path.join(DATA_PATH, file);
                    const stats = await fs.stat(filePath);
                    const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
                    if (!content.account || !content.player) continue;
                    const publicId = await this.generatePublicId(content.account.playerSupportId);
                    const buddy = content.pokemons.find(p => p.id === content.account.buddyPokemonProto?.buddyPokemonId);
                    recentPlayers.push({
                        name: content.account.name,
                        playerId: content.account.playerSupportId,
                        publicId,
                        userId: playerIdToUserId.get(content.account.playerSupportId),
                        buddy: buddy && buddy.pokemonDisplay ? {
                            name: pokedexService.getPokemonName(buddy.pokemonId, buddy.pokemonDisplay.formName),
                            sprite: pokedexService.getPokemonSprite(buddy)
                        } : null,
                        kmWalked: content.player.kmWalked.toFixed(1),
                        pokemonCaught: content.player.numPokemonCaptured,
                        lastUpdate: stats.mtimeMs
                    });
                }
                recentPlayers = recentPlayers.sort((a, b) => b.lastUpdate - a.lastUpdate).slice(0, 50);
            }

            const { strongestPokemon, rarestPokemon, totalPokemonEvaluated } = await this._calculatePokemonRankings(playerFiles, playerIdToUserId);
            const rankings = { recentPlayers, strongestPokemon, rarestPokemon };
            
            await fs.writeFile(RANKINGS_FILE, JSON.stringify(rankings));
            this.rankingsCache = rankings;
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ Global rankings updated: ${playerFiles.length} players, ${totalPokemonEvaluated.toLocaleString()} Pokémon evaluated in ${duration}s.`);
            return rankings;
        } catch (error) {
            console.error("Error in generateAndSaveRankings:", error);
            throw error;
        }
    },

    async savePlayerData(data) {
        await this.init();
        const name = data?.account?.name;
        const playerId = data?.account?.playerSupportId;

        if (!name || !playerId) {
            if (Object.keys(data).length === 0) return { success: true, message: 'Connection test successful.' };
            throw new Error('Payload is missing required account data.');
        }

        console.log(`✅ Received data for ${name} (${playerId}).`);
        await fs.mkdir(DATA_PATH, { recursive: true });
        
        // Save MINIFIED JSON (Save disk/RAM)
        await fs.writeFile(path.join(DATA_PATH, `${playerId}.json`), JSON.stringify(data));

        const users = await readUsers();
        const userIndex = users.findIndex(u => u.playerId === playerId);
        if (userIndex > -1) users[userIndex].username = name;
        else users.push({ username: name, playerId: playerId, password: "", web_username: "" });
        await writeUsers(users);

        // Update ONLY recent players (Fast)
        await this.updateRecentPlayersOnly(data);

        return { success: true, message: 'Data saved. Rankings will update in background.' };
    },

    async updateRecentPlayersOnly(playerData) {
        const playerId = playerData.account.playerSupportId;
        const playerName = playerData.account.name;
        const publicId = await this.generatePublicId(playerId);
        const users = await readUsers();
        const playerIdToUserId = new Map(users.map((user, index) => [user.playerId, (index + 1).toString().padStart(3, '0')]));
        const userId = playerIdToUserId.get(playerId);

        let rankings = { recentPlayers: [], strongestPokemon: [], rarestPokemon: [] };
        try {
            rankings = JSON.parse(await fs.readFile(RANKINGS_FILE, 'utf-8'));
        } catch (e) { return; }

        const buddy = playerData.pokemons.find(p => p.id === playerData.account.buddyPokemonProto?.buddyPokemonId);
        const newEntry = {
            name: playerName,
            playerId: playerId,
            publicId,
            userId,
            buddy: buddy && buddy.pokemonDisplay ? {
                name: pokedexService.getPokemonName(buddy.pokemonId, buddy.pokemonDisplay.formName),
                sprite: pokedexService.getPokemonSprite(buddy)
            } : null,
            kmWalked: playerData.player.kmWalked.toFixed(1),
            pokemonCaught: playerData.player.numPokemonCaptured,
            lastUpdate: Date.now()
        };

        const idx = rankings.recentPlayers.findIndex(p => p.playerId === playerId);
        if (idx > -1) rankings.recentPlayers[idx] = newEntry;
        else rankings.recentPlayers.push(newEntry);

        rankings.recentPlayers = rankings.recentPlayers.sort((a, b) => b.lastUpdate - a.lastUpdate).slice(0, 50);
        await fs.writeFile(RANKINGS_FILE, JSON.stringify(rankings));
        this.rankingsCache = rankings;
    },

    async getRankings() {
        await this.init();
        if (this.rankingsCache) return this.rankingsCache;
        try {
            this.rankingsCache = JSON.parse(await fs.readFile(RANKINGS_FILE, 'utf-8'));
            return this.rankingsCache;
        } catch (error) {
            return { recentPlayers: [], strongestPokemon: [], rarestPokemon: [] };
        }
    },

    async getPublicPlayerSummaries() {
        await this.init();
        try {
            const files = await fs.readdir(DATA_PATH);
            return await Promise.all(
                files.filter(f => f.endsWith('.json') && f !== 'PGSStats.json').map(async file => {
                    const content = JSON.parse(await fs.readFile(path.join(DATA_PATH, file), 'utf-8'));
                    const playerId = content.account.playerSupportId;
                    const publicId = await this.generatePublicId(playerId);
                    
                    let displayPokemon = content.pokemons.find(p => p.id === content.account?.buddyPokemonProto?.buddyPokemonId);
                    if (!displayPokemon) displayPokemon = content.pokemons.filter(p => !p.isEgg).sort((a, b) => b.cp - a.cp)[0];

                    return {
                        name: content.account.name,
                        level: content.player.level,
                        team: content.account.team,
                        kmWalked: content.player.kmWalked.toFixed(1),
                        displayPokemon: displayPokemon ? {
                            name: pokedexService.getPokemonName(displayPokemon.pokemonId, displayPokemon.pokemonDisplay.formName),
                            cp: displayPokemon.cp,
                            sprite: pokedexService.getPokemonSprite(displayPokemon)
                        } : { name: 'N/A', cp: 0, sprite: '' },
                        playerId,
                        publicId
                    };
                })
            );
        } catch (error) { return []; }
    },

    async getPlayerDetail(playerId) {
        await this.init();
        try {
            const content = JSON.parse(await fs.readFile(path.join(DATA_PATH, `${playerId}.json`), 'utf-8'));
            const publicId = await this.generatePublicId(playerId);
            
            // Fast userId lookup
            const users = await readUsers();
            const user = users.find(u => u.playerId === playerId);
            const userId = user ? (users.indexOf(user) + 1).toString().padStart(3, '0') : null;

            const allPokemon = content.pokemons.filter(p => !p.isEgg);
            
            // Efficient single-pass selection
            let latestCaught = null;
            let latestShiny = null;
            const topStrongest = []; // We'll keep top 10 to pick 2

            for (const p of allPokemon) {
                // 1. Latest caught
                if (!latestCaught || p.creationTimeMs > latestCaught.creationTimeMs) {
                    latestCaught = p;
                }
                // 2. Latest shiny
                if (p.pokemonDisplay?.shiny) {
                    if (!latestShiny || p.creationTimeMs > latestShiny.creationTimeMs) {
                        latestShiny = p;
                    }
                }
                // 3. Keep top strongest candidates
                topStrongest.push(p);
                if (topStrongest.length > 20) {
                    topStrongest.sort((a, b) => b.cp - a.cp);
                    topStrongest.length = 10;
                }
            }
            topStrongest.sort((a, b) => b.cp - a.cp);

            const highlights = [];
            const addedIds = new Set();
            const pushH = (p) => {
                if (p && !addedIds.has(p.id) && highlights.length < 4) {
                    highlights.push(p);
                    addedIds.add(p.id);
                }
            };

            pushH(latestCaught);
            pushH(latestShiny);
            topStrongest.forEach(pushH);

            return {
                name: content.account.name,
                userId,
                publicId,
                startDate: new Date(content.account.creationTimeMs).toLocaleDateString(),
                totalXp: content.player.experience,
                pokemonCaught: content.player.numPokemonCaptured,
                pokestopsVisited: content.player.pokeStopVisits,
                kmWalked: content.player.kmWalked,
                highlights: highlights.map(p => {
                    const pokedexEntry = Object.values(pokedexService.pokedex[p.pokemonId] || {})[0];
                    return {
                        cp: p.cp,
                        name: pokedexService.getPokemonName(p.pokemonId, p.pokemonDisplay.formName),
                        sprite: pokedexService.getPokemonSprite(p),
                        typeColors: pokedexService.getPokemonTypeColors(pokedexEntry)
                    };
                })
            };
        } catch (error) { 
            console.error("Error in getPlayerDetail:", error);
            throw new Error('Player data not found.'); 
        }
    },

    async getPrivatePlayerData(playerId) {
        await this.init();
        try {
            const data = JSON.parse(await fs.readFile(path.join(DATA_PATH, `${playerId}.json`), 'utf-8'));
            
            const users = await readUsers();
            const user = users.find(u => u.playerId === playerId);
            data.account.userId = user ? (users.indexOf(user) + 1).toString().padStart(3, '0') : null;
            data.account.publicId = await this.generatePublicId(playerId);
            data.account.preferences = user?.preferences || {};
            
            return {
                playerData: data,
                pvpDataVersion: pvpService.getDataVersion(),
                pokedexService: { typeColorMap: pokedexService.typeColorMap }
            };
        } catch (error) { throw new Error('A server error occurred while processing your player data.'); }
    }
};

module.exports = playerDataService;
