const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/user/generated/pvp_ranks.json');

let ranksCache = null;

async function init() {
    console.log('Initializing PvP Service (Loading JSON)...');
    try {
        if (fs.existsSync(DATA_PATH)) {
            const data = await fs.promises.readFile(DATA_PATH, 'utf-8');
            ranksCache = JSON.parse(data);
            console.log(`PvP Ranks loaded. Species count: ${Object.keys(ranksCache).length}`);
        } else {
            console.warn('PvP Ranks file not found at ' + DATA_PATH);
            ranksCache = {};
        }
    } catch (e) {
        console.error('Failed to load PvP ranks:', e);
        ranksCache = {};
    }
}

function getRank(pokemonId, form, league, ivAttack, ivDefense, ivStamina) {
    if (!ranksCache) return null;
    
    const species = ranksCache[pokemonId];
    if (!species) return null;

    // Handle form fallback logic matching the generator
    // Generator keys are specific forms. 
    // If 'NORMAL' is requested but not found, try to find a default? 
    // Usually 'NORMAL' is the default key.
    let formRanks = species[form];
    if (!formRanks && form === 'NORMAL') {
        // If NORMAL missing, maybe keys are like "BULBASAUR" (for base)? 
        // Actually generator uses formKey = formId || 'NORMAL'.
        // So species["NORMAL"] should exist for base forms.
    }
    
    if (!formRanks) return null;

    let list = null;
    const l = league.toLowerCase();
    if (l === 'great') list = formRanks.gl;
    else if (l === 'ultra') list = formRanks.ul;
    else if (l === 'master') list = formRanks.ml;

    if (!list) return null;

    const ivKey = (ivAttack << 8) | (ivDefense << 4) | ivStamina;
    const index = list.indexOf(ivKey);
    
    if (index === -1) return null;

    return {
        rank: index + 1
    };
}

// Placeholder for compatibility if needed, though not used in current API for single lookups
function getRanks(pokemonId, form, league, limit = 100) {
    return [];
}

// Placeholder for server.js check (though we will update server.js)
function getRowCount() {
    return ranksCache ? Object.keys(ranksCache).length : 0;
}

async function reload() {
    console.log('Reloading PvP Service...');
    await init();
}

module.exports = {
    init,
    reload,
    getRank,
    getRanks,
    getRowCount
};