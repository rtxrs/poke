// Web Worker for calculating PvP Rankings (Great League & Ultra League)
// Optimized to handle large datasets by grouping Pokémon by Species.

// --- Constants & Tables ---
const CPM_TABLE = {
    "1": 0.094, "1.5": 0.1351374318, "2": 0.16639787, "2.5": 0.192650919, "3": 0.21573247, "3.5": 0.2365726613, "4": 0.25572005, "4.5": 0.2735303812, "5": 0.29024988, "5.5": 0.3060573775, "6": 0.3210876, "6.5": 0.3354450362, "7": 0.34921268, "7.5": 0.3624577511, "8": 0.3752356, "8.5": 0.387592416, "9": 0.39956728, "9.5": 0.4111935514, "10": 0.4225, "10.5": 0.4329264091, "11": 0.44310755, "11.5": 0.4530599591, "12": 0.4627984, "12.5": 0.472336093, "13": 0.48168495, "13.5": 0.4908558003, "14": 0.49985844, "14.5": 0.508701765, "15": 0.51739395, "15.5": 0.5259425113, "16": 0.5343543, "16.5": 0.5426357375, "17": 0.5507927, "17.5": 0.5588305862, "18": 0.5667545, "18.5": 0.5745691333, "19": 0.5822789, "19.5": 0.5898879072, "20": 0.5974, "20.5": 0.6048236651, "21": 0.6121573, "21.5": 0.6194041216, "22": 0.6265671, "22.5": 0.6336491432, "23": 0.64065295, "23.5": 0.6475809666, "24": 0.65443563, "24.5": 0.6612192524, "25": 0.667934, "25.5": 0.6745818959, "26": 0.6811649, "26.5": 0.6876849038, "27": 0.69414365, "27.5": 0.70054287, "28": 0.7068842, "28.5": 0.7131691091, "29": 0.7193991, "29.5": 0.7255756136, "30": 0.7317, "30.5": 0.7377694897, "31": 0.7437366, "31.5": 0.749609799, "32": 0.7553897, "32.5": 0.761080073, "33": 0.7666845, "33.5": 0.772199568, "34": 0.7776309, "34.5": 0.782983635, "35": 0.7882599, "35.5": 0.793460966, "36": 0.7985881, "36.5": 0.803645071, "37": 0.8086304, "37.5": 0.813544863, "38": 0.8183946, "38.5": 0.823179625, "39": 0.7846369743347168, "39.5": 0.7874736085132754, "40": 0.7903000116348267, "40.5": 0.792803968023538, "41": 0.7953000068664551, "41.5": 0.7978038983716224, "42": 0.8003000020980835, "42.5": 0.8028038718775964, "43": 0.8052999973297119, "43.5": 0.8078038508470536, "44": 0.8102999925613403, "44.5": 0.812803835179168, "45": 0.8152999877929688, "45.5": 0.8178037928037928, "46": 0.8203000020980835, "46.5": 0.822803776019539, "47": 0.825300009250640, "47.5": 0.827803755931569, "48": 0.830300023555755, "48.5": 0.832803729034748, "49": 0.835300018787384, "49.5": 0.837803755931569, "50": 0.840300023555755, "50.5": 0.842803729034748, "51": 0.845300018787384, "51.5": 0.847803702398935, "52": 0.850300014019012, "52.5": 0.852803676019539, "53": 0.855300009250640, "53.5": 0.857803649892077, "54": 0.860300004482269, "54.5": 0.862803624012168, "55": 0.865299999713897
};

// Pre-sort levels numerically for optimization
// Filter out levels above 51 (standard max level including Best Buddy)
const sortedLevels = Object.entries(CPM_TABLE)
    .map(([lvl, cpm]) => [parseFloat(lvl), cpm])
    .filter(([lvl]) => lvl <= 51)
    .sort((a, b) => a[0] - b[0]);

const LEAGUES = {
    GREAT: 1500,
    ULTRA: 2500,
    MASTER: 10000 // Effectively uncapped
};

// --- Helper Functions ---

