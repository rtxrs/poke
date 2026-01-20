const fs = require('fs');
const path = require('path');
const pvpService = require('../services/pvpService');

const POKEDEX_PATH = path.join(__dirname, '../data/user/pokedex_modified.json');

// --- Constants ---
const CPM_TABLE = {
    "1": 0.094, "1.5": 0.1351374318, "2": 0.16639787, "2.5": 0.192650919, "3": 0.21573247, "3.5": 0.2365726613, "4": 0.25572005, "4.5": 0.2735303812, "5": 0.29024988, "5.5": 0.3060573775, "6": 0.3210876, "6.5": 0.3354450362, "7": 0.34921268, "7.5": 0.3624577511, "8": 0.3752356, "8.5": 0.387592416, "9": 0.39956728, "9.5": 0.4111935514, "10": 0.4225, "10.5": 0.4329264091, "11": 0.44310755, "11.5": 0.4530599591, "12": 0.4627984, "12.5": 0.472336093, "13": 0.48168495, "13.5": 0.4908558003, "14": 0.49985844, "14.5": 0.508701765, "15": 0.51739395, "15.5": 0.5259425113, "16": 0.5343543, "16.5": 0.5426357375, "17": 0.5507927, "17.5": 0.5588305862, "18": 0.5667545, "18.5": 0.5745691333, "19": 0.5822789, "19.5": 0.5898879072, "20": 0.5974, "20.5": 0.6048236651, "21": 0.6121573, "21.5": 0.6194041216, "22": 0.6265671, "22.5": 0.6336491432, "23": 0.64065295, "23.5": 0.6475809666, "24": 0.65443563, "24.5": 0.6612192524, "25": 0.667934, "25.5": 0.6745818959, "26": 0.6811649, "26.5": 0.6876849038, "27": 0.69414365, "27.5": 0.70054287, "28": 0.7068842, "28.5": 0.7131691091, "29": 0.7193991, "29.5": 0.7255756136, "30": 0.7317, "30.5": 0.7377694897, "31": 0.7437366, "31.5": 0.749609799, "32": 0.7553897, "32.5": 0.761080073, "33": 0.7666845, "33.5": 0.772199568, "34": 0.7776309, "34.5": 0.782983635, "35": 0.7882599, "35.5": 0.793460966, "36": 0.7985881, "36.5": 0.803645071, "37": 0.8086304, "37.5": 0.813544863, "38": 0.8183946, "38.5": 0.823179625, "39": 0.7846369743347168, "39.5": 0.7874736085132754, "40": 0.7903000116348267, "40.5": 0.792803968023538, "41": 0.7953000068664551, "41.5": 0.7978038983716224, "42": 0.8003000020980835, "42.5": 0.8028038718775964, "43": 0.8052999973297119, "43.5": 0.8078038508470536, "44": 0.8102999925613403, "44.5": 0.812803835179168, "45": 0.8152999877929688, "45.5": 0.8178037928037928, "46": 0.8203000020980835, "46.5": 0.822803776019539, "47": 0.825300009250640, "47.5": 0.827803755931569, "48": 0.830300023555755, "48.5": 0.832803729034748, "49": 0.835300011634827, "49.5": 0.837803721427917, "50": 0.840299994945526
};

const SORTED_LEVELS = Object.entries(CPM_TABLE)
    .map(([lvl, cpm]) => [parseFloat(lvl), cpm])
    .filter(([lvl]) => lvl <= 50)
    .sort((a, b) => a[0] - b[0]);

const LEAGUES = {
    great: 1500,
    ultra: 2500,
    master: 10000
};

function calculateStats(baseStats, ivs, cpm) {
    const realAtk = (baseStats.attack + ivs.atk) * cpm;
    const realDef = (baseStats.defense + ivs.def) * cpm;
    const realHp = Math.floor((baseStats.stamina + ivs.sta) * cpm);
    
    const cp = Math.max(10, Math.floor(
        (baseStats.attack + ivs.atk) * 
        Math.sqrt(baseStats.defense + ivs.def) * 
        Math.sqrt(baseStats.stamina + ivs.sta) * 
        (cpm * cpm) / 10
    ));

    const statProduct = realAtk * realDef * realHp;

    return { cp, statProduct };
}

