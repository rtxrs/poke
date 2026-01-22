/**
 * This script handles the functionality for the public player dashboard.
 * It fetches ranking data, populates the leaderboards, and manages the player detail modal.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENT REFERENCES ---
    const loadingOverlay = document.getElementById('loading-overlay');
    const rankingsGrid = document.getElementById('rankings-grid');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-content');

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

    function openRarityCalculationModal(pokemon) {
        const getStatLine = (label, breakdown) => {
            if (!breakdown || !breakdown.value || breakdown.value <= 1) return '';
            const description = breakdown.text ? `(${breakdown.text})` : '';
            return `<li><span>${label} ${description}</span><span>1 in ${Math.round(breakdown.value).toLocaleString()}</span></li>`;
        };

        modalContent.innerHTML = `
            <button id="modal-close-btn">&times;</button>
            <div class="pokemon-modal-header">
                <img src="${pokemon.sprite}" alt="${pokemon.name}">
                <div class="pokemon-info">
                    <h2>
                        ${pokemon.name}
                        <span class="badges-container">
                            ${generateBadges(pokemon)}
                        </span>
                    </h2>
                    <div class="pokemon-stats-grid">
                        <div><span>Owner</span><strong>${renderPlayerBadge({ userId: pokemon.userId, publicId: pokemon.ownerPublicId })}</strong></div>
                        <div><span>Rarity Score</span><strong>1 in ${Math.round(pokemon.rarity.score).toLocaleString()}</strong></div>
                    </div>
                </div>
            </div>
            <div class="pokemon-modal-body">
                <h4>Rarity Factors</h4>
                <ul class="stat-breakdown-list">
                    ${getStatLine('Perfect IVs', pokemon.rarity.breakdown.iv)}
                    ${getStatLine('Shiny', pokemon.rarity.breakdown.shiny)}
                    ${getStatLine('Lucky', pokemon.rarity.breakdown.lucky)}
                    ${getStatLine('Origin', pokemon.rarity.breakdown.origin)}
                </ul>
            </div>
        `;
        modalBackdrop.classList.remove('hidden');
        document.getElementById('modal-close-btn').onclick = () => modalBackdrop.classList.add('hidden');
    }

    function generateBadges(p) {
        const badges = [];
        let hasIvCombo = false;
        let hasShinyCombo = false;
        let hasLuckyCombo = false;

        // Highest priority combos
        if (p.isShiny && p.isLucky && p.isPerfect) {
            badges.push('<span class="badge shlundo-badge">Shlundo</span>');
            hasIvCombo = hasShinyCombo = hasLuckyCombo = true;
        } else if (p.isLucky && p.isPerfect) {
            badges.push('<span class="badge lundo-badge">Lundo</span>');
            hasIvCombo = hasLuckyCombo = true;
        } else if (p.isShiny && p.isPerfect) {
            badges.push('<span class="badge shundo-badge">Shundo</span>');
            hasIvCombo = hasShinyCombo = true;
        } else if (p.isShiny && p.isZeroIv) {
            badges.push('<span class="badge shnundo-badge">Shnundo</span>');
            hasIvCombo = hasShinyCombo = true;
        }

        // Individual badges (if not part of a combo)
        if (!hasShinyCombo && p.isShiny) badges.push('<span class="badge shiny-badge">Shiny</span>');
        if (!hasLuckyCombo && p.isLucky) {
            badges.push('<span class="badge lucky-badge">Lucky</span>');
        } else if (p.isTraded && !p.isLucky) {
            badges.push('<span class="badge traded-badge">Traded</span>');
        }
        
        if (!hasIvCombo) {
            if (p.isPerfect) badges.push('<span class="badge perfect-badge">Hundo</span>');
            else if (p.isZeroIv) badges.push('<span class="badge zero-iv-badge">Nundo</span>');
        }

                                // Other non-conflicting badges
                                if (p.pokemonDisplay?.alignment === 1) badges.push('<span class="badge shadow-badge">Shadow</span>');
                                if (p.pokemonDisplay?.alignment === 2) badges.push('<span class="badge purified-badge">Purified</span>');
                                if (p.isLegendary) badges.push('<span class="badge legendary-badge">Legendary</span>');        if (p.isMythical) badges.push('<span class="badge mythical-badge">Mythical</span>');

        return badges.join(' ');
    }

    function openPokemonModal(pokemon) {
        const ivAttack = pokemon.iv.attack;
        const ivDefense = pokemon.iv.defense;
        const ivStamina = pokemon.iv.stamina;
        const cpm = pokemon.cpm;

        const level = getLevelFromCpm(cpm);

        modalContent.innerHTML = `
            <button id="modal-close-btn">&times;</button>
            <div class="pokemon-modal-header">
                <img src="${pokemon.sprite}" alt="${pokemon.name}">
                <div class="pokemon-info">
                    <h2>
                        ${pokemon.name}
                        <span class="badges-container">
                            ${generateBadges(pokemon)}
                        </span>
                    </h2>
                    <div class="pokemon-stats-grid">
                        <div><span>Owner</span><strong>${renderPlayerBadge({ userId: pokemon.userId, publicId: pokemon.ownerPublicId })}</strong></div>
                        <div><span>CP</span><strong>${pokemon.cp}</strong></div>
                        <div><span>Level</span><strong>${level}</strong></div>
                    </div>
                </div>
            </div>
            <div class="pokemon-modal-body">
                <h4>IV Stats</h4>
                <div class="iv-stats">
                    <div class="stat-bar-container">
                        <span class="stat-label">Attack</span>
                        <div class="stat-bar">
                            <div id="attack-bar" class="stat-bar-fill"></div>
                        </div>
                        <span class="stat-value">${ivAttack}/15</span>
                    </div>
                    <div class="stat-bar-container">
                        <span class="stat-label">Defense</span>
                        <div class="stat-bar">
                            <div id="defense-bar" class="stat-bar-fill"></div>
                        </div>
                        <span class="stat-value">${ivDefense}/15</span>
                    </div>
                    <div class="stat-bar-container">
                        <span class="stat-label">Stamina</span>
                        <div class="stat-bar">
                            <div id="stamina-bar" class="stat-bar-fill"></div>
                        </div>
                        <span class="stat-value">${ivStamina}/15</span>
                    </div>
                </div>
            </div>
        `;
        modalBackdrop.classList.remove('hidden');
        document.getElementById('modal-close-btn').onclick = () => modalBackdrop.classList.add('hidden');

        setTimeout(() => {
            const attackBar = document.getElementById('attack-bar');
            attackBar.style.width = `${(ivAttack / 15) * 100}%`;
            attackBar.style.backgroundColor = ivAttack === 15 ? '#da7a79' : '#f79513';

            const defenseBar = document.getElementById('defense-bar');
            defenseBar.style.width = `${(ivDefense / 15) * 100}%`;
            defenseBar.style.backgroundColor = ivDefense === 15 ? '#da7a79' : '#f79513';

            const staminaBar = document.getElementById('stamina-bar');
            staminaBar.style.width = `${(ivStamina / 15) * 100}%`;
            staminaBar.style.backgroundColor = ivStamina === 15 ? '#da7a79' : '#f79513';
        }, 100); // A small delay to allow the DOM to update
    }

    // --- HELPER FUNCTIONS ---

    /**
     * Creates a background style (solid or gradient) for a Pokémon card.
     * @param {string[]} colors - An array of hex color codes for Pokémon types.
     * @returns {string} The inline CSS style string.
     */
    function createBackgroundStyle(colors) {
        if (!colors || colors.length === 0) return 'color: #333; text-shadow: none;';
        if (colors.length === 1) return `background-color: ${colors[0]};`;
        return `background: linear-gradient(135deg, ${colors[0]} 30%, ${colors[1]} 70%);`;
    }

    /**
     * Fetches detailed data for a specific player and displays it in a modal.
     * @param {string} playerId - The unique ID of the player to display.
     */
    async function openPlayerModal(playerId) {
        // Show loading state immediately
        modalContent.innerHTML = `
            <button id="modal-close-btn">&times;</button>
            <div style="padding: 40px; text-align: center;">
                <div class="loading-spinner"></div>
                <p>Loading player profile...</p>
            </div>
        `;
        modalBackdrop.classList.remove('hidden');
        document.getElementById('modal-close-btn').onclick = () => modalBackdrop.classList.add('hidden');

        try {
            const detailRes = await fetch(`/api/player-detail/${playerId}`);
            if (!detailRes.ok) throw new Error('Could not fetch player details.');
            const details = await detailRes.json();

            modalContent.innerHTML = `
                <button id="modal-close-btn">&times;</button>
                <h2>${renderPlayerBadge({ userId: details.userId, publicId: details.publicId })}</h2>
                <div class="grid-stats">
                    <div><span>Total XP</span><strong>${details.totalXp.toLocaleString()}</strong></div>
                    <div><span>Pokémon Caught</span><strong>${details.pokemonCaught.toLocaleString()}</strong></div>
                    <div><span>Distance Walked</span><strong>${details.kmWalked.toFixed(1)} km</strong></div>
                    <div><span>PokéStops Visited</span><strong>${details.pokestopsVisited.toLocaleString()}</strong></div>
                </div>
                
                <h3>Highlights</h3>
                <div id="modal-pokemon-container">
                    ${details.highlights.map(p => {
                        const cardClass = p.typeColors.length > 0 ? 'pokemon-card colored' : 'pokemon-card';
                        return `<div class="${cardClass}" style="${createBackgroundStyle(p.typeColors)}">
                                    <img src="${p.sprite}" alt="${p.name}" loading="lazy">
                                    <p class="pokemon-name">${p.name}</p>
                                    <p class="pokemon-cp">CP ${p.cp}</p>
                                </div>`;
                    }).join('')}
                </div>
            `;
            // Re-attach close button listener for the new content
            document.getElementById('modal-close-btn').onclick = () => modalBackdrop.classList.add('hidden');
        } catch (error) {
            console.error('Failed to open player modal:', error);
            modalContent.innerHTML = `
                <button id="modal-close-btn">&times;</button>
                <p style="padding: 20px; color: #e74c3c;">Error: ${error.message}</p>
            `;
            document.getElementById('modal-close-btn').onclick = () => modalBackdrop.classList.add('hidden');
        }
    }

    // --- MAIN EXECUTION ---

    function openRarityInfoModal() {
        modalContent.innerHTML = `
            <button id="modal-close-btn">&times;</button>
            <h4>Rarity Calculation</h4>
            <p>Rarity is calculated by multiplying the odds of a Pokémon's rarest traits.</p>
            <ul>
                <li><strong>Lucky Trade Odds:</strong> 1 in 20.</li>
                <li><strong>Shiny Odds:</strong> ~1 in 20 to ~1 in 500.</li>
            </ul>
            <p><strong>Perfect IV Odds depend on how it was acquired:</strong></p>
            <ul>
                <li>1 in 64 (Lucky Trade)</li>
                <li>1 in 216 (Raid/Egg/Research)</li>
                <li>1 in 1,331 (Best Friend Trade)</li>
                <li>1 in 1,728 (Weather Boost)</li>
                <li>1 in 4,096 (Wild Catch)</li>
            </ul>
        `;
        modalBackdrop.classList.remove('hidden');
        document.getElementById('modal-close-btn').onclick = () => modalBackdrop.classList.add('hidden');
    }

    try {
        const response = await fetch('/api/rankings');
        if (!response.ok) throw new Error('Failed to load rankings from the server.');
        const rankings = await response.json();

        const authResponse = await fetch('/api/check-auth-status');
        const authStatus = await authResponse.json();

        const mainTitle = document.getElementById('main-title');

        if (authStatus.loggedIn && authStatus.userId) {
            document.title = `Pokemon GO | #${authStatus.userId}`;
            if (mainTitle) {
                mainTitle.innerHTML = `Pokémon GO Player Dashboard | ${renderPlayerBadge({ userId: authStatus.userId, publicId: authStatus.publicId })}`;
            }
        } else {
            document.title = `Pokemon GO | Dashboard`;
            if (mainTitle) {
                mainTitle.textContent = 'Pokémon GO Player Dashboard';
            }
        }

        // 1. Populate "Recent Player Activity" Table
        const recentBody = document.getElementById('recent-players-body');
        recentBody.innerHTML = rankings.recentPlayers.map(player => `
            <tr class="clickable-row" data-player-id="${player.publicId}">
                <td>${renderPlayerBadge(player)}</td>
                <td>
                    ${player.buddy ? `<img src="${player.buddy.sprite}" alt="${player.buddy.name}" title="${player.buddy.name}">` : 'N/A'}
                </td>
                <td class="hide-on-mobile">${player.kmWalked} km</td>
                <td class="hide-on-mobile">${player.pokemonCaught.toLocaleString()}</td>
            </tr>
        `).join('');

        // 2. Populate "Top 50 Strongest Pokémon" Table
        const strongestBody = document.getElementById('strongest-pokemon-body');
        const strongestData = rankings.strongestPokemon; // Store data
        strongestBody.innerHTML = strongestData.map((p, index) => `
            <tr class="clickable-pokemon-row" data-index="${index}">
                <td>${index + 1}</td>
                <td class="pokemon-cell">
                    <img src="${p.sprite}" alt="${p.name}">
                </td>
                <td><strong>${p.cp.toLocaleString()}</strong></td>
                <td class="hide-on-mobile">${renderPlayerBadge({ userId: p.userId, publicId: p.ownerPublicId })}</td>
            </tr>
        `).join('');

        // 3. Populate "Rarest Pokémon Showcase" Table
        const rarestBody = document.getElementById('rarest-pokemon-body');
        const rarityData = rankings.rarestPokemon; // Store data
        rarestBody.innerHTML = rarityData.map((p, index) => `
            <tr class="clickable-rarity-row" data-index="${index}">
                <td><strong>${index + 1}</strong></td>
                <td class="pokemon-cell">
                    <img src="${p.sprite}" alt="${p.name}">
                </td>
                <td class="badges-cell">
                    ${generateBadges(p)}
                </td>
                <td class="hide-on-mobile">${renderPlayerBadge({ userId: p.userId, publicId: p.ownerPublicId })}</td>
            </tr>
        `).join('');

        // 4. Add Click Event Listeners to all generated rows
        document.getElementById('rankings-grid').addEventListener('click', (event) => {
            const playerRow = event.target.closest('.clickable-row');
            if (playerRow) {
                const playerId = playerRow.dataset.playerId;
                if (playerId) {
                    openPlayerModal(playerId);
                }
                return;
            }

            const pokemonRow = event.target.closest('.clickable-pokemon-row');
            if (pokemonRow) {
                const index = pokemonRow.dataset.index;
                const pokemon = strongestData[index];
                if (pokemon) {
                    openPokemonModal(pokemon);
                }
                return;
            }

            const rarityRow = event.target.closest('.clickable-rarity-row');
            if (rarityRow) {
                const index = rarityRow.dataset.index;
                const pokemon = rarityData[index];
                if (pokemon) {
                    openRarityCalculationModal(pokemon);
                }
            }
        });

        // Hide loading message and show the rankings grid
        loadingOverlay.classList.add('hidden');
        rankingsGrid.classList.remove('hidden');

        // --- Rarity Info Panel Logic ---
        const infoBtn = document.querySelector('.info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                openRarityInfoModal();
            });
        }

    } catch (error) {
        console.error('Failed to initialize public dashboard:', error);
        loadingOverlay.innerHTML = '<p>Could not load ranking data. Please try again later.</p>';
        document.title = `Pokemon GO | Dashboard`; // Fallback title on error
    }

    // Add a single event listener to the modal backdrop to handle closing
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            modalBackdrop.classList.add('hidden');
        }
    });
});