// Maps player data to Pokedex entry (Logic duplicated from private-vue.js to run independently)
function getPokedexEntry(p, pokedex) {
    if (!pokedex || !pokedex[p.pokemonId]) return null;

    const basePokemonData = Object.values(pokedex[p.pokemonId])[0];
    if (!basePokemonData) return null;

    const playerFormName = p.pokemonDisplay.formName?.toUpperCase() || '';

    // Priority 1: Check for regional forms
    if (basePokemonData.regionForms) {
        for (const regionFormKey in basePokemonData.regionForms) {
            if (playerFormName.includes(regionFormKey.replace(/_/g, ''))) {
                return basePokemonData.regionForms[regionFormKey];
            }
        }
    }

    // Fallback to standard forms
    const allFormsForPokemon = pokedex[p.pokemonId];
    const normalEntry = allFormsForPokemon['NORMAL'] || basePokemonData;

    if (!playerFormName || playerFormName === 'UNSET' || playerFormName.includes('NORMAL')) {
        return normalEntry;
    }

    const normalizedPlayerForm = playerFormName.replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');

    for (const formKey in allFormsForPokemon) {
        const pokedexForm = allFormsForPokemon[formKey];
        const normalizedPokedexForm = formKey.toUpperCase().replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');

        if (normalizedPlayerForm.includes(normalizedPokedexForm)) {
            return pokedexForm;
        }
    }

    return normalEntry;
}

// Calculates CP and Stat Product for a specific IV set and Level (CPM)
function calculateStats(baseStats, ivs, cpm) {
    const realAtk = (baseStats.attack + ivs.atk) * cpm;
    const realDef = (baseStats.defense + ivs.def) * cpm;
    // Revert to Floored HP (Game Accurate). 
    // This allows 15/15/14 to tie with 15/15/15 in stats (Functional Hundo), 
    // so the CP tie-breaker can place it at Rank 2.
    const realHp = Math.floor((baseStats.stamina + ivs.sta) * cpm);
    
    const cp = Math.max(10, Math.floor(
        (baseStats.attack + ivs.atk) * 
        Math.sqrt(baseStats.defense + ivs.def) * 
        Math.sqrt(baseStats.stamina + ivs.sta) * 
        (cpm * cpm) / 10
    ));

    const statProduct = realAtk * realDef * realHp;

    return { cp, statProduct, cpm };
}

// Generates the full Rank Table (4096 combinations) for a Species
function generateRankTable(entry) {
    const baseStats = entry.stats;
    const ranks = {
        great: [],
        ultra: [],
        master: [] // Added Master League
    };

    // Enforce Level 20 Floor for Legendaries/Mythicals
    // This aligns with standard availability (Raids/GBL Rewards) and filters out "impossible" low-level ranks
    const minLevel = (entry.pokemonClass === 'POKEMON_CLASS_LEGENDARY' || entry.pokemonClass === 'POKEMON_CLASS_MYTHIC') ? 20 : 1;

    // Generate all 4096 IV combinations (0-15)
    for (let atk = 0; atk <= 15; atk++) {
        for (let def = 0; def <= 15; def++) {
            for (let sta = 0; sta <= 15; sta++) {
                const ivs = { atk, def, sta };
                
                // Calculate for Great League (Cap 1500)
                const glStats = findOptimalStats(baseStats, ivs, LEAGUES.GREAT, sortedLevels, minLevel);
                // Only add to rank list if it actually fits under the cap at minLevel
                if (glStats.cp <= LEAGUES.GREAT) {
                    ranks.great.push({ ivs: `${atk}/${def}/${sta}`, ...glStats });
                }

                // Calculate for Ultra League (Cap 2500)
                const ulStats = findOptimalStats(baseStats, ivs, LEAGUES.ULTRA, sortedLevels, minLevel);
                if (ulStats.cp <= LEAGUES.ULTRA) {
                    ranks.ultra.push({ ivs: `${atk}/${def}/${sta}`, ...ulStats });
                }

                // Calculate for Master League (No Cap)
                const mlStats = findOptimalStats(baseStats, ivs, LEAGUES.MASTER, sortedLevels, minLevel);
                ranks.master.push({ ivs: `${atk}/${def}/${sta}`, ...mlStats });
            }
        }
    }

    // Sort by Stat Product (Descending) to determine Rank
    // Tie-breaker: If Stat Product is equal, Higher CP wins (standard PvP rule)
    const sortFn = (a, b) => {
        if (b.statProduct !== a.statProduct) {
            return b.statProduct - a.statProduct;
        }
        return b.cp - a.cp;
    };

    ranks.great.sort(sortFn);
    ranks.ultra.sort(sortFn);
    ranks.master.sort(sortFn);

    return ranks;
}

// Finds the optimal Level (CPM) for a given IV set under a CP cap
function findOptimalStats(baseStats, ivs, cap, sortedLevels, minLevel = 1) {
    let best = { cp: 0, statProduct: 0, level: 0 };

    for (const [level, cpm] of sortedLevels) {
        if (level < minLevel) continue; // Skip levels below floor (e.g. 20 for Legendaries)

        const stats = calculateStats(baseStats, ivs, cpm);
        if (stats.cp <= cap) {
            // Optimization: Since we iterate levels low -> high, 
            // and Stat Product generally increases with Level,
            // we can just keep updating 'best' as long as we are under the cap.
            // However, due to flooring rounding quirks, sometimes a slightly lower level *could* theoretically be better (rare),
            // but usually higher level = higher stats.
            if (stats.statProduct >= best.statProduct) {
                 best = { ...stats, level: level };
            }
        }
    }
    return best;
}