function findOptimalStats(baseStats, ivs, cap) {
    let best = { cp: 0, statProduct: 0, level: 0 };

    for (const [level, cpm] of SORTED_LEVELS) {
        const stats = calculateStats(baseStats, ivs, cpm);
        if (stats.cp <= cap) {
            if (stats.statProduct > best.statProduct) {
                best = { ...stats, level };
            }
        }
    }
    return best;
}

function generateRankList(pokemonId, form, baseStats, leagueName, cap) {
    const combinations = [];
    
    for (let atk = 0; atk <= 15; atk++) {
        for (let def = 0; def <= 15; def++) {
            for (let sta = 0; sta <= 15; sta++) {
                const ivs = { atk, def, sta };
                const result = findOptimalStats(baseStats, ivs, cap);
                
                if (result.cp > 0) {
                     combinations.push({ 
                        pokemon_id: pokemonId,
                        form: form,
                        league: leagueName,
                        iv_attack: atk,
                        iv_defense: def,
                        iv_stamina: sta,
                        level: result.level,
                        cp: result.cp,
                        stat_product: result.statProduct
                     });
                }
            }
        }
    }

    // Sort by Stat Product DESC, then CP DESC
    combinations.sort((a, b) => {
        if (b.stat_product !== a.stat_product) return b.stat_product - a.stat_product;
        return b.cp - a.cp;
    });

    const rank1Product = combinations[0].stat_product;

    // Assign ranks and percentages
    return combinations.map((c, index) => ({
        ...c,
        rank: index + 1,
        percentage: (c.stat_product / rank1Product) * 100
    }));
}

function main() {
    console.log("Loading Pokedex...");
    pvpService.init();

    try {
        const pokedex = JSON.parse(fs.readFileSync(POKEDEX_PATH, 'utf8'));
        
        console.log("Generating PvP Ranks (Database Mode)...");
        let count = 0;
        const total = pokedex.length;
        const processedIds = new Set();

        // Use a transaction buffer to speed up inserts
        let batchBuffer = [];
        const BATCH_SIZE = 2000;

        const processEntry = (entry, formOverride = null) => {
            if (!entry || !entry.stats) return; 
            
            const formKey = formOverride || entry.formId || 'NORMAL';
            
            try {
                // We only store Top 200 ranks to save space/time, unless you want all 4096.
                // For a database, 4096 rows per pokemon per league is A LOT (4096 * 3 * 1000 = 12 million rows)
                // Let's store Top 4096 for now as requested by "all combinations", 
                // but usually Top 100-500 is enough for most apps.
                // The user asked for "Option 2" which implies calculating all, 
                // but "Algorithmic Pruning" was another option.
                // I will store ALL ranks because the user mentioned "This specific 10/10/10 IV is Rank #2405".
                
                for (const [leagueName, cap] of Object.entries(LEAGUES)) {
                    const ranks = generateRankList(entry.id, formKey, entry.stats, leagueName, cap);
                    
                    batchBuffer.push(...ranks);

                    if (batchBuffer.length >= BATCH_SIZE) {
                        pvpService.insertMany(batchBuffer);
                        batchBuffer = [];
                    }
                }

            } catch (e) {
                 console.error(`Error processing ${entry.id} ${formKey}:`, e);
            }
        };

        pokedex.forEach((speciesData) => {
            count++;
            if (count % 10 === 0) console.log(`Processing ${count}/${total} - ${speciesData.id}`);
            
            if (processedIds.has(speciesData.id)) return; 
            
            // 1. Process the base entry
            processEntry(speciesData);

            // 2. Process regionForms
            if (speciesData.regionForms) {
                Object.values(speciesData.regionForms).forEach(form => processEntry(form));
            }

            // 3. Process megaEvolutions
            if (speciesData.megaEvolutions) {
                Object.values(speciesData.megaEvolutions).forEach(mega => processEntry(mega));
            }

            processedIds.add(speciesData.id);
        });

        // Insert remaining
        if (batchBuffer.length > 0) {
            pvpService.insertMany(batchBuffer);
        }

        console.log(`Done! PvP Ranks stored in SQLite DB.`);

    } catch (error) {
        console.error("Error:", error.message);
        console.error(error.stack);
    }
}

main();
