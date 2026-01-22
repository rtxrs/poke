/**
 * This script contains the complete Vue.js application logic for the private dashboard.
 */

const { createApp, ref, computed, onMounted, watch, watchEffect, nextTick } = Vue;

function stringToHslColor(str, s, l) {
    if (!str) return `hsl(0, 0%, 80%)`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function generateGradient(id) {
    if (!id) return 'background: #eee;';
    const color1 = stringToHslColor(id, 80, 75);
    const color2 = stringToHslColor(id.split('').reverse().join(''), 90, 70);
    const color3 = stringToHslColor(id + '-v2', 70, 80);
    return `background: linear-gradient(135deg, ${color1}, ${color2}, ${color3});`;
}

// --- CPM Table for Level Calculation ---
const cpmTable = {
    1: 0.094, 1.5: 0.1351374318, 2: 0.16639787, 2.5: 0.192650919, 3: 0.21573247, 3.5: 0.2365726613, 4: 0.25572005, 4.5: 0.2735303812, 5: 0.29024988, 5.5: 0.3060573775, 6: 0.3210876, 6.5: 0.3354450362, 7: 0.34921268, 7.5: 0.3624577511, 8: 0.3752356, 8.5: 0.387592416, 9: 0.39956728, 9.5: 0.4111935514, 10: 0.4225, 10.5: 0.4329264091, 11: 0.44310755, 11.5: 0.4530599591, 12: 0.4627984, 12.5: 0.472336093, 13: 0.48168495, 13.5: 0.4908558003, 14: 0.49985844, 14.5: 0.508701765, 15: 0.51739395, 15.5: 0.5259425113, 16: 0.5343543, 16.5: 0.5426357375, 17: 0.5507927, 17.5: 0.5588305862, 18: 0.5667545, 18.5: 0.5745691333, 19: 0.5822789, 19.5: 0.5898879072, 20: 0.5974, 20.5: 0.6048236651, 21: 0.6121573, 21.5: 0.6194041216, 22: 0.6265671, 22.5: 0.6336491432, 23: 0.64065295, 23.5: 0.6475809666, 24: 0.65443563, 24.5: 0.6612192524, 25: 0.667934, 25.5: 0.6745818959, 26: 0.6811649, 26.5: 0.6876849038, 27: 0.69414365, 27.5: 0.70054287, 28: 0.7068842, 28.5: 0.7131691091, 29: 0.7193991, 29.5: 0.7255756136, 30: 0.7317, 30.5: 0.7377694897, 31: 0.7437366, 31.5: 0.749609799, 32: 0.7553897, 32.5: 0.761080073, 33: 0.7666845, 33.5: 0.772199568, 34: 0.7776309, 34.5: 0.782983635, 35: 0.7882599, 35.5: 0.793460966, 36: 0.7985881, 36.5: 0.803645071, 37: 0.8086304, 37.5: 0.813544863, 38: 0.8183946, 38.5: 0.823179625, 39: 0.7846369743347168, 39.5: 0.7874736085132754, 40: 0.7903000116348267, 40.5: 0.792803968023538, 41: 0.7953000068664551, 41.5: 0.7978038983716224, 42: 0.8003000020980835, 42.5: 0.8028038718775964, 43: 0.8052999973297119, 43.5: 0.8078038508470536, 44: 0.8102999925613403, 44.5: 0.812803835179168, 45: 0.8152999877929688, 45.5: 0.8178037928037928, 46: 0.8203000020980835, 46.5: 0.822803776019539, 47: 0.825300009250640, 47.5: 0.827803755931569, 48: 0.830300023555755, 48.5: 0.832803729034748, 49: 0.835300018787384, 49.5: 0.837803755931569, 50: 0.840300023555755, 50.5: 0.842803729034748, 51: 0.845300018787384, 51.5: 0.847803702398935, 52: 0.850300014019012, 52.5: 0.852803676019539, 53: 0.855300009250640, 53.5: 0.857803649892077, 54: 0.860300004482269, 54.5: 0.862803624012168, 55: 0.865299999713897
};
function getLevelFromCpm(cpm) {
    let closestLevel = null;
    let minDifference = Infinity;
    for (const level in cpmTable) {
        const difference = Math.abs(cpmTable[level] - cpm);
        if (difference < minDifference) {
            minDifference = difference;
            closestLevel = level;
        }
    }
    return closestLevel;
}

// --- Global Helper Functions ---

/**
 * Creates the background style (solid color or gradient) for a Pokémon card.
 * @param {string[]} colors - An array of hex color codes.
 * @returns {string} The inline CSS style string.
 */
function createBackgroundStyle(colors) {
    if (!colors || colors.length === 0) return '';
    const backgroundValue = colors.length === 1 
        ? colors[0]
        : `linear-gradient(135deg, ${colors[0]} 30%, ${colors[1]} 70%)`;
    return `--pokemon-bg: ${backgroundValue};`;
}

/**
 * Gets the correct color for an IV bar based on the percentage.
 * @param {number} iv - The IV percentage.
 * @returns {string} The hex color code.
 */
function getIvColor(iv) {
    if (iv >= 100) return '#ff8000';
    if (iv >= 80) return '#2196f3';
    if (iv >= 60) return '#4caf50';
    return '#6c757d';
}

const getMoveTypeIconUrl = (type) => {
    if (!type) return '';
    return `https://leekduck.com/assets/img/types/${type.toLowerCase()}.png`;
};

/**
 * Calculates the IV percentage of a Pokemon.
 * @param {Object} p - The Pokemon object.
 * @returns {string} The IV percentage fixed to 1 decimal place.
 */
function getIvPercent(p) { 
    return p ? ((p.individualAttack + p.individualDefense + p.individualStamina) / 45 * 100).toFixed(1) : 0; 
}

/**
 * Calculates the IV percentage of a Pokemon as a number.
 * @param {Object} p - The Pokemon object.
 * @returns {number} The IV percentage.
 */
function getIvPercentAsNumber(p) { 
    return p ? ((p.individualAttack + p.individualDefense + p.individualStamina) / 45 * 100) : 0; 
}

/**
 * Returns the CSS class for a Pokemon card.
 * @param {Object} p - The Pokemon object.
 * @returns {string} The CSS class name.
 */
function getCardClass(p) { 
    return 'pokemon-card'; 
}

/**
 * Generates the HTML badges string for a Pokemon card.
 * @param {Object} p - The Pokemon object.
 * @param {string} name - The display name of the Pokemon.
 * @param {boolean} limitRank - Whether to limit PvP badges to top 100.
 * @returns {string} The HTML string containing the name and badges.
 */
function getBadges(p, name, limitRank = true) {
    const badges = [];
    if (!p || !p.pokemonDisplay) return name;

    if (p.pokemonDisplay.isStrongPokemon) badges.push('<span class="badge mighty-badge">Mighty</span>');
    if (p.pokemonDisplay.shiny) badges.push('<span class="badge shiny-badge">Shiny</span>');
    if (p.isLucky) {
        badges.push('<span class="badge lucky-badge">Lucky</span>');
    }
    else if (p.tradedTimeMs > 0) {
        badges.push('<span class="badge traded-badge">Traded</span>');
    }
    
    const ivPercent = getIvPercent(p);
    if (p.individualAttack === 0 && p.individualDefense === 0 && p.individualStamina === 0) {
        badges.push('<span class="badge zero-iv-badge">0 IV</span>');
    } else if (parseFloat(ivPercent) >= 100) {
        badges.push('<span class="badge perfect-badge">Perfect</span>');
    }

    if (p.pokemonDisplay.alignment === 1) badges.push('<span class="badge shadow-badge">Shadow</span>');
    if (p.pokemonDisplay.alignment === 2) badges.push('<span class="badge purified-badge">Purified</span>');

    if (p.pokemonClass === 'POKEMON_CLASS_LEGENDARY') badges.push('<span class="badge legendary-badge">Legendary</span>');
    if (p.pokemonClass === 'POKEMON_CLASS_MYTHIC') badges.push('<span class="badge mythical-badge">Mythical</span>');

    if (p.pokemonDisplay.breadModeEnum === 1) badges.push('<span class="badge dynamax-badge">Dynamax</span>');
    if (p.pokemonDisplay.breadModeEnum === 2) badges.push('<span class="badge gigantamax-badge">G-Max</span>');

    if (p.isMaxLevel) badges.push('<span class="badge max-level-badge">Lvl50</span>');

    if (p.pokemonDisplay.locationCard) {
        badges.push('<span class="badge background-badge">Background</span>');
    }

    // PvP Ranks as Markers
    if (p.rankGreat && p.cp <= 1500 && (!limitRank || p.rankGreat <= 100)) {
        let extraClass = '';
        if (p.rankGreat <= 10) extraClass = ' rank-1';
        else if (p.rankGreat <= 25) extraClass = ' rank-good';
        badges.push(`<span class="badge pvp-badge great${extraClass}" title="Great League Rank #${p.rankGreat}">#${p.rankGreat}</span>`);
    }
    if (p.rankUltra && p.cp <= 2500 && (!limitRank || p.rankUltra <= 100)) {
        let extraClass = '';
        if (p.rankUltra <= 10) extraClass = ' rank-1';
        else if (p.rankUltra <= 25) extraClass = ' rank-good';
        badges.push(`<span class="badge pvp-badge ultra${extraClass}" title="Ultra League Rank #${p.rankUltra}">#${p.rankUltra}</span>`);
    }
    if (p.rankMaster && (!limitRank || p.rankMaster <= 100)) {
        let extraClass = '';
        if (p.rankMaster <= 10) extraClass = ' rank-1';
        else if (p.rankMaster <= 25) extraClass = ' rank-good';
        badges.push(`<span class="badge pvp-badge master${extraClass}" title="Master League Rank #${p.rankMaster}">#${p.rankMaster}</span>`);
    }

    if (badges.length > 0) {
        return name ? `${name}<br>${badges.join(' ')}` : badges.join(' ');
    }
    return name;
}

/**
 * Evaluates a single search term against a Pokemon.
 */
function evaluateTerm(p, term, pokedexService, moveMap) {
    const isNegated = term.startsWith('!');
    const searchTerm = isNegated ? term.substring(1) : term;

    let match = false;

    if (searchTerm.startsWith('#')) {
        const tagName = searchTerm.substring(1).toLowerCase();
        if (tagName === 'mighty') {
            match = p.pokemonDisplay.isStrongPokemon;
        }
    } else if (searchTerm.startsWith('@')) {
        const moveSearch = searchTerm.substring(1).toLowerCase();
        const move1 = moveMap.value[p.move1]?.name.toLowerCase();
        const move2 = moveMap.value[p.move2]?.name.toLowerCase();
        const move3 = moveMap.value[p.move3]?.name.toLowerCase();
        if (move1 === moveSearch || move2 === moveSearch || move3 === moveSearch) {
            match = true;
        } else {
            const move1Type = moveMap.value[p.move1]?.type.toLowerCase();
            const move2Type = moveMap.value[p.move2]?.type.toLowerCase();
            const move3Type = moveMap.value[p.move3]?.type.toLowerCase();
            if (move1Type === moveSearch || move2Type === moveSearch || move3Type === moveSearch) {
                match = true;
            }
        }
    } else if (searchTerm.startsWith('+')) {
        const pokemonName = searchTerm.substring(1).toLowerCase();
        if (p.name.toLowerCase().includes(pokemonName)) {
            match = true;
        }
    } else if (searchTerm.match(/^(cp|hp)(\d+)-(\d*)$/)) {
        const parts = searchTerm.match(/^(cp|hp)(\d+)-(\d*)$/);
        const stat = parts[1];
        const min = Number(parts[2]);
        const max = parts[3] ? Number(parts[3]) : Infinity;
        const value = stat === 'cp' ? p.cp : p.stamina;
        if (value >= min && value <= max) match = true;
    } else if (searchTerm.match(/^(cp|hp)-(\d+)$/)) {
        const parts = searchTerm.match(/^(cp|hp)-(\d+)$/);
        const stat = parts[1];
        const max = Number(parts[2]);
        const value = stat === 'cp' ? p.cp : p.stamina;
        if (value <= max) match = true;
    } else if (searchTerm.match(/^\d\*$/)) {
        const stars = parseInt(searchTerm);
        const ivPercent = getIvPercentAsNumber(p);
        if (stars === 4 && ivPercent === 100) match = true;
        else if (stars === 3 && ivPercent >= 82.2 && ivPercent < 100) match = true;
        else if (stars === 2 && ivPercent >= 66.7 && ivPercent < 82.2) match = true;
        else if (stars === 1 && ivPercent >= 51.1 && ivPercent < 66.7) match = true;
        else if (stars === 0 && ivPercent < 51.1) match = true;
    } else if (searchTerm.match(/^\d+$/)) {
        if (p.pokemonId == searchTerm) match = true;
    } else {
        const types = (p.typeColors || []).map(color => {
            for (const type in pokedexService.value.typeColorMap) {
                if (pokedexService.value.typeColorMap[type] === color) return type.toLowerCase();
            }
        });

        if (types.includes(searchTerm)) match = true;
        else if ((p.name || '').toLowerCase().includes(searchTerm) || (p.nickname || '').toLowerCase().includes(searchTerm)) match = true;
        else if (searchTerm === 'shiny' && p.pokemonDisplay.shiny) match = true;
        else if (searchTerm === 'lucky' && p.isLucky) match = true;
        else if (searchTerm === 'perfect' && getIvPercentAsNumber(p) === 100) match = true;
        else if (searchTerm === 'nundo' && getIvPercentAsNumber(p) === 0) match = true;
        else if (searchTerm === 'shadow' && p.pokemonDisplay.alignment === 1) match = true;
        else if (searchTerm === 'purified' && p.pokemonDisplay.alignment === 2) match = true;
        else if (searchTerm === 'dynamax' && p.pokemonDisplay.breadModeEnum === 1) match = true;
        else if (searchTerm === 'gigantamax' && p.pokemonDisplay.breadModeEnum === 2) match = true;
        else if (searchTerm === 'legendary' && p.pokemonClass === 'POKEMON_CLASS_LEGENDARY') match = true;
        else if (searchTerm === 'mythical' && p.pokemonClass === 'POKEMON_CLASS_MYTHIC') match = true;
        else if (searchTerm === 'hatched' && p.hatchedFromEgg) match = true;
        else if (searchTerm === 'traded' && p.tradedTimeMs > 0) match = true;
        else if (searchTerm === 'favorite' && p.favorite) match = true;
        else if (searchTerm === 'background' && p.pokemonDisplay.locationCard) match = true;
        else if (searchTerm.startsWith('age')) {
            const age = parseInt(searchTerm.substring(3));
            const days = (Date.now() - p.creationTimeMs) / (1000 * 60 * 60 * 24);
            if (days <= age) match = true;
        }
        // PvP Search Terms
        else if (searchTerm.match(/^(gl|ul|ml)(\d+)$/)) {
            const parts = searchTerm.match(/^(gl|ul|ml)(\d+)$/);
            const league = parts[1]; // gl, ul, ml
            const rank = parseInt(parts[2]);
            
            if (league === 'gl' && p.rankGreat === rank) match = true;
            else if (league === 'ul' && p.rankUltra === rank) match = true;
            else if (league === 'ml' && p.rankMaster === rank) match = true;
        }
        else if (searchTerm.match(/^(gl|ul|ml)-(\d+)$/)) {
            const parts = searchTerm.match(/^(gl|ul|ml)-(\d+)$/);
            const league = parts[1];
            const maxRank = parseInt(parts[2]);

            if (league === 'gl' && p.rankGreat && p.rankGreat <= maxRank) match = true;
            else if (league === 'ul' && p.rankUltra && p.rankUltra <= maxRank) match = true;
            else if (league === 'ml' && p.rankMaster && p.rankMaster <= maxRank) match = true;
        }
        else if (searchTerm === 'pvp') {
            if ((p.rankGreat && p.rankGreat <= 100) || 
                (p.rankUltra && p.rankUltra <= 100) || 
                (p.rankMaster && p.rankMaster <= 100)) {
                match = true;
            }
        }
    }

    return isNegated ? !match : match;
}

/**
 * Filters a list of Pokemon based on a query string.
 */
function filterPokemon(pokemons, query, pokedexService, moveMap) {
    if (!query.trim()) {
        return pokemons;
    }

    const tokens = query.toLowerCase().match(/(\d+\*)|(!?#\w+(-\w*)*)|(!?@?\w+(-\w*)*)|(\d+-\d*)|(-\d+)|(\+?\w+)|([,&;:])|(\w+)/g) || [];

    const outputQueue = [];
    const operatorStack = [];
    const precedence = { '&': 2, ',': 1, ';': 1, ':': 1 };

    tokens.forEach(token => {
        if (token.match(/(\d+\*)|(!?#\w+(-\w*)*)|(!?@?\w+(-\w*)*)|(\d+-\d*)|(-\d+)|(\+?\w+)/)) {
            outputQueue.push(token);
        } else if (token === '&' || token === ',' || token === ';' || token === ':') {
            while (operatorStack.length > 0 && precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        }
    });

    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop());
    }

    return pokemons.filter(p => {
        const evaluationStack = [];
        outputQueue.forEach(token => {
            if (token === '&' || token === ',' || token === ';' || token === ':') {
                const right = evaluationStack.pop();
                const left = evaluationStack.pop();
                if (token === '&') {
                    evaluationStack.push(left && right);
                } else {
                    evaluationStack.push(left || right);
                }
            } else {
                evaluationStack.push(evaluateTerm(p, token, pokedexService, moveMap));
            }
        });
        return evaluationStack[0];
    });
}

// --- Vue Components ---

/**
 * A reusable grid component to display a list of Pokémon cards.
 */
const GridComponent = {
    props: ['pokemons'],
    emits: ['pokemon-clicked'],
    template: `
        <div id="all-pokemon-list">
            <div v-for="p in pokemons" :key="p.id" :class="getCardClass(p)" @click="$emit('pokemon-clicked', p)">
                <div class="pokemon-image-container" :style="createBackgroundStyle(p.typeColors)">
                    <img :src="p.sprite" :alt="displayName(p)" loading="lazy">
                </div>
                <p class="pokemon-name" v-html="getBadges(p, displayName(p))"></p>
                <p class="pokemon-cp">CP {{ p.cp }}</p>
                <p v-if="p.score" class="pokemon-score">{{ p.scoreLabel || 'Score' }}: {{ p.score.toFixed(2) }}</p>
                <div class="iv-bar-container">
                    <div class="iv-bar" :style="{ width: getIvPercent(p) + '%', backgroundColor: getIvColor(getIvPercent(p)) }"></div>
                </div>
                <small>{{ getIvPercent(p) }}% ({{ p.individualAttack }}/{{ p.individualDefense }}/{{ p.individualStamina }})</small>
            </div>
        </div>
    `,
    methods: {
        displayName(p) { return p.nickname || p.name; },
        // Expose global helpers to template
        getIvPercent,
        getBadges,
        getCardClass,
        createBackgroundStyle,
        getIvColor
    }
};

const RaidBossSelector = {
    props: ['raidBosses', 'selectedRaidBoss', 'createBackgroundStyle'],
    emits: ['boss-selected'],
    setup(props) {
        const groupedBosses = Vue.computed(() => {
            const groups = {};
            props.raidBosses.forEach(boss => {
                if (!groups[boss.level]) {
                    groups[boss.level] = [];
                }
                groups[boss.level].push(boss);
            });
            const groupOrder = ['mega', 'shadow_lvl5', 'lvl5', 'shadow_lvl3', 'lvl3', 'shadow_lvl1', 'lvl1'];
            const sortedGroups = {};
            groupOrder.forEach(level => {
                if (groups[level]) {
                    sortedGroups[level] = groups[level];
                }
            });
            return sortedGroups;
        });

        const getBossImage = (boss) => {
            if (boss.assets && boss.assets.image) {
                return boss.assets.image;
            }
            return 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_000.png';
        };

        return {
            groupedBosses,
            getBossImage
        };
    },
    template: `
        <div class="raid-boss-selector">
            <div v-for="(bosses, level) in groupedBosses" :key="level" class="raid-boss-group">
                <h3 class="raid-boss-level-title">{{ level.replace('_', ' ').toUpperCase() }}</h3>
                <div class="raid-boss-icons">
                    <div v-for="boss in bosses" :key="boss.id"
                         class="pokemon-image-container"
                         :class="{ selected: boss.id === selectedRaidBoss }"
                         :style="createBackgroundStyle(boss.typeColors)"
                         @click="$emit('boss-selected', boss.id)">
                        <img :src="getBossImage(boss)" :alt="boss.names.English">
                    </div>
                </div>
            </div>
        </div>
    `
};

const MaxBossSelector = {
    props: ['maxBattles', 'selectedMaxBoss', 'createBackgroundStyle'],
    emits: ['boss-selected'],
    setup(props) {
        const groupedBosses = Vue.computed(() => {
            const groups = {};
            props.maxBattles.forEach(boss => {
                if (!groups[boss.level]) {
                    groups[boss.level] = [];
                }
                groups[boss.level].push(boss);
            });
            // Sort keys descending: tier3 -> tier2 -> tier1
            const sortedKeys = Object.keys(groups).sort().reverse();
            const sortedGroups = {};
            sortedKeys.forEach(key => sortedGroups[key] = groups[key]);
            return sortedGroups;
        });

        const getBossImage = (boss) => {
            if (boss.assets && boss.assets.image) {
                return boss.assets.image;
            }
            return 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_000.png';
        };

        return {
            groupedBosses,
            getBossImage
        };
    },
    template: `
        <div class="raid-boss-selector">
            <div v-for="(bosses, level) in groupedBosses" :key="level" class="raid-boss-group">
                <h3 class="raid-boss-level-title">{{ level.replace('tier', 'TIER ') }}</h3>
                <div class="raid-boss-icons">
                    <div v-for="boss in bosses" :key="boss.id"
                         class="pokemon-image-container"
                         :class="{ selected: boss.id === selectedMaxBoss }"
                         :style="createBackgroundStyle(boss.typeColors)"
                         @click="$emit('boss-selected', boss.id)">
                        <img :src="getBossImage(boss)" :alt="boss.names.English">
                    </div>
                </div>
            </div>
        </div>
    `
};

// --- Main Vue App Instance ---
createApp({
    components: {
        'grid-component': GridComponent,
        'raid-boss-selector': RaidBossSelector,
        'max-boss-selector': MaxBossSelector
    },
    setup() {
        // --- Reactive State ---
        const loading = ref(true);
        const allPokemons = ref([]);
        const account = ref({});
        const player = ref({});
        const items = ref([]);
        const pokedexService = ref({ typeColorMap: {}, pokedex: null });
        const activeTab = ref('character'); // New state for active tab
        const searchQuery = ref('');
        const debouncedSearchQuery = ref('');
        let searchTimeout = null;

        watch(searchQuery, (newVal) => {
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                debouncedSearchQuery.value = newVal;
            }, 150); // 150ms debounce
        });

        const sortKey = ref('caughtTime');
        const itemsExpanded = ref(false);
        const defaultSortDirections = { caughtTime: 'desc', cp: 'desc', pokedex: 'asc', name: 'asc' };
        const sortDirection = ref(defaultSortDirections.caughtTime);
        const selectedPokemon = ref(null);
        const moveMap = ref({});
        const costumeIdMap = ref({});
        const pvpDataVersion = ref(0);

        // --- Statistics Computed Properties ---
        const stats_shinyRate = computed(() => {
            if (!allPokemons.value || allPokemons.value.length === 0) {
                return { percent: 0, shinyCount: 0, totalCount: 0 };
            }
            const totalCount = allPokemons.value.length;
            const shinyCount = allPokemons.value.filter(p => p.pokemonDisplay?.shiny).length;
            const percent = totalCount > 0 ? Math.round((shinyCount / totalCount) * 100) : 0;
            return { percent, shinyCount, totalCount };
        });

        const stats_perfectNundo = computed(() => {
            const perfect = allPokemons.value.filter(p => p.individualAttack === 15 && p.individualDefense === 15 && p.individualStamina === 15).length;
            const nundo = allPokemons.value.filter(p => p.individualAttack === 0 && p.individualDefense === 0 && p.individualStamina === 0).length;
            const total = perfect + nundo;
            const perfectPerc = total > 0 ? Math.round((perfect / total) * 100) : 1;
            const nundoPerc = total > 0 ? Math.round((nundo / total) * 100) : 1;
            return { perfect, nundo, perfectPerc, nundoPerc };
        });

        const stats_megaEvolvedList = computed(() => {
            if (!pokedexLookup.value) return [];

            const megaEvolvedIds = new Set();
            allPokemons.value.forEach(p => {
                if (p.hasMegaEvolved) {
                    megaEvolvedIds.add(p.pokemonId);
                }
            });

            return Array.from(megaEvolvedIds).map(id => {
                const allForms = pokedexLookup.value[id];
                const entry = allForms?.['NORMAL'] || Object.values(allForms || {})[0];
                return {
                    id: id,
                    sprite: entry?.assets?.image || '' // Get default image from pokedex data
                };
            });
        });

        const stats_ivDistribution = computed(() => {
            const buckets = Array(10).fill(0);
            allPokemons.value.forEach(p => {
                const ivPercent = (p.individualAttack + p.individualDefense + p.individualStamina) / 45 * 100;
                const bucketIndex = Math.min(9, Math.floor(ivPercent / 10));
                buckets[bucketIndex]++;
            });
            const max = Math.max(...buckets);
            const labels = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'];
            return buckets.map((count, i) => ({
                label: labels[i],
                count: count,
                height: max > 0 ? (count / max) * 100 : 0
            }));
        });

        const stats_luckyRate = computed(() => {
            const traded = allPokemons.value.filter(p => p.tradedTimeMs > 0);
            if (traded.length === 0) return { percent: 0, luckyCount: 0, tradedCount: 0 };
            const luckyCount = traded.filter(p => p.isLucky).length;
            return {
                percent: Math.round((luckyCount / traded.length) * 100),
                luckyCount: luckyCount,
                tradedCount: traded.length
            };
        });

        const stats_legendaryRatio = computed(() => {
            let legendaryMythicalCount = 0;
            allPokemons.value.forEach(p => {
                const entry = getPokedexEntry(p);
                if (entry?.pokemonClass === 'POKEMON_CLASS_LEGENDARY' || entry?.pokemonClass === 'POKEMON_CLASS_MYTHIC') {
                    legendaryMythicalCount++;
                }
            });
            const total = allPokemons.value.length;
            if (total === 0) return { percent: 0, legendaryMythicalCount: 0, totalCount: 0 };
            return {
                percent: Math.round((legendaryMythicalCount / total) * 100),
                legendaryMythicalCount: legendaryMythicalCount,
                totalCount: total
            };
        });

        const stats_cpDistribution = computed(() => {
            const buckets = { '0-1k': 0, '1k-2k': 0, '2k-3k': 0, '3k-4k': 0, '4k+': 0 };
            allPokemons.value.forEach(p => {
                if (p.cp <= 1000) buckets['0-1k']++;
                else if (p.cp <= 2000) buckets['1k-2k']++;
                else if (p.cp <= 3000) buckets['2k-3k']++;
                else if (p.cp <= 4000) buckets['3k-4k']++;
                else buckets['4k+']++;
            });
            const max = Math.max(...Object.values(buckets));
            return Object.entries(buckets).map(([label, count]) => ({
                label,
                count,
                height: max > 0 ? (count / max) * 100 : 0
            }));
        });

        const stats_captureByYear = computed(() => {
            const buckets = {};
            allPokemons.value.forEach(p => {
                const year = new Date(p.creationTimeMs).getFullYear();
                buckets[year] = (buckets[year] || 0) + 1;
            });
            const max = Math.max(...Object.values(buckets));
            return Object.entries(buckets).sort(([yearA], [yearB]) => yearA - yearB).map(([label, count]) => ({
                label,
                count,
                height: max > 0 ? (count / max) * 100 : 0
            }));
        });

        const stats_mostCommon = computed(() => {
            if (!pokedexLookup.value || allPokemons.value.length === 0) {
                return [];
            }

            const counts = allPokemons.value.reduce((acc, p) => {
                acc[p.pokemonId] = (acc[p.pokemonId] || 0) + 1;
                return acc;
            }, {});

            const sorted = Object.entries(counts).sort(([, countA], [, countB]) => countB - countA);
            const top5 = sorted.slice(0, 5);
            const max = top5.length > 0 ? top5[0][1] : 0;

            return top5.map(([id, count]) => {
                let name = `ID ${id}`; // Default fallback
                const pokemonData = pokedexLookup.value[id];
                if (pokemonData) {
                    const formEntry = pokemonData['NORMAL'] || Object.values(pokemonData)[0];
                    if (formEntry && formEntry.names && formEntry.names.English) {
                        name = formEntry.names.English;
                    }
                }
                return {
                    name,
                    count,
                    width: max > 0 ? (count / max) * 100 : 0
                };
            });
        });

        const stats_acquisitionType = computed(() => {
            let wild = 0, hatched = 0, raid = 0, trade = 0;
            allPokemons.value.forEach(p => {
                if (p.tradedTimeMs > 0) trade++;
                else if (p.hatchedFromEgg) hatched++;
                else if (p.originDetail?.originDetailCase === 3) raid++; // Case 3 is Raid
                else wild++;
            });
            const total = allPokemons.value.length;
            if (total === 0) return { wildEnd: 0, hatchedEnd: 0, raidEnd: 0, wild, hatched, raid, trade };
            const wildEnd = Math.round((wild / total) * 100);
            const hatchedEnd = wildEnd + Math.round((hatched / total) * 100);
            const raidEnd = hatchedEnd + Math.round((raid / total) * 100);
            return { wildEnd, hatchedEnd, raidEnd, wild, hatched, raid, trade };
        });

        // --- Computed Properties (Derived State) ---

        const teamColor = computed(() => {
            const teamColors = { 1: '#3498DB', 2: '#E74C3C', 3: '#F1C40F' };
            return teamColors[account.value.team] || '#ccc';
        });

        const xpPercentage = computed(() => {
            if (!player.value.nextLevelExp) return 0;
            const xpForLevel = player.value.nextLevelExp - player.value.prevLevelExp;
            const xpProgress = player.value.experience - player.value.prevLevelExp;
            return Math.min(100, Math.max(0, (xpProgress / xpForLevel) * 100));
        });

        const xpProgressText = computed(() => {
             if (!player.value.nextLevelExp) return "0 / 0 XP";
            const xpForLevel = player.value.nextLevelExp - player.value.prevLevelExp;
            const xpProgress = player.value.experience - player.value.prevLevelExp;
            return `${Math.max(0, xpProgress).toLocaleString()} / ${xpForLevel.toLocaleString()} XP`;
        });

        const stardust = computed(() => account.value.currencyBalance?.find(c => c.currencyType === 'STARDUST')?.quantity || 0);
        const pokecoins = computed(() => account.value.currencyBalance?.find(c => c.currencyType === 'POKECOIN')?.quantity || 0);

        const getPokedexEntry = (p) => {
            if (!pokedexLookup.value || !pokedexLookup.value[p.pokemonId]) return null;

            const basePokemonData = Object.values(pokedexLookup.value[p.pokemonId])[0];
            if (!basePokemonData) return null;

            const playerFormName = p.pokemonDisplay.formName?.toUpperCase() || '';

            // Priority 1: Check for regional forms in the regionForms property
            if (basePokemonData.regionForms) {
                for (const regionFormKey in basePokemonData.regionForms) {
                    if (playerFormName.includes(regionFormKey.replace(/_/g, ''))) {
                        return basePokemonData.regionForms[regionFormKey];
                    }
                }
            }

            // Fallback to existing logic for other forms (costumes, etc.)
            const allFormsForPokemon = pokedexLookup.value[p.pokemonId];
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
        };

        const getKeepScore = (p) => {
            if (!p) return 0;
            let score = 0;
            const ivPercent = (p.individualAttack + p.individualDefense + p.individualStamina) / 45 * 100;
            if (ivPercent >= 100) score += 30;
            else if (ivPercent === 0) score += 20;

            if (p.pokemonDisplay?.shiny) score += 25;
            if (p.isMaxLevel) score += 20;
            if (p.pokemonDisplay.locationCard) score += 20;
            if (p.pokemonDisplay?.alignment === 1) score += 15;
            if (p.pokemonClass === 'POKEMON_CLASS_MYTHIC') score += 15;
            return score;
        };

        // --- Comprehensive DPS Calculation ---
        const calculateDps = (p, targetTypes = []) => {
            if (!p || !combatMoves.value || !pokedexLookup.value) {
                // console.log("DPS Calc Skipped: Missing Data", !!p, !!combatMoves.value, !!pokedexLookup.value);
                return null;
            }
            
            const pokedexEntry = getPokedexEntry(p);
            if (!pokedexEntry || !pokedexEntry.stats) return null;

            // 1. Calculate True Attack
            const cpm = p.cpMultiplier + (p.additionalCpMultiplier || 0);
            let trueAttack = (pokedexEntry.stats.attack + p.individualAttack) * cpm;
            
            // Apply Shadow bonus (20% increased damage)
            if (p.pokemonDisplay.alignment === 1) {
                trueAttack *= 1.2;
            }

            // 2. Identify Types for STAB
            const pTypes = [];
            if (pokedexEntry.primaryType?.type) pTypes.push(pokedexEntry.primaryType.type.replace('POKEMON_TYPE_', '').toLowerCase());
            if (pokedexEntry.secondaryType?.type) pTypes.push(pokedexEntry.secondaryType.type.replace('POKEMON_TYPE_', '').toLowerCase());

            const getMoveStats = (moveId, isCharged) => {
                const list = isCharged ? combatMoves.value.chargedMoves : combatMoves.value.fastMoves;
                // move_id in file is number, p.move1 might be number.
                const found = list.find(m => m.move_id == moveId); // Loose equality just in case
                return found;
            };

            const fastMove = getMoveStats(p.move1, false);
            if (!fastMove) {
                // console.log("Fast Move not found:", p.move1);
                return null;
            }

            // Helper for Type Effectiveness
            const getEffectiveness = (moveType) => {
                if (!targetTypes || targetTypes.length === 0 || !typeEffectiveness.value) return 1.0;
                let mult = 1.0;
                
                // Normalize move type to match typeEffectiveness keys (usually Capitalized)
                const moveTypeCap = moveType.charAt(0).toUpperCase() + moveType.slice(1).toLowerCase();

                targetTypes.forEach(tType => {
                    // Normalize target type
                    const tTypeCap = tType.charAt(0).toUpperCase() + tType.slice(1).toLowerCase();
                    
                    if (typeEffectiveness.value[moveTypeCap] && typeEffectiveness.value[moveTypeCap][tTypeCap]) {
                        mult *= typeEffectiveness.value[moveTypeCap][tTypeCap];
                    }
                });
                return mult;
            };

            const results = {};

            // Helper to calculate DPS for one charged move
            const calcSingleDps = (chargedMoveId) => {
                const chargedMove = getMoveStats(chargedMoveId, true);
                if (!chargedMove) return 0;

                // STAB Multipliers
                const fastStab = pTypes.includes(fastMove.type.toLowerCase()) ? 1.2 : 1.0;
                const chargedStab = pTypes.includes(chargedMove.type.toLowerCase()) ? 1.2 : 1.0;

                // Effectiveness Multipliers
                const fastEff = getEffectiveness(fastMove.type);
                const chargedEff = getEffectiveness(chargedMove.type);

                // Cycle Calculation
                const energyNeeded = Math.abs(chargedMove.energy_delta); // Cost is negative
                const energyPerFast = fastMove.energy_delta;
                
                // Avoid infinite loops if energyPerFast is 0 (e.g. Transform? Splash has energy)
                if (energyPerFast <= 0) return 0;

                const numFastMoves = Math.ceil(energyNeeded / energyPerFast);
                
                // Total Cycle Damage
                const fastDamage = fastMove.power * fastStab * fastEff * numFastMoves;
                const chargedDamage = chargedMove.power * chargedStab * chargedEff;
                const totalCycleDamage = fastDamage + chargedDamage;

                // Total Cycle Duration (ms)
                const fastDuration = fastMove.duration * numFastMoves;
                const chargedDuration = chargedMove.duration;
                const totalCycleDuration = fastDuration + chargedDuration;

                // Base Cycle DPS (Power per second)
                const baseDps = totalCycleDamage / (totalCycleDuration / 1000);
                
                return (trueAttack / 200) * baseDps; 
            };

            if (p.move2) results.move2 = calcSingleDps(p.move2);
            if (p.move3) results.move3 = calcSingleDps(p.move3);

            return results;
        };

        const highlights = computed(() => {
            if (!allPokemons.value || allPokemons.value.length === 0) return [];

            const sorted = [...allPokemons.value]
                .sort((a, b) => getKeepScore(b) - getKeepScore(a) || b.cp - a.cp);

            return sorted.slice(0, 9);
        });
        
        const itemCategoryOrder = ['Poké Balls', 'Potions & Revives', 'Berries', 'Special Items', 'Battle & TMs', 'Miscellaneous'];
        const groupedItems = computed(() => {
            if (!items.value) return {};
            const itemCategories = {
                'Poké Balls': ['PokeBall', 'GreatBall', 'UltraBall'], 'Potions & Revives': ['Potion', 'SuperPotion', 'HyperPotion', 'MaxPotion', 'Revive', 'MaxRevive'], 'Berries': ['GoldenRazzBerry', 'GoldenPinapBerry', 'RazzBerry', 'PinapBerry', 'NanabBerry'], 'Special Items': ['RareCandy', 'XlRareCandy', 'LuckyEgg', 'StarPiece', 'IncenseOrdinary', 'TroyDisk'], 'Battle & TMs': ['MoveRerollFastAttack', 'MoveRerollSpecialAttack', 'ShadowGem', 'ShadowGemFragment']
            };
            const categoryLookup = {};
            for (const category in itemCategories) { itemCategories[category].forEach(itemName => { categoryLookup[itemName] = category; }); }
            return items.value.filter(item => item.count > 0 && !item.itemName.includes('Unlimited') && !item.itemName.includes('Camera')).reduce((groups, item) => {
                const category = categoryLookup[item.itemName] || 'Miscellaneous';
                if (!groups[category]) groups[category] = [];
                groups[category].push(item);
                return groups;
            }, {});
        });
        
        const totalPokeBalls = computed(() => (groupedItems.value['Poké Balls'] || []).reduce((total, item) => total + item.count, 0));
        const totalPotions = computed(() => (groupedItems.value['Potions & Revives'] || []).filter(item => item.itemName.includes('Potion')).reduce((total, item) => total + item.count, 0));
        const totalRevives = computed(() => (groupedItems.value['Potions & Revives'] || []).filter(item => item.itemName.includes('Revive')).reduce((total, item) => total + item.count, 0));


        const filteredPokemon = computed(() => {
            let pokemons = filterPokemon([...allPokemons.value], debouncedSearchQuery.value, pokedexService, moveMap);
            
pokemons.sort((a, b) => {
                let valA, valB;
                switch (sortKey.value) {
                    case 'cp': valA = a.cp; valB = b.cp; break;
                    case 'pokedex': valA = a.pokemonId; valB = b.pokemonId; break;
                    case 'name': return (a.nickname || a.name).localeCompare(b.nickname || b.name);
                    default: valA = a.creationTimeMs; valB = b.creationTimeMs; break;
                }
                return valA - valB;
            });
            if (sortDirection.value === 'desc') pokemons.reverse();
            return pokemons;
        });

        const showCleanupModal = ref(false);
        const cleanupSearchQuery = ref('');
        const groupSubstitutes = ref(false);

        const defaultCleanupData = computed(() => {
            const pokemonsToProcess = filterPokemon(allPokemons.value, cleanupSearchQuery.value, pokedexService, moveMap);
            const groupedById = pokemonsToProcess.reduce((acc, p) => {
                if (!acc[p.pokemonId]) acc[p.pokemonId] = [];
                acc[p.pokemonId].push(p);
                return acc;
            }, {});
            const duplicateGroups = Object.values(groupedById).filter(group => group.length > 1);
            duplicateGroups.sort((a, b) => b.length - a.length);
            duplicateGroups.forEach(group => {
                group.sort((a, b) => getKeepScore(b) - getKeepScore(a) || getIvPercentAsNumber(b) - getIvPercentAsNumber(a) || b.cp - a.cp);
            });
            return duplicateGroups;
        });

        const formGroupedCleanupData = computed(() => {
            const pokemonsToProcess = filterPokemon(allPokemons.value, cleanupSearchQuery.value, pokedexService, moveMap);
            const groupedBySpecies = pokemonsToProcess.reduce((acc, p) => {
                if (!acc[p.pokemonId]) acc[p.pokemonId] = [];
                acc[p.pokemonId].push(p);
                return acc;
            }, {});
            const duplicateSpeciesGroups = Object.values(groupedBySpecies).filter(group => group.length > 1);

            const finalStructure = duplicateSpeciesGroups.map(speciesGroup => {
                const getFormKey = (p) => {
                    const form = p.pokemonDisplay.formName || 'NORMAL';
                    const costume = p.pokemonDisplay.costume || 'NONE';
                    return `${form}-${costume}`;
                };
                const subGroupedByForm = speciesGroup.reduce((acc, p) => {
                    const key = getFormKey(p);
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(p);
                    return acc;
                }, {});

                Object.values(subGroupedByForm).forEach(formGroup => {
                    formGroup.sort((a, b) => getKeepScore(b) - getKeepScore(a) || getIvPercentAsNumber(b) - getIvPercentAsNumber(a) || b.cp - a.cp);
                });

                return {
                    speciesName: speciesGroup[0].name,
                    count: speciesGroup.length,
                    forms: Object.entries(subGroupedByForm).map(([key, pokemons]) => {
                        const [form, costumeId] = key.split('-');
                        
                        let formName = '';
                        if (form !== 'NORMAL') {
                            formName = form.replace(/_/g, ' ').toLowerCase();
                            formName = formName.charAt(0).toUpperCase() + formName.slice(1);
                        }

                        let costumeName = '';
                        if (costumeId !== 'NONE' && costumeIdMap.value[costumeId]) {
                            costumeName = costumeIdMap.value[costumeId].replace(/_/g, ' ').toLowerCase();
                            costumeName = costumeName.charAt(0).toUpperCase() + costumeName.slice(1);
                        }

                        let displayName = formName;
                        if (costumeName) {
                            displayName = costumeName;
                            if (formName) {
                                displayName += ` (${formName})`;
                            }
                        } else if (!formName) {
                            displayName = 'Normal';
                        }

                        return {
                            displayName,
                            pokemons
                        };
                    })
                };
            });

            finalStructure.sort((a, b) => b.count - a.count);
            return finalStructure;
        });

        const showTeamBuilderModal = ref(false);
        const selectedRaidBoss = ref('DIALGA');
        const raidBosses = ref([]);
        const maxBattles = ref([]); // Store Max Battles data
        const selectedMaxBoss = ref(null); // Store selected Max Boss ID
        const typeEffectiveness = ref({});

        // New state for custom team builder
        const teamBuilderMode = ref('raid'); // 'raid', 'custom', 'max_battle_list'
        const customEnemies = ref([]);
        const activeTeamBuilderTab = ref('Overall');
        const allPokedex = ref([]); // To populate the custom enemy selector
        const pokedexLookup = computed(() => {
            if (!allPokedex.value) return {};
            const lookup = {};
            allPokedex.value.forEach(pokemon => {
                const dexKey = pokemon.dexNr;
                if (!lookup[dexKey]) lookup[dexKey] = {};
                let formKey = pokemon.formId || 'NORMAL';
                lookup[dexKey][formKey] = pokemon;
            });
            return lookup;
        });
        const allPokedexNames = computed(() => {
            if (!allPokedex.value) return [];
            const names = new Set();
            allPokedex.value.forEach(p => {
                names.add(p.names.English);
                if (p.regionForms) {
                    Object.values(p.regionForms).forEach(rf => names.add(rf.names.English));
                }
                if (p.hasMegaEvolution && p.megaEvolutions) {
                    for (const megaKey in p.megaEvolutions) {
                        names.add(p.megaEvolutions[megaKey].names.English);
                    }
                }
            });
            return Array.from(names).sort();
        });
        const customEnemyInput = ref('');
        const battleMode = ref('standard'); // 'standard' or 'max'

        const allTeamSuggestions = ref({}); // New object to hold all suggestions

        // --- Avatar Selection ---
        const showAvatarModal = ref(false);
        const totalAvatars = ref(0);
        const visibleAvatars = ref([]);
        const loadingAvatars = ref(false);
        const AVATAR_BATCH_SIZE = 50;
        const currentAvatarId = ref('132'); // Default to Ditto
        const pendingAvatarId = ref(null); // The one selected but not yet saved
        const savingAvatar = ref(false);

        const currentAvatarUrl = computed(() => {
            const id = currentAvatarId.value;
            // Check if it's the default Ditto GIF (special case for animation)
            // We use '132' as the default if no preference is set
            if (id === '132' && (!account.value.preferences || !account.value.preferences.avatarId)) {
                 return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/132.gif';
            }
            // Otherwise use Home Artwork
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`;
        });

        const openAvatarModal = async () => {
            showAvatarModal.value = true;
            pendingAvatarId.value = currentAvatarId.value; // Initialize pending with current
            if (totalAvatars.value === 0) {
                // Use local Pokedex data if available
                if (allPokedex.value) {
                    if (Array.isArray(allPokedex.value)) {
                        let maxId = 0;
                        allPokedex.value.forEach(p => {
                            if (p.id && typeof p.id === 'number' && p.id > maxId) {
                                maxId = p.id;
                            } else if (p.dexNr && typeof p.dexNr === 'number' && p.dexNr > maxId) {
                                maxId = p.dexNr;
                            }
                        });
                        totalAvatars.value = maxId > 0 ? maxId : 1025;
                    } else if (typeof allPokedex.value === 'object') {
                        totalAvatars.value = Object.keys(allPokedex.value).length;
                    } else {
                        totalAvatars.value = 1025;
                    }
                } else {
                    totalAvatars.value = 1025;
                }
                loadMoreAvatars();
            }
        };

        const loadMoreAvatars = () => {
            if (loadingAvatars.value) return;
            loadingAvatars.value = true;
            
            const currentCount = visibleAvatars.value.length;
            const nextBatch = [];
            
            for (let i = 1; i <= AVATAR_BATCH_SIZE; i++) {
                const nextId = currentCount + i;
                if (nextId > totalAvatars.value) break;
                nextBatch.push(nextId);
            }

            visibleAvatars.value = [...visibleAvatars.value, ...nextBatch];
            loadingAvatars.value = false;
        };

        const handleAvatarScroll = (e) => {
            const { scrollTop, clientHeight, scrollHeight } = e.target;
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                loadMoreAvatars();
            }
        };

        const selectAvatar = (id) => {
            pendingAvatarId.value = id;
        };

        const saveAvatar = async () => {
            if (!pendingAvatarId.value) return;
            savingAvatar.value = true;
            try {
                const response = await fetch('/api/update-preferences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        preferences: { avatarId: pendingAvatarId.value.toString() }
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    currentAvatarId.value = pendingAvatarId.value;
                    account.value.preferences = data.preferences;
                    showAvatarModal.value = false;
                } else {
                    alert('Failed to save avatar preference.');
                }
            } catch (e) {
                console.error("Save avatar error:", e);
                alert('An error occurred while saving.');
            } finally {
                savingAvatar.value = false;
            }
        };

        // --- Methods ---
        const openTeamBuilderModal = () => { showTeamBuilderModal.value = true; };
        const closeTeamBuilderModal = () => { showTeamBuilderModal.value = false; };

        // Calculate Effective Bulk (Defense * Stamina / Incoming Damage)
        const calculateBulk = (pokemon, bossTypes) => {
            const entry = getPokedexEntry(pokemon);
            if (!entry || !entry.stats) return 0;

            const cpm = pokemon.cpMultiplier + (pokemon.additionalCpMultiplier || 0);
            const trueDef = (entry.stats.defense + pokemon.individualDefense) * cpm;
            const trueSta = (entry.stats.stamina + pokemon.individualStamina) * cpm;

            let incomingDamageMultiplier = 1.0;
            
            const myTypes = [];
            if (entry.primaryType?.names?.English) myTypes.push(entry.primaryType.names.English);
            if (entry.secondaryType?.names?.English) myTypes.push(entry.secondaryType.names.English);

            if (typeEffectiveness.value && bossTypes) {
                bossTypes.forEach(bossType => {
                    const bossTypeCap = bossType.charAt(0).toUpperCase() + bossType.slice(1).toLowerCase();
                    myTypes.forEach(myType => {
                        const myTypeCap = myType.charAt(0).toUpperCase() + myType.slice(1).toLowerCase();
                         if (typeEffectiveness.value[bossTypeCap] && typeEffectiveness.value[bossTypeCap][myTypeCap]) {
                             incomingDamageMultiplier *= typeEffectiveness.value[bossTypeCap][myTypeCap];
                         }
                    });
                });
            }

            return (trueDef * trueSta) / incomingDamageMultiplier;
        };

        const calculateEffectivenessScore = (pokemon, bossTypes) => {
            // Use the new DPS calculation with target types
            const dpsResults = calculateDps(pokemon, bossTypes);
            if (!dpsResults) return 0;

            // Take the best DPS from available charged moves
            const bestDps = Math.max(
                dpsResults.move2 || 0, 
                dpsResults.move3 || 0
            );

            if (bestDps === 0) return 0;

            const effectiveBulk = calculateBulk(pokemon, bossTypes);

            // Final Combat Score: DPS is king, but dead DPS is 0.
            // Formula: (DPS^1.5 * EffectiveBulk) / Constant
            const score = (Math.pow(bestDps, 1.5) * effectiveBulk) / 100000;

            return score;
        };

        const generateSuggestions = () => {
            let enemies = [];
            // Force Battle Mode for Max Battles Tab
            if (teamBuilderMode.value === 'max_battle_list') {
                battleMode.value = 'max';
                const boss = maxBattles.value.find(b => b.id === selectedMaxBoss.value);
                if (boss) enemies.push(boss);
            } else if (teamBuilderMode.value === 'raid') {
                const boss = raidBosses.value.find(b => b.id === selectedRaidBoss.value);
                if (boss) enemies.push(boss);
            } else {
                enemies = customEnemies.value;
            }

            if (enemies.length === 0) {
                allTeamSuggestions.value = {};
                return;
            }

            const suggestions = {};
            const overallScores = {};

            let pokemonPool = allPokemons.value;
            if (battleMode.value === 'max') {
                pokemonPool = allPokemons.value.filter(p => p.pokemonDisplay.breadModeEnum === 1 || p.pokemonDisplay.breadModeEnum === 2);
            }

            pokemonPool.forEach(p => {
                overallScores[p.id] = { ...p, score: 0 };
            });

            enemies.forEach(enemy => {
                const enemyTypes = enemy.types;
                if (!enemyTypes || enemyTypes.length === 0) {
                    suggestions[enemy.names.English] = [];
                    return;
                }

                if (battleMode.value === 'max') {
                    // MAX Battle Logic (2026 Mechanics)
                    
                    const evaluatedPool = pokemonPool.map(p => {
                        // --- 1. Max Move Power ---
                        const isGigantamax = p.pokemonDisplay.breadModeEnum === 2;
                        let maxAttackLevel = 1;
                        let maxGuardLevel = 1;
                        let maxSpiritLevel = 1;

                        if (p.breadMoves && p.breadMoves.length > 0) {
                            p.breadMoves.forEach(m => {
                                if (m.moveType === 1) maxAttackLevel = m.moveLevel;
                                else if (m.moveType === 2) maxGuardLevel = m.moveLevel;
                                else if (m.moveType === 3) maxSpiritLevel = m.moveLevel;
                            });
                        }

                        // Power Scaling: D-Max 250-350, G-Max 350-450
                        // Assuming linear steps: L1, L2, L3
                        // D-Max: 250, 300, 350
                        // G-Max: 350, 400, 450
                        let power = 0;
                        if (isGigantamax) {
                            power = 350 + (maxAttackLevel - 1) * 50;
                        } else {
                            power = 250 + (maxAttackLevel - 1) * 50;
                        }

                        // --- 2. Damage Output Potential ---
                        // Formula: Floor(0.5 * Power * (Atk / Def) * Multipliers) + 1
                        // For ranking, we ignore Def and +1. We focus on Output Potential.
                        // Multipliers: STAB (1.2) * Effectiveness (up to 2.56)
                        const entry = getPokedexEntry(p);
                        const cpm = p.cpMultiplier + (p.additionalCpMultiplier || 0);
                        const trueAtk = (entry.stats.attack + p.individualAttack) * cpm;

                        // STAB
                        const pTypes = [];
                        if (entry.primaryType?.names?.English) pTypes.push(entry.primaryType.names.English.toUpperCase());
                        if (entry.secondaryType?.names?.English) pTypes.push(entry.secondaryType.names.English.toUpperCase());
                        
                        // Note: Max Moves take the type of the Fast Move.
                        // We check the Fast Move type for STAB and Effectiveness.
                        const fastMove = combatMoves.value.fastMoves.find(m => m.move_id == p.move1);
                        let moveType = fastMove ? fastMove.type : 'Normal';
                        
                        const isStab = pTypes.includes(moveType.toUpperCase()) ? 1.2 : 1.0;
                        
                        // Effectiveness against Boss (Handles single and dual-types)
                        let effectiveness = 1.0;
                        if (enemyTypes && enemyTypes.length > 0 && typeEffectiveness.value) {
                            const moveTypeKey = moveType.charAt(0).toUpperCase() + moveType.slice(1).toLowerCase();
                            enemyTypes.forEach(eType => {
                                const eTypeKey = eType.charAt(0).toUpperCase() + eType.slice(1).toLowerCase();
                                if (typeEffectiveness.value[moveTypeKey] && typeEffectiveness.value[moveTypeKey][eTypeKey]) {
                                    effectiveness *= typeEffectiveness.value[moveTypeKey][eTypeKey];
                                }
                            });
                        }

                        // Power Spot Helper bonus (Baseline 1.1x for ranking)
                        const powerSpotBonus = 1.1;

                        const damagePotential = 0.5 * power * trueAtk * isStab * effectiveness * powerSpotBonus;

                        // --- 3. Meter Generation Speed (Fast Move Bias) ---
                        // Favor 0.5s moves. 
                        // Score Multiplier = 1 / (Duration in seconds)
                        // duration is in ms (e.g. 500)
                        const durationSec = (fastMove && fastMove.duration) ? fastMove.duration / 1000 : 1.0;
                        const speedScore = 1 / durationSec; 

                        // --- 4. Survivability (MCF - Max Cycle to Faint) ---
                        // Base HP * 2.0 (Dynamax Multiplier)
                        const trueSta = (entry.stats.stamina + p.individualStamina) * cpm;
                        const maxHp = Math.floor(trueSta * 2.0);

                        // Max Guard (Shield): L2 = +40. Assume L1=20, L3=60.
                        const guardBonus = maxGuardLevel * 20;

                        // Max Spirit (Recovery): L2 = 12%. Assume L1=10%, L3=14%.
                        const spiritPercent = 0.10 + (maxSpiritLevel - 1) * 0.02;
                        
                        // "Immortal" calculation: Can we recover more than we take?
                        // For a ranking score, we treat this as Effective Health Pool multiplier.
                        // If a team recovers 36% (3x Spirit) per cycle, effectively extending life significantly.
                        // We'll model this as: HP + Shield + (HP * Spirit% * Estimated_Cycles)
                        // Assuming a standard battle allows for ~3 Spirits per player? 
                        // Let's use a simpler effective health metric:
                        // EffectiveHP = (MaxHP + GuardBonus) * (1 + spiritPercent * 3)
                        const effectiveHp = (maxHp + guardBonus) * (1 + spiritPercent * 3);

                        // --- 5. Incoming Damage Mitigation (Defense) ---
                        const trueDef = (entry.stats.defense + p.individualDefense) * cpm;
                        
                        // Bulk Score = EffectiveHP * TrueDef
                        const bulkScore = effectiveHp * trueDef / 10000;

                        // --- Final Score ---
                        // Combine Damage (weighted by speed) and Bulk.
                        // The user emphasizes "Damage output" and "Immortal" teams.
                        // We'll weight Damage * Speed heavily.
                        const finalScore = (damagePotential * speedScore) * (bulkScore / 100);

                        return { 
                            ...p, 
                            dps: damagePotential * speedScore, 
                            bulk: bulkScore, 
                            score: finalScore,
                            scoreLabel: 'Max Score' 
                        };
                    });

                    // Top 6 Attackers (Weighted by Speed/Damage)
                    const attackers = [...evaluatedPool]
                        .sort((a, b) => b.dps - a.dps)
                        .slice(0, 6)
                        .map(p => ({ ...p, score: p.dps, scoreLabel: 'Max Dmg' }));

                    const attackerIds = new Set(attackers.map(p => p.id));

                    // Top 6 Tanks (Weighted by Survival)
                    const tanks = [...evaluatedPool]
                        .filter(p => !attackerIds.has(p.id))
                        .sort((a, b) => b.bulk - a.bulk)
                        .slice(0, 6)
                        .map(p => ({ ...p, score: p.bulk, scoreLabel: 'Survival' }));

                    suggestions[enemy.names.English] = [...attackers, ...tanks];

                } else {
                    // Standard Logic
                    const rankedPokemon = pokemonPool.map(pokemon => {
                        const score = calculateEffectivenessScore(pokemon, enemyTypes);
                        overallScores[pokemon.id].score += score;
                        return { ...pokemon, score }; // Default label is "Score"
                    }).sort((a, b) => b.score - a.score);

                    suggestions[enemy.names.English] = rankedPokemon.slice(0, 12);
                }
            });

            const overallRanked = Object.values(overallScores).sort((a, b) => b.score - a.score);
            suggestions['Overall'] = overallRanked.slice(0, 12);

            allTeamSuggestions.value = suggestions;
        };

        const activeTabSuggestions = computed(() => {
            if (teamBuilderMode.value === 'raid') {
                const boss = raidBosses.value.find(b => b.id === selectedRaidBoss.value);
                return boss ? allTeamSuggestions.value[boss.names.English] || [] : [];
            } else if (teamBuilderMode.value === 'max_battle_list') {
                const boss = maxBattles.value.find(b => b.id === selectedMaxBoss.value);
                return boss ? allTeamSuggestions.value[boss.names.English] || [] : [];
            } else { // custom mode
                if (customEnemies.value.length === 0) return [];
                if (customEnemies.value.length === 1) {
                    return allTeamSuggestions.value[customEnemies.value[0].names.English] || [];
                }
                // If customEnemies.length > 1, use the activeTeamBuilderTab
                return allTeamSuggestions.value[activeTeamBuilderTab.value] || [];
            }
        });
        const addCustomEnemy = () => {
            if (customEnemies.value.length >= 6) return;
            const pokemonName = customEnemyInput.value;
            if (!pokemonName) return;

            let pokemonData = null;
            let isMegaEvolution = false;

            for (const p of allPokedex.value) {
                // Check for base form and regional forms
                if (p.names.English.toLowerCase() === pokemonName.toLowerCase()) {
                    pokemonData = p;
                    break;
                }
                if (p.regionForms) {
                    for (const rf of Object.values(p.regionForms)) {
                        if (rf.names.English.toLowerCase() === pokemonName.toLowerCase()) {
                            pokemonData = rf;
                            break;
                        }
                    }
                }
                // Check for Mega Evolutions
                if (p.hasMegaEvolution && p.megaEvolutions) {
                    for (const megaKey in p.megaEvolutions) {
                        if (p.megaEvolutions[megaKey].names.English.toLowerCase() === pokemonName.toLowerCase()) {
                            pokemonData = p.megaEvolutions[megaKey]; // This is the Mega Evolution object
                            isMegaEvolution = true;
                            break;
                        }
                    }
                }
                if (pokemonData) break;
            }

            if (pokemonData && !customEnemies.value.some(e => e.names.English === pokemonData.names.English)) {
                const types = [];
                if (pokemonData.primaryType) types.push(pokemonData.primaryType.names.English);
                if (pokemonData.secondaryType) types.push(pokemonData.secondaryType.names.English);
                const typeColors = types.map(type => pokedexService.value.typeColorMap[type.toUpperCase()]);

                // For Mega Evolutions, we need to ensure the ID is unique and reflects it's a mega form
                const enemyId = isMegaEvolution ? `${pokemonData.id}_MEGA` : pokemonData.id;
                
                customEnemies.value.push({ 
                    ...pokemonData, 
                    id: enemyId, // Use a unique ID for mega forms
                    types, 
                    typeColors,
                    isMegaEvolution: isMegaEvolution // Add a flag for easier identification if needed
                });
            }
            customEnemyInput.value = ''; // Clear the input
        };

        const removeCustomEnemy = (index) => {
            customEnemies.value.splice(index, 1);
        };

        watchEffect(generateSuggestions);

        watch(teamBuilderMode, (newMode) => {
            // Reset battle mode when switching between Raid and Custom
            if (newMode === 'max_battle_list') {
                battleMode.value = 'max';
            } else {
                battleMode.value = 'standard';
            }
        });

        watch(customEnemies, (newEnemies) => {
            // When the list of enemies changes, reset the active tab.
            if (newEnemies.length > 1) {
                activeTeamBuilderTab.value = 'Overall';
            } else if (newEnemies.length === 1) {
                activeTeamBuilderTab.value = newEnemies[0].names.English;
            }
        }, { deep: true }); // deep watch is needed for array mutations

        const getPokemonTypes = (pokemon) => {
            if (!pokemon || !pokemon.typeColors || !pokedexService.value.typeColorMap) {
                return [];
            }
            const typeMap = pokedexService.value.typeColorMap;
            const types = pokemon.typeColors.map(color => {
                const typeName = Object.keys(typeMap).find(key => typeMap[key] === color);
                if (typeName) {
                    // Capitalize first letter, lowercase the rest
                    const formattedName = typeName.charAt(0).toUpperCase() + typeName.slice(1).toLowerCase();
                    return { name: formattedName, color: color };
                }
                return null;
            });
            return types.filter(Boolean); // Filter out any nulls
        };

        const openCleanupModal = () => { showCleanupModal.value = true; };
        const closeCleanupModal = () => { showCleanupModal.value = false; };
        const toggleSortDirection = () => { sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'; };
        const getItemSprite = (itemId) => `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Items/Item_${String(itemId).padStart(4, '0')}.png`;


                                const displayMove = (moveId) => moveMap.value[moveId]?.name || moveId;

    const openPokemonModal = (pokemon) => {
        const pokemonWithMoveTypes = { ...pokemon };

        // Use the moveMap to get move types
        if (pokemon.move1 && moveMap.value[pokemon.move1]) {
            pokemonWithMoveTypes.move1Type = moveMap.value[pokemon.move1].type;
        }
        if (pokemon.move2 && moveMap.value[pokemon.move2]) {
            pokemonWithMoveTypes.move2Type = moveMap.value[pokemon.move2].type;
        }
        if (pokemon.move3 && moveMap.value[pokemon.move3]) {
            pokemonWithMoveTypes.move3Type = moveMap.value[pokemon.move3].type;
        }

        selectedPokemon.value = pokemonWithMoveTypes;

        setTimeout(() => {
            const attackBar = document.querySelector('#modal-content .stat-bar-fill[data-stat="attack"]');
            const defenseBar = document.querySelector('#modal-content .stat-bar-fill[data-stat="defense"]');
            const staminaBar = document.querySelector('#modal-content .stat-bar-fill[data-stat="stamina"]');

            if (attackBar) {
                attackBar.style.width = `${(pokemon.individualAttack / 15) * 100}%`;
                attackBar.style.backgroundColor = pokemon.individualAttack === 15 ? '#da7a79' : '#f79513';
            }
            if (defenseBar) {
                defenseBar.style.width = `${(pokemon.individualDefense / 15) * 100}%`;
                defenseBar.style.backgroundColor = pokemon.individualDefense === 15 ? '#da7a79' : '#f79513';
            }
            if (staminaBar) {
                staminaBar.style.width = `${(pokemon.individualStamina / 15) * 100}%`;
                staminaBar.style.backgroundColor = pokemon.individualStamina === 15 ? '#da7a79' : '#f79513';
            }
        }, 100);
    };

                

                        // --- Tab Navigation ---
        const updateActiveTabFromHash = () => {
            const hash = window.location.hash.replace('#', '');
            const validTabs = ['character', 'pokemon', 'pokedex', 'statistics', 'tools'];
            if (validTabs.includes(hash)) {
                activeTab.value = hash;
            } else {
                activeTab.value = 'character';
            }
            // Update active class on subheader links
            document.querySelectorAll('.sub-header a').forEach(link => {
                if (link.id === `nav-${activeTab.value}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };

        // --- Pokedex Logic ---
        const pokedexMode = ref('normal'); // 'normal' or 'completionist'

                        const pokedexDisplayData = computed(() => {
                            if (!allPokedex.value || !allPokemons.value) return [];
                
                            // Helper for fallback images
                                        const getFallbackImage = (dexNr, type = 'Normal') => {
                                            if (type === 'Shiny') {
                                                return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${dexNr}.png`;
                                            }
                                            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${dexNr}.png`;
                                        };                
                                        // Debug Logs
                            
                                        const displayList = [];                            const userPokemonMap = new Set();
                
                            // Pre-calculate species names for stripping prefix from form names
                            const speciesNameMap = {};
                            allPokedex.value.forEach(p => {
                                if (p.names && p.names.English) {
                                    speciesNameMap[p.dexNr] = p.names.English.toUpperCase().replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');
                                }
                            });
                
                            // --- 1. Build User Inventory Map ---
                            allPokemons.value.forEach(p => {
                                const suffixes = [''];
                                if (p.pokemonDisplay.shiny) {
                                    suffixes.push('_SHINY');
                                }
                
                                suffixes.forEach(suffix => {
                                    // A. Species-level key (for Normal mode)
                                    userPokemonMap.add(`${p.pokemonId}_ANY${suffix}`);
                    
                                    // B. Multi-Key Generation for Completionist Mode
                                    // 1. Raw Form Name (e.g. "PIKACHU_LIBRE" -> "LIBRE")
                                    let rawForm = p.pokemonDisplay.formName || 'NORMAL';
                                    if (rawForm === 'UNSET') rawForm = 'NORMAL';
                                    const cleanForm = rawForm.toUpperCase().replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');
                                    
                                    // 2. Costume ID Mapping
                                    let cleanCostume = 'NONE';
                                    if (p.pokemonDisplay.costume && p.pokemonDisplay.costume > 0) {
                                        const mappedCostume = costumeIdMap.value && costumeIdMap.value[p.pokemonDisplay.costume.toString()];
                                        if (mappedCostume) {
                                            cleanCostume = mappedCostume.toUpperCase().replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');
                                        } else {
                                            // console.warn('Unmapped Costume ID:', p.pokemonDisplay.costume);
                                            cleanCostume = `ID_${p.pokemonDisplay.costume}`;
                                        }
                                    }
                    
                                    // Generate Permutations
                                    userPokemonMap.add(`${p.pokemonId}_FORM_${cleanForm}_COSTUME_${cleanCostume}${suffix}`);
                                    userPokemonMap.add(`${p.pokemonId}_FORM_${cleanForm}${suffix}`);
                
                                    // Fix for redundant species name in form (e.g. PIKACHU_LIBRE -> LIBRE)
                                    const speciesName = speciesNameMap[p.pokemonId];
                                    if (speciesName && cleanForm.startsWith(speciesName) && cleanForm.length > speciesName.length) {
                                        const strippedForm = cleanForm.substring(speciesName.length);
                                        userPokemonMap.add(`${p.pokemonId}_FORM_${strippedForm}_COSTUME_${cleanCostume}${suffix}`);
                                        userPokemonMap.add(`${p.pokemonId}_FORM_${strippedForm}${suffix}`);
                                    }
                
                                    if (cleanCostume !== 'NONE') {
                                        userPokemonMap.add(`${p.pokemonId}_COSTUME_${cleanCostume}${suffix}`);
                                        userPokemonMap.add(`${p.pokemonId}_FORM_NORMAL_COSTUME_${cleanCostume}${suffix}`);
                                    }
                                });
                            });
                
                                        // Debug: Log samples                
                
                                // --- 2. Build Display List ---
                                allPokedex.value.forEach(species => {
                                    if (pokedexMode.value === 'normal') {
                                        // ... (Normal Mode Logic Unchanged) ...
                                        // Find best image (Standard form, no costume)
                                        let displayAsset = null;
                                        if (species.assetForms) {
                                            displayAsset = species.assetForms.find(f => 
                                                (!f.form || f.form === 'NORMAL') && 
                                                (!f.costume || f.costume === 'NONE')
                                            );
                                            // If no strict standard form, take the first one available
                                            if (!displayAsset) displayAsset = species.assetForms[0];
                                        }
                    
                                        const isCaught = userPokemonMap.has(`${species.dexNr}_ANY`);
                                        const spriteUrl = displayAsset ? displayAsset.image : (species.assets?.image || getFallbackImage(species.dexNr, 'Normal'));
                    
                                        displayList.push({
                                            uniqueId: `${species.dexNr}_NORMAL`,
                                            dexNr: species.dexNr,
                                            name: species.names.English,
                                            sprite: spriteUrl,
                                            isCaught: isCaught
                                        });
                    
                                    } else {
                                        // --- Completionist Mode ---
                                        if (species.assetForms) {
                                            const processedForms = new Set(); // To deduplicate Gender variants (Male/Female)
                
                                            species.assetForms.forEach((formEntry, index) => {
                                                // 1. Skip "Technical" duplicates (forms starting with PM + digits)
                                                if (formEntry.form && formEntry.form.match(/^PM\d+/)) {
                                                    return;
                                                }
                
                                                // Prepare Keys for Matching
                                                let matchForm = formEntry.form ? formEntry.form.toUpperCase() : 'NORMAL';
                                                matchForm = matchForm.replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');
                    
                                                let matchCostume = formEntry.costume ? formEntry.costume.toUpperCase() : 'NONE';
                                                matchCostume = matchCostume.replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');
                
                                                // 2. Deduplicate based on Form + Costume (collapses Gender variants)
                                                const uniqueKey = `${matchForm}_${matchCostume}`;
                                                if (processedForms.has(uniqueKey)) {
                                                    return;
                                                }
                                                processedForms.add(uniqueKey);
                    
                                                // Prepare Display Name
                                                let fullName = species.names.English;
                                                if (formEntry.form && formEntry.form !== 'NORMAL') {
                                                    fullName += ` (${formEntry.form})`;
                                                }
                                                if (formEntry.costume) {
                                                    fullName += ` [${formEntry.costume}]`;
                                                }
                    
                                                // Strategy: Try to match any of the generated user keys
                                                let isCaught = false;
                    
                                                // Try 1: Exact Match
                                                if (userPokemonMap.has(`${species.dexNr}_FORM_${matchForm}_COSTUME_${matchCostume}`)) {
                                                    isCaught = true;
                                                }
                                                // Try 2: If Pokedex asks for Form but No Costume, match strict Form
                                                else if (matchCostume === 'NONE' && userPokemonMap.has(`${species.dexNr}_FORM_${matchForm}`)) {
                                                    isCaught = true;
                                                }
                                                // Try 3: If Pokedex asks for Costume, match strict Costume (ignoring form usually implies Normal)
                                                else if (matchCostume !== 'NONE' && userPokemonMap.has(`${species.dexNr}_COSTUME_${matchCostume}`)) {
                                                    isCaught = true;
                                                }
                                                // Try 4: If Pokedex asks for Costume, try matching it against User's Form Name (sometimes merged)
                                                // e.g. User has "PIKACHU_LIBRE", Pokedex wants Costume "LIBRE"
                                                else if (matchCostume !== 'NONE' && userPokemonMap.has(`${species.dexNr}_FORM_${matchCostume}`)) {
                                                    isCaught = true;
                                                }
                    
                                                // Image Fallback
                                                const spriteUrl = formEntry.image || species.assets?.image || getFallbackImage(species.dexNr, 'Normal');
                
                                                displayList.push({
                                                    uniqueId: `${species.dexNr}_${index}_NORMAL`,
                                                    dexNr: species.dexNr,
                                                    name: fullName,
                                                    sprite: spriteUrl,
                                                    isCaught: isCaught
                                                });
                
                                                // --- Shiny Entry ---
                                                if (formEntry.shinyImage) {
                                                    let isCaughtShiny = false;
                                                    const suffix = '_SHINY';
                
                                                    // Try 1: Exact Match
                                                    if (userPokemonMap.has(`${species.dexNr}_FORM_${matchForm}_COSTUME_${matchCostume}${suffix}`)) {
                                                        isCaughtShiny = true;
                                                    }
                                                    // Try 2: Strict Form
                                                    else if (matchCostume === 'NONE' && userPokemonMap.has(`${species.dexNr}_FORM_${matchForm}${suffix}`)) {
                                                        isCaughtShiny = true;
                                                    }
                                                    // Try 3: Strict Costume
                                                    else if (matchCostume !== 'NONE' && userPokemonMap.has(`${species.dexNr}_COSTUME_${matchCostume}${suffix}`)) {
                                                        isCaughtShiny = true;
                                                    }
                                                    // Try 4: Costume in Form Name
                                                    else if (matchCostume !== 'NONE' && userPokemonMap.has(`${species.dexNr}_FORM_${matchCostume}${suffix}`)) {
                                                        isCaughtShiny = true;
                                                    }
                
                                                                                                displayList.push({
                                                                                                    uniqueId: `${species.dexNr}_${index}_SHINY`,
                                                                                                    dexNr: species.dexNr,
                                                                                                    name: `${fullName} ✨`,
                                                                                                    sprite: formEntry.shinyImage || getFallbackImage(species.dexNr, 'Shiny'),
                                                                                                    isCaught: isCaughtShiny
                                                                                                });                                                }
                                            });
                                        } else {
                                        // Fallback if species has no assetForms list
                                        const isCaught = userPokemonMap.has(`${species.dexNr}_ANY`);
                                        displayList.push({
                                            uniqueId: `${species.dexNr}_BASIC`,
                                            dexNr: species.dexNr,
                                            name: species.names.English,
                                            sprite: species.assets?.image || getFallbackImage(species.dexNr, 'Normal'),
                                            isCaught: isCaught
                                        });
                                    }
                                }
                            });
                
                            return displayList;
                        });
        // --- Scroll to Top Logic ---
        const showScrollTop = ref(false);

        const handleScroll = () => {
            let scrolled = false;
            if (window.scrollY > 300) scrolled = true;
            
            const pokemonList = document.getElementById('all-pokemon-list');
            if (pokemonList && pokemonList.scrollTop > 300) scrolled = true;

            showScrollTop.value = scrolled;
        };

        const scrollToTop = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const pokemonList = document.getElementById('all-pokemon-list');
            if (pokemonList) {
                pokemonList.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        const pvpProgress = ref(-1); // Progress -1 (Hidden), 0-100 (Visible)
        const combatMoves = ref(null); // Stores full stats for moves (power, energy, duration)

        // --- Trash String Generator ---
        const showTrashModal = ref(false);
        const trashConfig = ref({
            keepShiny: true,
            keepLucky: true,
            keepShadow: true,
            keepPurified: false,
            keepLegendary: true,
            keepCostume: true,
            keepFavorite: true,
            keepBackground: true,
            keepXXSXXL: true,
            keep4Star: true,
            keepNundo: true,
            useMinIv: true,
            minIvPercent: 90,
            useRankGL: true,
            keepRankGL: 50,
            useRankUL: true,
            keepRankUL: 50,
            useRankML: true,
            keepRankML: 50
        });
        const generatedTrashStrings = ref([]);

        const generateTrashString = () => {
            const config = trashConfig.value;
            const groups = {};
            
            // Group by Dex Number (pokemonId)
            allPokemons.value.forEach(p => {
                if (!groups[p.pokemonId]) groups[p.pokemonId] = [];
                groups[p.pokemonId].push(p);
            });

            const speciesToDeleteIds = [];
            const selectiveStrings = [];
            let totalCovered = 0;

            Object.entries(groups).forEach(([dexNr, pokemons]) => {
                const keepers = [];
                const trash = [];

                pokemons.forEach(p => {
                    let keep = false;
                    const iv = getIvPercentAsNumber(p);

                    if (config.keepShiny && p.pokemonDisplay.shiny) keep = true;
                    else if (config.keepLucky && p.isLucky) keep = true;
                    else if (config.keepShadow && p.pokemonDisplay.alignment === 1) keep = true;
                    else if (config.keepPurified && p.pokemonDisplay.alignment === 2) keep = true;
                    else if (config.keepLegendary && (p.pokemonClass === 'POKEMON_CLASS_LEGENDARY' || p.pokemonClass === 'POKEMON_CLASS_MYTHIC')) keep = true;
                    else if (config.keepCostume && p.pokemonDisplay.costume > 0) keep = true;
                    else if (config.keepFavorite && p.favorite) keep = true;
                    else if (config.keepBackground && p.pokemonDisplay.locationCard) keep = true;
                    else if (config.keepXXSXXL && (p.size === 1 || p.size === 5)) keep = true;
                    else if (config.keep4Star && iv === 100) keep = true;
                    else if (config.keepNundo && iv === 0) keep = true;
                    else if (config.useMinIv && iv >= config.minIvPercent) keep = true;
                    
                    // PvP Ranks
                    if (!keep) {
                        if (config.useRankGL && p.rankGreat && p.rankGreat <= config.keepRankGL && p.cp <= 1500) keep = true;
                        else if (config.useRankUL && p.rankUltra && p.rankUltra <= config.keepRankUL && p.cp <= 2500) keep = true;
                        else if (config.useRankML && p.rankMaster && p.rankMaster <= config.keepRankML) keep = true;
                    }

                    if (keep) keepers.push(p);
                    else trash.push(p);
                });

                if (keepers.length === 0 && trash.length > 0) {
                    speciesToDeleteIds.push(dexNr);
                    totalCovered += trash.length;
                } else if (trash.length > 0) {
                    // Mixed Species
                    const keeperCps = [...new Set(keepers.map(k => k.cp))];
                    
                    // Exclude all Keeper CPs. 
                    // Any trash with same CP as a keeper is SAVED (False Negative) to be safe.
                    if (keeperCps.length > 0) {
                        const cpExclusions = keeperCps.map(cp => `!cp${cp}`).join('&');
                        selectiveStrings.push(`${dexNr}&${cpExclusions}`);
                    } else {
                        speciesToDeleteIds.push(dexNr);
                    }
                    totalCovered += trash.length;
                }
            });

            const results = [];
            
            if (speciesToDeleteIds.length > 0) {
                results.push({
                    desc: 'Safe Species (Transfer All)',
                    text: speciesToDeleteIds.join(','),
                    count: speciesToDeleteIds.length + ' species'
                });
            }

            if (selectiveStrings.length > 0) {
                results.push({
                    desc: 'Selective Trash (Excludes Keepers)',
                    text: selectiveStrings.join(','),
                    count: selectiveStrings.length + ' filter rules'
                });
            }

            if (results.length === 0) {
                results.push({
                    desc: 'Result',
                    text: 'No trash found based on current criteria.',
                    count: 0
                });
            }

            generatedTrashStrings.value = results;
        };

        const copyToClipboard = (text) => {
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard!');
            });
        };

        const getPokemonTypeColors = (pokedexEntry) => {
            const colors = [];
            if (pokedexEntry?.primaryType?.type) {
                const type = pokedexEntry.primaryType.type.replace('POKEMON_TYPE_', '');
                colors.push(pokedexService.value.typeColorMap[type] || '#FFFFFF');
            }
            if (pokedexEntry?.secondaryType?.type) {
                const type = pokedexEntry.secondaryType.type.replace('POKEMON_TYPE_', '');
                colors.push(pokedexService.value.typeColorMap[type] || '#FFFFFF');
            }
            return colors;
        };

        const getPokemonName = (dexNr, formName) => {
            const defaultName = `Pokedex #${dexNr}`;
            const species = pokedexLookup.value[dexNr];
            if (!species) return defaultName;
            const normalEntry = species['NORMAL'] || Object.values(species)[0];
            if (!normalEntry) return defaultName;
            
            const safeFormName = formName || '';
            const baseName = (normalEntry.names && normalEntry.names.English) ? normalEntry.names.English.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
            
            const formKey = safeFormName.replace(baseName, '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim() || 'NORMAL';
            const entry = species[formKey] || normalEntry;
            return entry?.names?.English || defaultName;
        };

        const getPokemonSprite = (p) => {
            const defaultSprite = `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_${String(p.pokemonId).padStart(3, '0')}_00.png`;
            const shinySprite = `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_${String(p.pokemonId).padStart(3, '0')}_00_shiny.png`;
            const targetSprite = (p.pokemonDisplay && p.pokemonDisplay.shiny) ? 'shinyImage' : 'image';

            const species = pokedexLookup.value[p.pokemonId];
            const basePokemon = species ? (species['NORMAL'] || Object.values(species)[0]) : null;
            if (!basePokemon || !basePokemon.assetForms) {
                return (p.pokemonDisplay && p.pokemonDisplay.shiny) ? shinySprite : defaultSprite;
            }

            const safeFormName = (p.pokemonDisplay && p.pokemonDisplay.formName) ? p.pokemonDisplay.formName.toUpperCase() : '';
            const baseNameUpper = basePokemon.names.English.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            let formKey;
            if (p.pokemonId === 201) {
                formKey = safeFormName.replace(/[^A-Z0-9]/g, '').trim();
            } else {
                formKey = safeFormName.replace(baseNameUpper, '').replace(/[^A-Z0-9]/g, '').trim();
            }

            if (formKey === "" || formKey === "NORMAL") formKey = null;

            let costumeKey = null;
            const costumeId = p.pokemonDisplay ? p.pokemonDisplay.costume : null;
            if (costumeId && costumeIdMap.value[costumeId]) {
                costumeKey = costumeIdMap.value[costumeId].toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
            }

            let foundAsset = null;
            const gender = p.pokemonDisplay ? p.pokemonDisplay.gender : 1;
            const isFemale = gender === 2;

            const findAsset = (costume, form) => {
                const costumeMatches = (assetCostume) => {
                    if (costume) return assetCostume === costume;
                    return !assetCostume || assetCostume === 'NONE';
                };
                const formMatches = (assetForm) => {
                    if (form && form !== 'NORMAL') return assetForm === form;
                    return !assetForm || assetForm === 'NORMAL';
                };

                // 1. Try Exact Gender Match
                let match = basePokemon.assetForms.find(asset => 
                   costumeMatches(asset.costume) &&
                   formMatches(asset.form) &&
                   asset.isFemale === isFemale
                );
                if (match) return match;

                // 2. Fallback to undefined gender
                match = basePokemon.assetForms.find(asset => 
                   costumeMatches(asset.costume) &&
                   formMatches(asset.form) &&
                   asset.isFemale === undefined
                );
                if (match) return match;

                // 3. Fallback: ignore gender flag if we have a specific form/costume target
                if (form || costume) {
                    return basePokemon.assetForms.find(asset => 
                       costumeMatches(asset.costume) &&
                       formMatches(asset.form)
                    );
                }
                return null;
            };

            if (costumeKey && formKey) {
                foundAsset = findAsset(costumeKey, formKey);
            }
            if (!foundAsset && costumeKey) {
                foundAsset = findAsset(costumeKey, null);
            }
            if (!foundAsset && formKey) {
                foundAsset = findAsset(null, formKey);
            }
            if (!foundAsset) {
                foundAsset = findAsset(null, null);
            }
            
            // Special Fallback: If female and no asset found yet, try looking for 'FEMALE' form
            if (!foundAsset && isFemale && !formKey) {
                foundAsset = findAsset(costumeKey, 'FEMALE');
            }

            return foundAsset?.[targetSprite] || ((p.pokemonDisplay && p.pokemonDisplay.shiny) ? shinySprite : defaultSprite);
        };

        const enrichPokemonData = (pokemons) => {
            return pokemons.map(p => {
                if (p.isEgg || !p.pokemonDisplay) return p;
                const entry = getPokedexEntry(p);
                return {
                    ...p,
                    name: getPokemonName(p.pokemonId, p.pokemonDisplay.formName),
                    sprite: getPokemonSprite(p),
                    typeColors: getPokemonTypeColors(entry),
                    pokemonClass: entry?.pokemonClass,
                    isMaxLevel: (p.cpMultiplier + (p.additionalCpMultiplier || 0)) > 0.83,
                    specialForm: p.pokemonDisplay.breadModeEnum === 1 ? 'Dynamax' : (p.pokemonDisplay.breadModeEnum === 2 ? 'Gigantamax' : null)
                };
            });
        };

        // --- Lifecycle Hook ---
        onMounted(async () => {
            try {
                // Fetch comprehensive move data for DPS calculation
                const combatMovesResponse = await fetch('/api/combat-moves');
                if (combatMovesResponse.ok) {
                    combatMoves.value = await combatMovesResponse.json();
                    
                    // Populate moveMap for display
                    const map = {};
                    if (combatMoves.value.fastMoves) {
                        combatMoves.value.fastMoves.forEach(m => map[m.move_id] = m);
                    }
                    if (combatMoves.value.chargedMoves) {
                        combatMoves.value.chargedMoves.forEach(m => map[m.move_id] = m);
                    }
                    moveMap.value = map;
                } else {
                    console.error("Failed to load combat moves:", combatMovesResponse.status);
                }

                // Fetch primary player data
                const response = await fetch('/api/private-data');
                if (!response.ok) throw new Error((await response.json()).message || 'Could not load data.');
                const responseData = await response.json();

                account.value = responseData.playerData.account || {};
                player.value = responseData.playerData.player || {};
                items.value = responseData.playerData.items || [];
                const rawPokemons = responseData.playerData.pokemons.filter(p => !p.isEgg && p.pokemonId !== 0);
                pokedexService.value = responseData.pokedexService || { typeColorMap: {}, pokedex: null };
                pvpDataVersion.value = responseData.pvpDataVersion || 0;

                if (account.value.preferences && account.value.preferences.avatarId) {
                    currentAvatarId.value = account.value.preferences.avatarId;
                }

                // Wait for pokedex to load before enriching
                const pokedexResponse = await fetch('/data/user/generated/pokedex_client.json');
                if (pokedexResponse.ok) {
                    const minifiedData = await pokedexResponse.json();
                    
                    const DECODE_MAPPING = {
                        i: 'id', f: 'formId', d: 'dexNr', n: 'names', s: 'stats', 
                        t1: 'primaryType', t2: 'secondaryType', c: 'pokemonClass',
                        a: 'assetForms', r: 'regionForms', m: 'megaEvolutions', as: 'assets',
                        e: 'English', ty: 'type', st: 'stamina', at: 'attack', de: 'defense',
                        im: 'image', sh: 'shinyImage', co: 'costume', fo: 'form', if: 'isFemale'
                    };

                    const decode = (obj) => {
                        if (Array.isArray(obj)) return obj.map(decode);
                        if (obj !== null && typeof obj === 'object') {
                            const newObj = {};
                            for (const key in obj) {
                                const newKey = DECODE_MAPPING[key] || key;
                                newObj[newKey] = decode(obj[key]);
                            }
                            return newObj;
                        }
                        return obj;
                    };
                    
                    allPokedex.value = decode(minifiedData);

                    const costumeResponse = await fetch('/data/user/custom/costumeIdMap.json');
                    if (costumeResponse.ok) {
                        costumeIdMap.value = await costumeResponse.json();
                    }

                    // ENRICH DATA LOCALLY
                    allPokemons.value = enrichPokemonData(rawPokemons);

                    // --- Initialize PvP Worker ---
                    if (allPokemons.value && allPokemons.value.length > 0 && pokedexLookup.value) {
                        
                        const generateCacheKey = (pokemons) => {
                            let sumTime = 0;
                            for (let i = 0; i < pokemons.length; i++) {
                                sumTime += (pokemons[i].creationTimeMs || 0);
                            }
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = (now.getMonth() + 1).toString().padStart(2, '0');
                            const day = now.getDate().toString().padStart(2, '0');
                            const hour = now.getHours().toString().padStart(2, '0');
                            return `pvp_${pokemons.length}_${sumTime}_${year}_${month}_${day}_${hour}_v${pvpDataVersion.value}`;
                        };

                        const cacheKey = generateCacheKey(allPokemons.value);
                        const cachedDataRaw = localStorage.getItem('pvp_cache');
                        let loadedFromCache = false;

                        if (cachedDataRaw) {
                            try {
                                const cachedData = JSON.parse(cachedDataRaw);
                                if (cachedData.key === cacheKey) {
                                    const ranks = cachedData.results;
                                    allPokemons.value.forEach(p => {
                                        if (ranks[p.id]) {
                                            p.rankGreat = ranks[p.id].rankGreat;
                                            p.rankUltra = ranks[p.id].rankUltra;
                                            p.rankMaster = ranks[p.id].rankMaster;
                                        }
                                    });
                                    allPokemons.value = [...allPokemons.value];
                                    loadedFromCache = true;
                                }
                            } catch (e) {
                                localStorage.removeItem('pvp_cache');
                            }
                        }

                        if (!loadedFromCache) {
                            const pvpContainer = document.getElementById('pvp-progress-container');
                            const pvpBar = document.getElementById('pvp-progress-bar');
                            if (pvpContainer) pvpContainer.classList.add('active');

                            const payload = allPokemons.value.map(p => {
                                const entry = getPokedexEntry(p);
                                return {
                                    id: p.pokemonId,
                                    form: entry ? (entry.formId || 'NORMAL') : 'NORMAL',
                                    ivs: { atk: p.individualAttack, def: p.individualDefense, sta: p.individualStamina },
                                    uniqueId: p.id
                                };
                            });
                            
                            // BATCHED PVP LOOKUP (500 per request)
                            const BATCH_SIZE = 500;
                            const totalBatches = Math.ceil(payload.length / BATCH_SIZE);
                            let combinedRanks = {};

                            const fetchBatch = async (batchIdx) => {
                                const start = batchIdx * BATCH_SIZE;
                                const end = start + BATCH_SIZE;
                                const batchPayload = payload.slice(start, end);

                                if (pvpBar) pvpBar.style.width = `${((batchIdx + 1) / totalBatches) * 100}%`;

                                const res = await fetch('/api/pvp-ranks', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ pokemons: batchPayload })
                                });
                                const batchRanks = await res.json();
                                Object.assign(combinedRanks, batchRanks);

                                // Apply this batch's ranks immediately for better UX
                                allPokemons.value.forEach(p => {
                                    if (batchRanks[p.id]) {
                                        p.rankGreat = batchRanks[p.id].rankGreat;
                                        p.rankUltra = batchRanks[p.id].rankUltra;
                                        p.rankMaster = batchRanks[p.id].rankMaster;
                                    }
                                });
                                allPokemons.value = [...allPokemons.value];

                                if (batchIdx + 1 < totalBatches) {
                                    await fetchBatch(batchIdx + 1);
                                } else {
                                    // Done!
                                    try {
                                        localStorage.setItem('pvp_cache', JSON.stringify({
                                            key: cacheKey,
                                            results: combinedRanks
                                        }));
                                    } catch (e) { }
                                    
                                    setTimeout(() => {
                                         if (pvpContainer) pvpContainer.classList.remove('active');
                                    }, 1000);
                                }
                            };

                            fetchBatch(0).catch(err => {
                                console.error("PvP Batch Error:", err);
                                if (pvpContainer) pvpContainer.classList.remove('active');
                            });
                        }
                    }
                }

                const typeEffectivenessResponse = await fetch('/data/public/type_effectiveness.json');
                if (typeEffectivenessResponse.ok) {
                    typeEffectiveness.value = await typeEffectivenessResponse.json();
                }

                const raidBossesResponse = await fetch('/data/public/raidboss.json');
                if (raidBossesResponse.ok) {
                    const data = await raidBossesResponse.json();
                    
                    const processBossList = (list) => {
                        return list.map(boss => ({
                            ...boss,
                            typeColors: boss.types.map(t => pokedexService.value.typeColorMap[t.toUpperCase()] || '#ccc')
                        }));
                    };

                    const allBosses = [];
                    for (const level in data.currentList) {
                        allBosses.push(...processBossList(data.currentList[level]));
                    }
                    raidBosses.value = allBosses;
                }

                // Fetch Max Battles
                const maxBattlesResponse = await fetch('/data/public/max_battles.json');
                if (maxBattlesResponse.ok) {
                    const data = await maxBattlesResponse.json();
                    maxBattles.value = data.map(boss => ({
                        ...boss,
                        typeColors: boss.types.map(t => pokedexService.value.typeColorMap[t.toUpperCase()] || '#ccc')
                    }));
                }

                updateActiveTabFromHash();
                window.addEventListener('hashchange', updateActiveTabFromHash);

                window.addEventListener('scroll', handleScroll);
                const pokemonList = document.getElementById('all-pokemon-list');
                if (pokemonList) {
                    pokemonList.addEventListener('scroll', handleScroll);
                }

            } catch (error) {
                console.error('Dashboard Error:', error);
                document.querySelector('.container').innerHTML = `<div class="card"><p>Could not load your player data. Reason: ${error.message}</p></div>`;
            } finally {
                loading.value = false;
            }
        });

        // --- Expose to Template ---
        return {
            showScrollTop, scrollToTop,
            loading, account, player, items, activeTab, searchQuery, sortKey, sortDirection, itemsExpanded, selectedPokemon, moveMap, costumeIdMap, pokedexService,
            teamColor, xpPercentage, xpProgressText, stardust, pokecoins, highlights,
            groupedItems, itemCategoryOrder, filteredPokemon,
            totalPokeBalls, totalPotions, totalRevives,
            toggleSortDirection, getItemSprite, createBackgroundStyle, getIvPercent, getCardClass, getBadges, getLevelFromCpm, openPokemonModal, displayMove, getIvColor, getPokemonTypes,
            showCleanupModal, openCleanupModal, closeCleanupModal, cleanupSearchQuery, groupSubstitutes, defaultCleanupData, formGroupedCleanupData,
            showTeamBuilderModal, openTeamBuilderModal, closeTeamBuilderModal, selectedRaidBoss, raidBosses,
            maxBattles, selectedMaxBoss,
            teamBuilderMode, customEnemies, activeTeamBuilderTab, allPokedex, allPokedexNames, activeTabSuggestions, addCustomEnemy, removeCustomEnemy,             customEnemyInput, battleMode,
            getMoveTypeIconUrl,
            pvpProgress,
            combatMoves,
            calculateDps,
            pokedexMode,
            pokedexDisplayData,

            // Statistics
            stats_shinyRate,
            stats_perfectNundo,
            stats_megaEvolvedList,
            stats_ivDistribution,
            stats_luckyRate,
            stats_legendaryRatio,
            stats_cpDistribution,
            stats_captureByYear,
            stats_mostCommon,
            stats_acquisitionType,

            // Trash String
            showTrashModal,
            trashConfig,
            generatedTrashStrings,
            generateTrashString,
            copyToClipboard,

            // Avatar Selection
            showAvatarModal,
            visibleAvatars,
            loadingAvatars,
            currentAvatarUrl,
            openAvatarModal,
            handleAvatarScroll,
            selectAvatar,
            pendingAvatarId,
            saveAvatar,
            savingAvatar
        };
    }
}).mount('#app');
