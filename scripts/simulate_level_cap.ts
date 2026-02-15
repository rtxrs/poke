// @ts-nocheck
const CPM_TABLE = {
    "1": 0.094, "1.5": 0.1351374318, "2": 0.16639787, "2.5": 0.192650919, "3": 0.21573247, "3.5": 0.2365726613, "4": 0.25572005, "4.5": 0.2735303812, "5": 0.29024988, "5.5": 0.3060573775, "6": 0.3210876, "6.5": 0.3354450362, "7": 0.34921268, "7.5": 0.3624577511, "8": 0.3752356, "8.5": 0.387592416, "9": 0.39956728, "9.5": 0.4111935514, "10": 0.4225, "10.5": 0.4329264091, "11": 0.44310755, "11.5": 0.4530599591, "12": 0.4627984, "12.5": 0.472336093, "13": 0.48168495, "13.5": 0.4908558003, "14": 0.49985844, "14.5": 0.508701765, "15": 0.51739395, "15.5": 0.5259425113, "16": 0.5343543, "16.5": 0.5426357375, "17": 0.5507927, "17.5": 0.5588305862, "18": 0.5667545, "18.5": 0.5745691333, "19": 0.5822789, "19.5": 0.5898879072, "20": 0.5974, "20.5": 0.6048236651, "21": 0.6121573, "21.5": 0.6194041216, "22": 0.6265671, "22.5": 0.6336491432, "23": 0.64065295, "23.5": 0.6475809666, "24": 0.65443563, "24.5": 0.6612192524, "25": 0.667934, "25.5": 0.6745818959, "26": 0.6811649, "26.5": 0.6876849038, "27": 0.69414365, "27.5": 0.70054287, "28": 0.7068842, "28.5": 0.7131691091, "29": 0.7193991, "29.5": 0.7255756136, "30": 0.7317, "30.5": 0.7377694897, "31": 0.7437366, "31.5": 0.749609799, "32": 0.7553897, "32.5": 0.761080073, "33": 0.7666845, "33.5": 0.772199568, "34": 0.7776309, "34.5": 0.782983635, "35": 0.7882599, "35.5": 0.793460966, "36": 0.7985881, "36.5": 0.803645071, "37": 0.8086304, "37.5": 0.813544863, "38": 0.8183946, "38.5": 0.823179625, "39": 0.7846369743347168, "39.5": 0.7874736085132754, "40": 0.7903000116348267, "40.5": 0.792803968023538, 41: 0.7953000068664551, 41.5: 0.7978038983716224, 42: 0.8003000020980835, 42.5: 0.8028038718775964, 43: 0.8052999973297119, 43.5: 0.8078038508470536, 44: 0.8102999925613403, 44.5: 0.812803835179168, 45: 0.8152999877929688, 45.5: 0.8178037928037928, 46: 0.8203000020980835, 46.5: 0.822803776019539, 47: 0.825300009250640, 47.5: 0.827803755931569, 48: 0.830300023555755, 48.5: 0.832803729034748, 49: 0.835300018787384, 49.5: 0.837803755931569, 50: 0.840300023555755, 50.5: 0.842803729034748, 51: 0.845300018787384
};

// Aggron Base Stats
const BASE_STATS = { attack: 198, defense: 257, stamina: 172 };

// Helper to calculate CP at a specific level/IV
function getCP(ivs, cpm) {
    return Math.max(10, Math.floor(
        (BASE_STATS.attack + ivs.atk) * 
        Math.sqrt(BASE_STATS.defense + ivs.def) * 
        Math.sqrt(BASE_STATS.stamina + ivs.sta) * 
        (cpm * cpm) / 10
    ));
}

// Helper to calculate Stat Product
function getStatProduct(ivs, cpm) {
    const realAtk = (BASE_STATS.attack + ivs.atk) * cpm;
    const realDef = (BASE_STATS.defense + ivs.def) * cpm;
    const realHp = Math.floor((BASE_STATS.stamina + ivs.sta) * cpm);
    return realAtk * realDef * realHp;
}

let maxLevelFound = 0;
let results = [];

// Iterate all 4096 IV combinations
for (let atk = 0; atk <= 15; atk++) {
    for (let def = 0; def <= 15; def++) {
        for (let sta = 0; sta <= 15; sta++) {
            const ivs = { atk, def, sta };
            
            // Find max level < 1500 CP for this IV set
            let bestLevel = 0;
            let bestCpm = 0;
            let finalCp = 0;

            // Simple linear search through levels
            for (const [lvlStr, cpm] of Object.entries(CPM_TABLE)) {
                const level = parseFloat(lvlStr);
                const cp = getCP(ivs, cpm);
                if (cp <= 1500) {
                    if (level > bestLevel) {
                        bestLevel = level;
                        bestCpm = cpm;
                        finalCp = cp;
                    }
                }
            }

            if (bestLevel > 0) {
                results.push({
                    ivs: `${atk}/${def}/${sta}`,
                    level: bestLevel,
                    cpm: bestCpm,
                    cp: finalCp,
                    statProduct: getStatProduct(ivs, bestCpm)
                });

                if (bestLevel > maxLevelFound) {
                    maxLevelFound = bestLevel;
                }
            }
        }
    }
}

// Sort by Level Descending, then Stat Product Descending
results.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.statProduct - a.statProduct;
});

console.log(`--- HIGHEST LEVEL AGGRONS (< 1500 CP) ---`);
console.log(`Found ${results.length} valid combinations.`);
console.log(`Highest Level Achieved: ${maxLevelFound}`);

// Show top 5 Highest Level
console.log(`\nTop 5 by Level:`);
results.slice(0, 5).forEach((r, i) => {
    console.log(`#${i+1}: IVs ${r.ivs} | Lvl ${r.level} | CP ${r.cp} | Product ${Math.round(r.statProduct).toLocaleString()}`);
});

// Show comparisons
const pvpRank1 = results.reduce((prev, current) => (prev.statProduct > current.statProduct) ? prev : current);
const perfect = results.find(r => r.ivs === "15/15/15");
const highestLevel = results[0];

console.log(`\n--- COMPARISON ---`);
console.log(`Highest Level Found:   IVs ${highestLevel.ivs}  @ Lvl ${highestLevel.level}`);
console.log(`PvP Rank #1 (Product): IVs ${pvpRank1.ivs}  @ Lvl ${pvpRank1.level}`);
console.log(`Perfect IV (15/15/15): IVs ${perfect.ivs} @ Lvl ${perfect.level}`);

if (highestLevel.ivs === pvpRank1.ivs) {
    console.log(`\n✅ The Highest Level Pokémon IS ALSO the Rank #1 PvP Pokémon.`);
} else {
    console.log(`\n❌ The Highest Level Pokémon IS NOT the Rank #1 PvP Pokémon.`);
    console.log(`Explanation: Sometimes extremely low IVs (0/0/0) allow for the highest level,`);
    console.log(`but their base stats are too low to benefit from it compared to 0/15/15.`);
}
