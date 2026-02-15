// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/private-data') // Fetch the logged-in user's FULL data
        .then(response => {
            if (!response.ok) throw new Error('Could not load your data.');
            return response.json();
        })
        .then(data => {
            // This function is the same as the one you had before
            // It will populate the full trainer summary, item list, and pokemon highlights
            populateFullDashboard(data); 
        })
        .catch(error => console.error('Dashboard Error:', error.message));
});

function populateDashboard(data) {
    console.log("Populating full dashboard with private data:", data);
    const { account, player, items, pokemons, time } = data;

    // --- Populate Trainer Summary ---
    document.getElementById('trainerName').textContent = account.name;
    document.getElementById('timestamp').textContent = `Data as of: ${time}`;
    document.getElementById('trainerLevel').textContent = `Lv. ${player.level}`;

    // Team Info
    const teamLogos = {
        1: 'https://cdn-icons-png.flaticon.com/128/3909/3909813.png', // Mystic
        2: 'https://cdn-icons-png.flaticon.com/128/3909/3909802.png', // Valor
        3: 'https://cdn-icons-png.flaticon.com/128/3909/3909783.png'  // Instinct
    };
    document.getElementById('teamLogo').src = teamLogos[account.team] || '';
    
    // XP Bar
    const xpForLevel = player.nextLevelExp - player.prevLevelExp;
    const xpProgress = player.experience - player.prevLevelExp;
    const xpPercentage = (xpProgress / xpForLevel) * 100;
    document.getElementById('xpBar').style.width = `${xpPercentage}%`;
    document.getElementById('xpProgress').textContent = `${xpProgress.toLocaleString()} / ${xpForLevel.toLocaleString()} XP`;

    // Currencies & Stats
    const stardust = account.currencyBalance.find(c => c.currencyType === 'STARDUST')?.quantity || 0;
    const pokecoins = account.currencyBalance.find(c => c.currencyType === 'POKECOIN')?.quantity || 0;
    document.getElementById('stardustCount').textContent = stardust.toLocaleString();
    document.getElementById('pokecoinCount').textContent = pokecoins.toLocaleString();
    document.getElementById('pokemonCaught').textContent = player.numPokemonCaptured.toLocaleString();
    document.getElementById('pokedexEntries').textContent = player.numUniquePokedexEntries.toLocaleString();
    document.getElementById('kmWalked').textContent = `${parseFloat(player.kmWalked).toFixed(2)} km`;
    document.getElementById('pokestopVisits').textContent = player.pokeStopVisits.toLocaleString();

    // --- Populate Item Summary ---
    const itemCounts = {
        pokeballs: 0, potions: 0, revives: 0,
        rareCandy: items.find(i => i.item === 1301)?.count || 0,
        rareCandyXL: items.find(i => i.item === 1302)?.count || 0,
        incubators: items.find(i => i.item === 902)?.count || 0,
        starpieces: items.find(i => i.item === 1404)?.count || 0,
        luckyeggs: items.find(i => i.item === 301)?.count || 0
    };
    items.forEach(item => {
        if ([1, 2, 3].includes(item.item)) itemCounts.pokeballs += item.count;
        if ([101, 102, 103, 104].includes(item.item)) itemCounts.potions += item.count;
        if ([201, 202].includes(item.item)) itemCounts.revives += item.count;
    });
    for (const key in itemCounts) {
        document.getElementById(key).textContent = itemCounts[key].toLocaleString();
    }

    // --- Populate Pokémon Summary ---
    const pokemonContainer = document.getElementById('pokemon-container');
    const getIvPercent = (p) => ((p.individualAttack + p.individualDefense + p.individualStamina) / 45 * 100).toFixed(1);

    const highestCp = pokemons.filter(p => !p.isEgg).sort((a, b) => b.cp - a.cp).slice(0, 2);
    const perfects = pokemons.filter(p => getIvPercent(p) === '100.0');
    const shinies = pokemons.filter(p => p.pokemonDisplay?.shiny).slice(0, 2);
    const luckies = pokemons.filter(p => p.isLucky).slice(0, 2);

    const highlights = [...new Set([...highestCp, ...perfects, ...shinies, ...luckies])]; // Use Set to avoid duplicates

    if (highlights.length === 0) {
        pokemonContainer.innerHTML = '<p>No Pokémon to display.</p>';
        return;
    }

    highlights.forEach(pokemon => {
        // Simple mapping for demonstration purposes. A full app would use a complete list.
        const pokemonNames = { 7: 'Squirtle', 8: 'Wartortle', 51: 'Dugtrio', 104: 'Cubone', 135: 'Jolteon', 253: 'Grovyle', 617: 'Accelgor', 742: 'Cutiefly', 814: 'Raboot', 982: 'Dudunsparce' };
        
        const name = pokemonNames[pokemon.pokemonId] || `Pokedex #${pokemon.pokemonId}`;
        const ivPercent = getIvPercent(pokemon);

        let badges = '';
        if (pokemon.pokemonDisplay?.shiny) badges += '<span class="badge shiny-badge">Shiny</span>';
        if (pokemon.isLucky) badges += '<span class="badge lucky-badge">Lucky</span>';
        if (ivPercent === '100.0') badges += '<span class="badge perfect-badge">Perfect</span>';

        const pokemonCardHTML = `
            <div class="pokemon-card">
                <p class="pokemon-name">${name} ${badges}</p>
                <p class="pokemon-cp">CP ${pokemon.cp}</p>
                <div class="iv-bar-container">
                    <div class="iv-bar" style="width: ${ivPercent}%;"></div>
                </div>
                <small>${ivPercent}%</small>
            </div>
        `;
        pokemonContainer.innerHTML += pokemonCardHTML;
    });
}