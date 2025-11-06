/**
 * This script contains the complete Vue.js application logic for the private dashboard.
 */

const { createApp, ref, computed, onMounted, watch } = Vue;

// --- CPM Table for Level Calculation ---
const cpmTable = { 1: 0.094, 1.5: 0.13513743, 2: 0.16639787, 2.5: 0.19265091, 3: 0.21573247, 3.5: 0.23657266, 4: 0.25572005, 4.5: 0.27353038, 5: 0.29024988, 5.5: 0.30605737, 6: 0.3210876, 6.5: 0.33544503, 7: 0.34921268, 7.5: 0.36245775, 8: 0.3752356, 8.5: 0.38759241, 9: 0.39956728, 9.5: 0.41119355, 10: 0.4225, 10.5: 0.4329264, 11: 0.44310755, 11.5: 0.45305995, 12: 0.4627984, 12.5: 0.47233609, 13: 0.48168495, 13.5: 0.4908558, 14: 0.49985844, 14.5: 0.50870176, 15: 0.51739395, 15.5: 0.52594251, 16: 0.5343543, 16.5: 0.54263573, 17: 0.5507927, 17.5: 0.55883058, 18: 0.5667545, 18.5: 0.57456913, 19: 0.5822789, 19.5: 0.5898879, 20: 0.5974, 20.5: 0.60482366, 21: 0.6121573, 21.5: 0.61940412, 22: 0.6265671, 22.5: 0.63364914, 23: 0.64065295, 23.5: 0.64758096, 24: 0.65443563, 24.5: 0.66121925, 25: 0.667934, 25.5: 0.67458189, 26: 0.6811649, 26.5: 0.6876849, 27: 0.69414365, 27.5: 0.70054287, 28: 0.7068842, 28.5: 0.7131691, 29: 0.7193991, 29.5: 0.72557561, 30: 0.7317, 30.5: 0.734741, 31: 0.73776948, 31.5: 0.7407895, 32: 0.74378943, 32.5: 0.74677015, 33: 0.7497256, 33.5: 0.75266097, 34: 0.75557274, 34.5: 0.75847129, 35: 0.76138438, 35.5: 0.76418652, 36: 0.76698068, 36.5: 0.76975685, 37: 0.7725421, 37.5: 0.77529827, 38: 0.77803515, 38.5: 0.78076949, 39: 0.7835, 39.5: 0.78623275, 40: 0.7903, 40.5: 0.7928, 41: 0.7953, 41.5: 0.7978, 42: 0.8003, 42.5: 0.8028, 43: 0.8053, 43.5: 0.8078, 44: 0.8103, 44.5: 0.8128, 45: 0.8153, 45.5: 0.8178, 46: 0.8203, 46.5: 0.8228, 47: 0.8253, 47.5: 0.8278, 48: 0.8303, 48.5: 0.8328, 49: 0.8353, 49.5: 0.8378, 50: 0.8403, 50.5: 0.8428, 51: 0.8453 };
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
    if (colors.length === 1) return `background-color: ${colors[0]};`;
    return `background: linear-gradient(135deg, ${colors[0]} 30%, ${colors[1]} 70%);`;
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

// --- Vue Components ---

/**
 * A reusable grid component to display a list of Pokémon cards.
 */
