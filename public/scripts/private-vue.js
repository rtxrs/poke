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
                <div class="pvp-ranks">
                    <span v-if="p.rankGreat && p.rankGreat <= 100 && p.cp <= 1500" :class="['pvp-badge', 'great', { 'rank-1': p.rankGreat <= 10, 'rank-good': p.rankGreat > 10 && p.rankGreat <= 25 }]">GL #{{ p.rankGreat }}</span>
                    <span v-if="p.rankUltra && p.rankUltra <= 100 && p.cp <= 2500" :class="['pvp-badge', 'ultra', { 'rank-1': p.rankUltra <= 10, 'rank-good': p.rankUltra > 10 && p.rankUltra <= 25 }]">UL #{{ p.rankUltra }}</span>
                    <span v-if="p.rankMaster && p.rankMaster <= 100" :class="['pvp-badge', 'master', { 'rank-1': p.rankMaster <= 10, 'rank-good': p.rankMaster > 10 && p.rankMaster <= 25 }]">ML #{{ p.rankMaster }}</span>
                </div>
                <p v-if="p.score" class="pokemon-score">Score: {{ p.score.toFixed(2) }}</p>
                <div class="iv-bar-container">
                    <div class="iv-bar" :style="{ width: getIvPercent(p) + '%', backgroundColor: getIvColor(getIvPercent(p)) }"></div>
                </div>
                <small>{{ getIvPercent(p) }}% ({{ p.individualAttack }}/{{ p.individualDefense }}/{{ p.individualStamina }})</small>
            </div>
        </div>
    `,
    methods: {
        getIvPercent(p) { return p ? ((p.individualAttack + p.individualDefense + p.individualStamina) / 45 * 100).toFixed(1) : 0; },
        displayName(p) { return p.nickname || p.name; },
        getBadges(p, name) {
            const badges = [];
            if (!p || !p.pokemonDisplay) return name;

            if (p.pokemonDisplay.isStrongPokemon) badges.push('<span class="badge mighty-badge">Mighty</span>');
            if (p.pokemonDisplay.shiny) badges.push('<span class="badge shiny-badge">Shiny</span>');
            if (p.isLucky) {
                badges.push('<span class="badge lucky-badge">Lucky</span>');
            } else if (p.tradedTimeMs > 0) {
                badges.push('<span class="badge traded-badge">Traded</span>');
            }
            
            const ivPercent = this.getIvPercent(p);
            if (p.individualAttack === 0 && p.individualDefense === 0 && p.individualStamina === 0) {
                badges.push('<span class="badge zero-iv-badge">0 IV</span>');
            } else if (ivPercent >= 100) {
                badges.push('<span class="badge perfect-badge">Perfect</span>');
            }

            if (p.pokemonDisplay.alignment === 1) badges.push('<span class="badge shadow-badge">Shadow</span>');
            if (p.pokemonDisplay.alignment === 2) badges.push('<span class="badge purified-badge">Purified</span>');

            if (p.pokemonClass === 'POKEMON_CLASS_LEGENDARY') badges.push('<span class="badge legendary-badge">Legendary</span>');
            if (p.pokemonClass === 'POKEMON_CLASS_MYTHIC') badges.push('<span class="badge mythical-badge">Mythical</span>');

            if (p.pokemonDisplay.breadModeEnum === 1) badges.push('<span class="badge dynamax-badge">Dynamax</span>');
            if (p.pokemonDisplay.breadModeEnum === 2) badges.push('<span class="badge gigantamax-badge">G-Max</span>');

            if (p.isMaxLevel) badges.push('<span class="badge max-level-badge">Max</span>');

            if (p.pokemonDisplay.locationCard) {
                badges.push('<span class="badge background-badge">Background</span>');
            }

            if (badges.length > 0) {
                return `${name}<br>${badges.join(' ')}`;
            }
            return name;
        },
        getCardClass(p) { return 'pokemon-card'; },
        // Make global helpers available in this component's template
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

// --- Main Vue App Instance ---
createApp({
    components: {
        'grid-component': GridComponent,
        'raid-boss-selector': RaidBossSelector
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
        const sortKey = ref('caughtTime');
        const itemsExpanded = ref(false);
        const defaultSortDirections = { caughtTime: 'desc', cp: 'desc', pokedex: 'asc', name: 'asc' };
        const sortDirection = ref(defaultSortDirections.caughtTime);
        const selectedPokemon = ref(null);
        const moveMap = ref({});
        const costumeIdMap = ref({});

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
            if (!pokedexService.value.pokedex) return [];

            const megaEvolvedIds = new Set();
            allPokemons.value.forEach(p => {
                if (p.hasMegaEvolved) {
                    megaEvolvedIds.add(p.pokemonId);
                }
            });

            return Array.from(megaEvolvedIds).map(id => {
                const allForms = pokedexService.value.pokedex[id];
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
            if (!pokedexService.value.pokedex || allPokemons.value.length === 0) {
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
                const pokemonData = pokedexService.value.pokedex[id];
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
            return Math.max(0, (xpProgress / xpForLevel) * 100);
        });

        const xpProgressText = computed(() => {
             if (!player.value.nextLevelExp) return "0 / 0 XP";
            const xpForLevel = player.value.nextLevelExp - player.value.prevLevelExp;
            const xpProgress = player.value.experience - player.value.prevLevelExp;
            return `${Math.max(0, xpProgress).toLocaleString()} / ${xpForLevel.toLocaleString()} XP`;
        });

        const stardust = computed(() => account.value.currencyBalance?.find(c => c.currencyType === 'STARDUST')?.quantity || 0);
        const pokecoins = computed(() => account.value.currencyBalance?.find(c => c.currencyType === 'POKECOIN')?.quantity || 0);
        const getIvPercent = (p) => p ? ((p.individualAttack + p.individualDefense + p.individualStamina) / 45 * 100).toFixed(1) : 0;
        const getIvPercentAsNumber = (p) => p ? ((p.individualAttack + p.individualDefense + p.individualStamina) / 45 * 100) : 0;
        
        const getPokedexEntry = (p) => {
            if (!pokedexService.value.pokedex || !pokedexService.value.pokedex[p.pokemonId]) return null;

            const basePokemonData = Object.values(pokedexService.value.pokedex[p.pokemonId])[0];
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
            const allFormsForPokemon = pokedexService.value.pokedex[p.pokemonId];
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
            if (p.isLucky) score += 10;
            if (p.pokemonClass === 'POKEMON_CLASS_LEGENDARY') score += 15;
            if (p.pokemonDisplay?.costume > 0) score += 10;
            if (p.pokemonDisplay.breadModeEnum === 1 || p.pokemonDisplay.breadModeEnum === 2) score += 5;
            
            return score;
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

        const evaluateTerm = (p, term, pokedexService, moveMap, getIvPercentAsNumber) => {
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
        };

        const filterPokemon = (pokemons, query) => {
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
                        evaluationStack.push(evaluateTerm(p, token, pokedexService, moveMap, getIvPercentAsNumber));
                    }
                });
                return evaluationStack[0];
            });
        };

        const filteredPokemon = computed(() => {
            let pokemons = filterPokemon([...allPokemons.value], searchQuery.value);
            
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
            const pokemonsToProcess = filterPokemon(allPokemons.value, cleanupSearchQuery.value);
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
            const pokemonsToProcess = filterPokemon(allPokemons.value, cleanupSearchQuery.value);
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
        const typeEffectiveness = ref({});

        // New state for custom team builder
        const teamBuilderMode = ref('raid'); // 'raid' or 'custom'
        const customEnemies = ref([]);
        const activeTeamBuilderTab = ref('Overall');
        const allPokedex = ref([]); // To populate the custom enemy selector
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

        // --- Methods ---
        const openTeamBuilderModal = () => { showTeamBuilderModal.value = true; };
        const closeTeamBuilderModal = () => { showTeamBuilderModal.value = false; };

        const calculateEffectivenessScore = (pokemon, bossTypes) => {
            const pokemonInfo = getPokedexEntry(pokemon);
            if (!pokemonInfo) return 0;

            const pokemonTypes = [pokemonInfo.primaryType.names.English];
            if (pokemonInfo.secondaryType) {
                pokemonTypes.push(pokemonInfo.secondaryType.names.English);
            }

            // Offensive score
            let fastMoveScore = 1;
            const move1Type = moveMap.value[pokemon.move1]?.type;
            
            if (move1Type) {
                let move1Multiplier = 1;
                bossTypes.forEach(bossType => {
                    move1Multiplier *= typeEffectiveness.value[move1Type][bossType] || 1;
                });
                fastMoveScore = move1Multiplier;
            }

            const move2Type = moveMap.value[pokemon.move2]?.type;
            const move3Type = moveMap.value[pokemon.move3]?.type;

            let bestChargedMoveScore = 1;
            if (move2Type) {
                let move2Multiplier = 1;
                bossTypes.forEach(bossType => {
                    move2Multiplier *= typeEffectiveness.value[move2Type][bossType] || 1;
                });
                bestChargedMoveScore = move2Multiplier;
            }

            if (move3Type) {
                let move3Multiplier = 1;
                bossTypes.forEach(bossType => {
                    move3Multiplier *= typeEffectiveness.value[move3Type][bossType] || 1;
                });
                bestChargedMoveScore = Math.max(bestChargedMoveScore, move3Multiplier);
            }
            
            const offensiveScore = (fastMoveScore + bestChargedMoveScore) / 2;
            
            // Defensive score
            let defensiveScore = 1;
            bossTypes.forEach(bossType => {
                pokemonTypes.forEach(pokemonType => {
                    defensiveScore *= typeEffectiveness.value[bossType][pokemonType] || 1;
                });
            });

            // CP Score
            const cpScore = pokemon.cp / 3000;

            // Combine scores
            return (offensiveScore / (defensiveScore ** 0.5)) * cpScore;
        };

        const generateSuggestions = () => {
            let enemies = [];
            if (teamBuilderMode.value === 'raid') {
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

                const rankedPokemon = pokemonPool.map(pokemon => {
                    const score = calculateEffectivenessScore(pokemon, enemyTypes);
                    overallScores[pokemon.id].score += score;
                    return { ...pokemon, score };
                }).sort((a, b) => b.score - a.score);

                suggestions[enemy.names.English] = rankedPokemon.slice(0, 12);
            });

            const overallRanked = Object.values(overallScores).sort((a, b) => b.score - a.score);
            suggestions['Overall'] = overallRanked.slice(0, 12);

            allTeamSuggestions.value = suggestions;
        };

        const activeTabSuggestions = computed(() => {
            if (teamBuilderMode.value === 'raid') {
                const boss = raidBosses.value.find(b => b.id === selectedRaidBoss.value);
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
            battleMode.value = 'standard';
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
        const getCardClass = (p) => 'pokemon-card';
        const getBadges = (p, name) => {
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
            }
            else if (ivPercent >= 100) {
                badges.push('<span class="badge perfect-badge">Perfect</span>');
            }

            if (p.pokemonDisplay.alignment === 1) badges.push('<span class="badge shadow-badge">Shadow</span>');
            if (p.pokemonDisplay.alignment === 2) badges.push('<span class="badge purified-badge">Purified</span>');

            if (p.pokemonClass === 'POKEMON_CLASS_LEGENDARY') badges.push('<span class="badge legendary-badge">Legendary</span>');
            if (p.pokemonClass === 'POKEMON_CLASS_MYTHIC') badges.push('<span class="badge mythical-badge">Mythical</span>');

            if (p.pokemonDisplay.breadModeEnum === 1) badges.push('<span class="badge dynamax-badge">Dynamax</span>');
            if (p.pokemonDisplay.breadModeEnum === 2) badges.push('<span class="badge gigantamax-badge">G-Max</span>');

            if (p.isMaxLevel) badges.push('<span class="badge max-level-badge">Max</span>');

            if (p.pokemonDisplay.locationCard) {
                badges.push('<span class="badge background-badge">Background</span>');
            }

            if (badges.length > 0) {
                return `${name}<br>${badges.join(' ')}`;
            }
            return name;
        };

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
            const validTabs = ['character', 'pokemon', 'statistics', 'tools'];
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


        const pvpProgress = ref(-1); // Progress -1 (Hidden), 0-100 (Visible)

        // --- Lifecycle Hook ---
        onMounted(async () => {
            try {
                // Fetch primary player data
                const response = await fetch('/api/private-data');
                if (!response.ok) throw new Error((await response.json()).message || 'Could not load data.');
                const responseData = await response.json();

                account.value = responseData.playerData.account || {};
                player.value = responseData.playerData.player || {};
                items.value = responseData.playerData.items || [];
                const rawPokemons = responseData.playerData.pokemons.filter(p => !p.isEgg && p.pokemonId !== 0);
                pokedexService.value = responseData.pokedexService || { typeColorMap: {}, pokedex: null };

                allPokemons.value = rawPokemons;

                // Fetch move map data from the new API endpoint
                const movesResponse = await fetch('/api/moves');
                if (movesResponse.ok) {
                    moveMap.value = await movesResponse.json();
                }

                const costumeResponse = await fetch('/data/costumeIdMap.json');
                if (costumeResponse.ok) {
                    costumeIdMap.value = await costumeResponse.json();
                }

                const typeEffectivenessResponse = await fetch('/data/type_effectiveness.json');
                if (typeEffectivenessResponse.ok) {
                    typeEffectiveness.value = await typeEffectivenessResponse.json();
                }

                const raidBossesResponse = await fetch('/data/raidboss.json');
                if (raidBossesResponse.ok) {
                    const raidBossData = await raidBossesResponse.json();
                    const currentBosses = Object.values(raidBossData.currentList).flat();
                    const groupOrder = ['mega', 'shadow_lvl5', 'lvl5', 'shadow_lvl3', 'lvl3', 'shadow_lvl1', 'lvl1'];
                    
                    currentBosses.forEach(boss => {
                        if (boss.types) {
                            boss.typeColors = boss.types.map(type => pokedexService.value.typeColorMap[type.toUpperCase()]);
                        } else {
                            boss.typeColors = [];
                        }
                    });

                    raidBosses.value = currentBosses.sort((a, b) => {
                        const levelA = groupOrder.indexOf(a.level);
                        const levelB = groupOrder.indexOf(b.level);
                        if (levelA !== levelB) {
                            return levelA - levelB;
                        }
                        return a.names.English.localeCompare(b.names.English);
                    });
                    if (raidBosses.value.length > 0) {
                        selectedRaidBoss.value = raidBosses.value[0].id;
                    }
                }

                const pokedexResponse = await fetch('/data/pokedex_modified.json');
                if (pokedexResponse.ok) {
                    allPokedex.value = await pokedexResponse.json();

                    // --- Initialize PvP Worker ---
                    if (allPokemons.value && allPokemons.value.length > 0 && window.Worker && pokedexService.value.pokedex) {
                        
                        // --- Cache Logic ---
                        const generateCacheKey = (pokemons) => {
                            let sumTime = 0;
                            // Sum creation times to detect changes (simple but effective for this dataset)
                            // Using a simple loop for performance
                            for (let i = 0; i < pokemons.length; i++) {
                                sumTime += (pokemons[i].creationTimeMs || 0);
                            }
                            return `pvp_v1_${pokemons.length}_${sumTime}`;
                        };

                        const cacheKey = generateCacheKey(allPokemons.value);
                        const cachedDataRaw = localStorage.getItem('pvp_cache');
                        let loadedFromCache = false;

                        if (cachedDataRaw) {
                            try {
                                const cachedData = JSON.parse(cachedDataRaw);
                                if (cachedData.key === cacheKey) {
                                    console.log("Loading PvP Ranks from Cache...");
                                    const ranks = cachedData.results;
                                    allPokemons.value.forEach(p => {
                                        if (ranks[p.id]) {
                                            p.rankGreat = ranks[p.id].rankGreat;
                                            p.rankGreatPercent = ranks[p.id].rankGreatPercent;
                                            p.rankUltra = ranks[p.id].rankUltra;
                                            p.rankUltraPercent = ranks[p.id].rankUltraPercent;
                                            p.rankMaster = ranks[p.id].rankMaster;
                                            p.rankMasterPercent = ranks[p.id].rankMasterPercent;
                                        }
                                    });
                                    allPokemons.value = [...allPokemons.value]; // Force reactivity
                                    loadedFromCache = true;
                                    console.log("PvP Ranks loaded from Cache.");
                                }
                            } catch (e) {
                                console.warn("Error loading PvP cache:", e);
                                localStorage.removeItem('pvp_cache');
                            }
                        }

                        if (!loadedFromCache) {
                            console.log("Starting PvP Worker...");
                            const pvpWorker = new Worker('/scripts/pvp-worker.js');
                            pvpProgress.value = 0; // Reset progress start
                            
                            // Reset DOM Width immediately & Force Active Class
                            const pvpBar = document.getElementById('pvp-progress-bar');
                            const pvpContainer = document.getElementById('pvp-progress-container');
                            if (pvpContainer) pvpContainer.classList.add('active');
                            if (pvpBar) pvpBar.style.width = '0%';

                            pvpWorker.postMessage({
                                pokemons: JSON.parse(JSON.stringify(allPokemons.value)),
                                pokedex: JSON.parse(JSON.stringify(pokedexService.value.pokedex))
                            });

                            pvpWorker.onmessage = (e) => {
                                const msg = e.data;
                                if (msg.type === 'progress') {
                                    // Direct DOM update for performance
                                    const bar = document.getElementById('pvp-progress-bar');
                                    if (bar) bar.style.width = msg.value + '%';

                                    pvpProgress.value = msg.value;
                                } else if (msg.type === 'result') {
                                    const ranks = msg.data;
                                    
                                    // Save to Cache
                                    try {
                                        localStorage.setItem('pvp_cache', JSON.stringify({
                                            key: cacheKey,
                                            results: ranks
                                        }));
                                    } catch (e) {
                                        console.warn("Failed to save PvP cache (likely quota exceeded):", e);
                                    }

                                    // Direct DOM completion
                                    const bar = document.getElementById('pvp-progress-bar');
                                    if (bar) bar.style.width = '100%';
                                    
                                    pvpProgress.value = 100; // Visual completion

                                    // Yield to UI thread to render the 100% bar before freezing for data update
                                    setTimeout(() => {
                                        console.log("PvP Worker finished. Updating Pokemons...");
                                        
                                        allPokemons.value.forEach(p => {
                                            if (ranks[p.id]) {
                                                p.rankGreat = ranks[p.id].rankGreat;
                                                p.rankGreatPercent = ranks[p.id].rankGreatPercent;
                                                p.rankUltra = ranks[p.id].rankUltra;
                                                p.rankUltraPercent = ranks[p.id].rankUltraPercent;
                                                p.rankMaster = ranks[p.id].rankMaster;
                                                p.rankMasterPercent = ranks[p.id].rankMasterPercent;
                                            }
                                        });
                                                                                                                // Force reactivity update
                                                                                                                allPokemons.value = [...allPokemons.value];
                                                                                                                
                                                                                                                setTimeout(() => { 
                                                                                                                    pvpProgress.value = -1;
                                                                                                                    const pvpContainer = document.getElementById('pvp-progress-container');
                                                                                                                    if (pvpContainer) pvpContainer.classList.remove('active');
                                                                                                                }, 1000); // Hide after 1s
                                                                                                                
                                                                                                                console.log("PvP Ranks updated in UI.");
                                                                                                                pvpWorker.terminate();                                    }, 50);
                                }
                            };
                        }
                    }
                }

                // Update the main title with the player's name and userId
                const mainTitle = document.getElementById('main-title');
                if (account.value.name && account.value.userId) {
                    document.title = `Pokemon GO | ${account.value.name} #${account.value.userId}`;
                    if (mainTitle) {
                        mainTitle.innerHTML = `${account.value.name} | <span class="player-badge" style="${generateGradient(account.value.publicId)}">#${account.value.userId}</span>`;
                    }
                } else if (account.value.name) {
                    document.title = `Pokemon GO | ${account.value.name}'s Profile`;
                    if (mainTitle) {
                        mainTitle.textContent = `${account.value.name}'s Profile`;
                    }
                } else {
                    document.title = `Pokemon GO | My Profile`;
                    if (mainTitle) {
                        mainTitle.textContent = 'My Profile';
                    }
                }

                // Set up tab navigation
                updateActiveTabFromHash();
                window.addEventListener('hashchange', updateActiveTabFromHash);

            } catch (error) {
                console.error('Dashboard Error:', error);
                document.querySelector('.container').innerHTML = `<div class="card"><p>Could not load your player data. Reason: ${error.message}</p></div>`;
            } finally {
                loading.value = false;
            }
        });

        // --- Expose to Template ---
        return {
            loading, account, player, items, activeTab, searchQuery, sortKey, sortDirection, itemsExpanded, selectedPokemon, moveMap, costumeIdMap, pokedexService,
            teamColor, xpPercentage, xpProgressText, stardust, pokecoins, highlights,
            groupedItems, itemCategoryOrder, filteredPokemon,
            totalPokeBalls, totalPotions, totalRevives,
            toggleSortDirection, getItemSprite, createBackgroundStyle, getIvPercent, getCardClass, getBadges, getLevelFromCpm, openPokemonModal, displayMove, getIvColor, getPokemonTypes,
            showCleanupModal, openCleanupModal, closeCleanupModal, cleanupSearchQuery, groupSubstitutes, defaultCleanupData, formGroupedCleanupData,
            showTeamBuilderModal, openTeamBuilderModal, closeTeamBuilderModal, selectedRaidBoss, raidBosses,
            teamBuilderMode, customEnemies, activeTeamBuilderTab, allPokedex, allPokedexNames, activeTabSuggestions, addCustomEnemy, removeCustomEnemy,             customEnemyInput, battleMode,
            getMoveTypeIconUrl,
            pvpProgress,

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
            stats_acquisitionType
        };
    }
}).mount('#app');
