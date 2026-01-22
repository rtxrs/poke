const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const POKEDEX_PATH = path.join(__dirname, '../data/user/generated/pokedex_modified.json');
const OUTPUT_PATH = path.join(__dirname, '../data/public/max_battles.json');

async function scrapeMaxBattles() {
    const url = 'https://www.snacknap.com/max-battles';
    
    // Load Pokedex
    let pokedex = [];
    try {
        const pokedexData = fs.readFileSync(POKEDEX_PATH, 'utf8');
        pokedex = JSON.parse(pokedexData);
    } catch (err) {
        console.error('Error loading Pokedex:', err.message);
        return;
    }

    // Helper to find Pokemon details
    const getPokemonDetails = (id) => {
        const entry = pokedex.find(p => p.dexNr === id);
        if (!entry) return null;
        
        // Use the first available form or the base form
        // For Max Battles, usually base form or specific form is fine for type lookup
        // We need: Name, Types, Image
        
        // Logic to get best image (similar to pokedexService)
        let image = entry.assets?.image;
        if (!image && entry.assetForms) {
             const defaultAsset = entry.assetForms.find(a => 
                (a.form === 'NORMAL' || !a.form) && (a.costume === 'NONE' || !a.costume)
             );
             image = defaultAsset ? defaultAsset.image : entry.assetForms[0].image;
        }

        const types = [];
        if (entry.primaryType?.names?.English) types.push(entry.primaryType.names.English);
        if (entry.secondaryType?.names?.English) types.push(entry.secondaryType.names.English);

        return {
            name: entry.names.English,
            types: types,
            image: image,
            // Add type colors if needed by frontend, but frontend usually maps names to colors
        };
    };

    try {
        const response = await fetch(url);
        const html = await response.text();

        const startMarker = 'id="pokemon"';
        const startIndex = html.indexOf(startMarker);
        if (startIndex === -1) {
            console.error('Error: Could not find #pokemon container');
            return;
        }

        const relevantHtml = html.substring(startIndex);
        const parts = relevantHtml.split(/<h2[^>]*>Tier\s+(\d+)<\/h2>/);

        const groupedBattles = [];

        for (let i = 1; i < parts.length; i += 2) {
            const tierLevel = parseInt(parts[i], 10);
            const content = parts[i+1];
            const pokemonRegex = /<a\s+href="\/pokedex\/pokemon\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
            
            let match;
            while ((match = pokemonRegex.exec(content)) !== null) {
                const dexNr = parseInt(match[1], 10);
                const innerHtml = match[2];
                // Check specifically for the shiny icon image
                const isShiny = innerHtml.includes('/assets/img/is_shiny-dark.png');

                const details = getPokemonDetails(dexNr);
                if (details) {
                    groupedBattles.push({
                        id: dexNr, // Keeping ID for reference
                        names: { English: details.name },
                        level: `tier${tierLevel}`, // Format for frontend grouping if needed
                        tier: tierLevel,
                        types: details.types,
                        shinyAvailable: isShiny,
                        assets: { image: details.image }
                    });
                }
            }
        }

        // Sort or structure if needed. 
        // The frontend RaidBossSelector expects an array of objects.
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(groupedBattles, null, 2));
        console.log(`Successfully saved ${groupedBattles.length} max battles to ${OUTPUT_PATH}`);
        return true; // Return success

    } catch (e) {
        console.error('Scraping failed:', e);
        throw e; // Propagate error
    }
}

module.exports = scrapeMaxBattles;