// --- Main Worker Logic ---
self.onmessage = function(e) {
    const { pokemons, pokedex } = e.data;
    const results = {}; // Map: pokemonInstanceId -> { rankGreat, rankUltra }
    const speciesCache = {}; // Map: speciesKey -> { great: [sorted], ultra: [sorted] }

    console.log(`Worker: Starting PvP calculation for ${pokemons.length} Pokémon...`);
    const start = performance.now();

    const total = pokemons.length;
    let processedCount = 0;
    let lastReportedProgress = -1;

    pokemons.forEach(p => {
        processedCount++;
        // Report progress every 1% change
        const currentProgress = Math.floor((processedCount / total) * 100);
        // if (processedCount % 100 === 0) {
        //     console.log(`Worker Progress: ${processedCount} / ${total} (${currentProgress}%)`);
        // }

        if (currentProgress > lastReportedProgress) {
            self.postMessage({ type: 'progress', value: currentProgress });
            lastReportedProgress = currentProgress;
        }

        const entry = getPokedexEntry(p, pokedex);
        if (!entry || !entry.stats) return;

        // Create a unique key for this Species (DexNr + Form)
        // We use the entry's ID/FormID to ensure we group correctly
        const speciesKey = `${entry.dexNr}-${entry.formId}`;

        // If not cached, generate the Rank Table for this species
        if (!speciesCache[speciesKey]) {
            speciesCache[speciesKey] = generateRankTable(entry);
        }

        const rankTables = speciesCache[speciesKey];
        const ivKey = `${p.individualAttack}/${p.individualDefense}/${p.individualStamina}`;

        // Helper to calculate Rank based on "Count strictly greater"
        // Handles ties by checking CP (higher CP = better rank if stats are equal)
        const getRank = (list, myStatProduct, myCp) => {
            // List is sorted by Product Desc, then CP Desc.
            // We want to find the index of the first item that is NOT "strictly better" than me.
            // "Strictly Better" means (Product > MyProduct) OR (Product == MyProduct AND CP > MyCP).
            
            const firstNotBetter = list.findIndex(r => {
                if (r.statProduct > myStatProduct) return false; // Better
                if (r.statProduct === myStatProduct && r.cp > myCp) return false; // Better
                return true; // Found someone equal or worse
            });
            
            return firstNotBetter === -1 ? list.length + 1 : firstNotBetter + 1;
        };

        // Find Rank in Great League List
        // We search for our specific IVs to ensure we exist in the list (valid CP)
        const glEntry = rankTables.great.find(r => r.ivs === ivKey);
        const glRank = glEntry ? getRank(rankTables.great, glEntry.statProduct, glEntry.cp) : null;
        const glPercent = glEntry ? (glEntry.statProduct / rankTables.great[0].statProduct) * 100 : 0;

        // Find Rank in Ultra League List
        const ulEntry = rankTables.ultra.find(r => r.ivs === ivKey);
        const ulRank = ulEntry ? getRank(rankTables.ultra, ulEntry.statProduct, ulEntry.cp) : null;
        const ulPercent = ulEntry ? (ulEntry.statProduct / rankTables.ultra[0].statProduct) * 100 : 0;

        // Find Rank in Master League List
        const mlEntry = rankTables.master.find(r => r.ivs === ivKey);
        const mlRank = mlEntry ? getRank(rankTables.master, mlEntry.statProduct, mlEntry.cp) : null;
        const mlPercent = mlEntry ? (mlEntry.statProduct / rankTables.master[0].statProduct) * 100 : 0;

        // CP Eligibility Check
        const isGlEligible = p.cp <= 1500;
        const isUlEligible = p.cp <= 2500;

        results[p.id] = {
            rankGreat: isGlEligible ? glRank : null,
            rankGreatPercent: isGlEligible ? glPercent : null,
            rankUltra: isUlEligible ? ulRank : null,
            rankUltraPercent: isUlEligible ? ulPercent : null,
            rankMaster: mlRank,
            rankMasterPercent: mlPercent
        };
    });

    const end = performance.now();
    console.log(`Worker: PvP calculation finished in ${(end - start).toFixed(2)}ms.`);

    // Send results back to main thread
    self.postMessage({ type: 'result', data: results });
};