const GridComponent = {
    props: ['pokemons'],
    emits: ['pokemon-clicked'],
    template: `
        <div id="all-pokemon-list">
            <div v-for="p in pokemons" :key="p.id" :class="getCardClass(p)" :style="createBackgroundStyle(p.typeColors)" @click="$emit('pokemon-clicked', p)">
                <img :src="p.sprite" :alt="displayName(p)" loading="lazy">
                <p class="pokemon-name" v-html="getBadges(p, displayName(p))"></p>
                <p class="pokemon-cp">CP {{ p.cp }}</p>
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

            if (p.specialForm === 'Dynamax') badges.push('<span class="badge dynamax-badge">Dynamax</span>');
            if (p.specialForm === 'Gigantamax') badges.push('<span class="badge gigantamax-badge">G-Max</span>');

            if (p.isMaxLevel) badges.push('<span class="badge max-level-badge">Max</span>');

            if (badges.length > 0) {
                return `${name}<br>${badges.join(' ')}`;
            }
            return name;
        },
        getCardClass(p) { return p.typeColors && p.typeColors.length > 0 ? 'pokemon-card colored' : 'pokemon-card'; },
        // Make global helpers available in this component's template
        createBackgroundStyle,
        getIvColor
    }
};

// --- Main Vue App Instance ---
createApp({
    components: {
        'grid-component': GridComponent
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
        
        const getPokedexEntry = (p) => {
            if (!pokedexService.value.pokedex || !pokedexService.value.pokedex[p.pokemonId]) return null;
            const allFormsForPokemon = pokedexService.value.pokedex[p.pokemonId];
            const normalEntry = allFormsForPokemon['NORMAL'] || Object.values(allFormsForPokemon)[0];
            if (!normalEntry) return null;

            const playerFormName = p.pokemonDisplay.formName;
            if (!playerFormName || playerFormName === 'Unset' || playerFormName.toUpperCase().includes('NORMAL')) {
                return normalEntry;
            }

            const normalizedPlayerForm = playerFormName.toUpperCase().replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '');

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
            if (p.pokemonDisplay?.alignment === 1) score += 15;
            if (p.pokemonClass === 'POKEMON_CLASS_MYTHIC') score += 15;
            if (p.isLucky) score += 10;
            if (p.pokemonClass === 'POKEMON_CLASS_LEGENDARY') score += 10;
            if (p.pokemonDisplay?.costume > 0) score += 10;
            if (p.specialForm === 'Dynamax' || p.specialForm === 'Gigantamax') score += 5;
            
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

        const filterPokemon = (pokemons, query) => {
            const searchTerms = query.toLowerCase().trim().split(',').map(term => term.trim()).filter(term => term);
            if (searchTerms.length === 0) {
                return pokemons;
            }

            return pokemons.filter(p => {
                if (!p.pokemonDisplay) return false;
                return searchTerms.every(term => {
                    const isNegated = term.startsWith('!');
                    const searchTerm = isNegated ? term.substring(1) : term;
                    let match = false;
                    const types = (p.typeColors || []).map(color => {
                        for (const type in pokedexService.value.typeColorMap) {
                            if (pokedexService.value.typeColorMap[type] === color) return type.toLowerCase();
                        }
                    });
                    if (types.includes(searchTerm)) match = true;
                    else if ((p.name || '').toLowerCase().includes(searchTerm) || (p.nickname || '').toLowerCase().includes(searchTerm)) match = true;
                    else if (searchTerm === 'shiny' && p.pokemonDisplay.shiny) match = true;
                    else if (searchTerm === 'lucky' && p.isLucky) match = true;
                    else if (searchTerm === 'perfect' && getIvPercent(p) >= 100) match = true;
                    else if (searchTerm === 'shadow' && p.pokemonDisplay.alignment === 1) match = true;
                    else if (searchTerm === 'purified' && p.pokemonDisplay.alignment === 2) match = true;
                    else if (searchTerm === 'dynamax' && p.pokemonDisplay.breadModeEnum === 1) match = true;
                    else if (searchTerm === 'gigantamax' && p.pokemonDisplay.breadModeEnum === 2) match = true;
                    const pokedexEntry = getPokedexEntry(p);
                    if (pokedexEntry?.pokemonClass === 'POKEMON_CLASS_LEGENDARY' && searchTerm === 'legendary') match = true;
                    if (pokedexEntry?.pokemonClass === 'POKEMON_CLASS_MYTHIC' && searchTerm === 'mythical') match = true;
                    return isNegated ? !match : match;
                });
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
        const duplicatedPokemon = computed(() => {
            const pokemonsToProcess = filterPokemon(allPokemons.value, cleanupSearchQuery.value);

            // Group the (now potentially filtered) Pokémon
            const groupedById = pokemonsToProcess.reduce((acc, p) => {
                if (!acc[p.pokemonId]) {
                    acc[p.pokemonId] = [];
                }
                acc[p.pokemonId].push(p);
                return acc;
            }, {});

            // Filter for groups with more than one Pokémon
            const duplicateGroups = Object.values(groupedById).filter(group => group.length > 1);

            // Sort groups by size (most duplicates first)
            duplicateGroups.sort((a, b) => b.length - a.length);

            // Sub-sort Pokémon within each group by the new keep score
            duplicateGroups.forEach(group => {
                group.sort((a, b) => getKeepScore(b) - getKeepScore(a) || b.cp - a.cp);
            });

            // Return the nested array of groups
            return duplicateGroups;
        });

        // --- Methods ---
        const openCleanupModal = () => { showCleanupModal.value = true; };
        const closeCleanupModal = () => { showCleanupModal.value = false; };
        const toggleSortDirection = () => { sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'; };
        const getItemSprite = (itemId) => `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Items/Item_${String(itemId).padStart(4, '0')}.png`;
        const getCardClass = (p) => p.typeColors && p.typeColors.length > 0 ? 'pokemon-card colored' : 'pokemon-card';
        const getBadges = (p, name) => {
            const badges = [];
            if (!p || !p.pokemonDisplay) return name;

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

            if (p.specialForm === 'Dynamax') badges.push('<span class="badge dynamax-badge">Dynamax</span>');
            if (p.specialForm === 'Gigantamax') badges.push('<span class="badge gigantamax-badge">G-Max</span>');

            if (p.isMaxLevel) badges.push('<span class="badge max-level-badge">Max</span>');

            if (badges.length > 0) {
                return `${name}<br>${badges.join(' ')}`;
            }
            return name;
        };

                                const displayMove = (moveId) => moveMap.value[moveId] || moveId;

                        

                                const openPokemonModal = (pokemon) => {

                                    selectedPokemon.value = pokemon;

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

                // Update the main title with the player's name
                const mainTitleElement = document.getElementById('main-title');
                if (mainTitleElement && account.value.name) {
                    mainTitleElement.textContent = `${account.value.name}'s Profile`;
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
            loading, account, player, items, activeTab, searchQuery, sortKey, sortDirection, itemsExpanded, selectedPokemon, moveMap,
            teamColor, xpPercentage, xpProgressText, stardust, pokecoins, highlights,
            groupedItems, itemCategoryOrder, filteredPokemon,
            totalPokeBalls, totalPotions, totalRevives,
            toggleSortDirection, getItemSprite, createBackgroundStyle, getIvPercent, getCardClass, getBadges, getLevelFromCpm, openPokemonModal, displayMove, getIvColor,
            showCleanupModal, duplicatedPokemon, openCleanupModal, closeCleanupModal, cleanupSearchQuery,
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

