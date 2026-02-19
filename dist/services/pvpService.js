import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BINARY_PATH = path.join(__dirname, '../data/user/generated/pvp_ranks.bin');
// Format Constants (must match scripts/compile_pvp_binary.js)
const NAME_SIZE = 32;
// const RANK_TABLE_SIZE = 4096 * 2; // Commented out as in original JS if it was unused or for reference
const RANK_TABLE_SIZE = 4096 * 2;
// const ENTRY_DATA_SIZE = RANK_TABLE_SIZE * 3;
const INDEX_ENTRY_SIZE = NAME_SIZE + NAME_SIZE + 4;
let pvpBuffer = null;
let pvpIndex = new Map(); // "SPECIES_FORM" -> offset
let dataVersion = 0;
export async function init() {
    console.log('Initializing PvP Service (Loading Binary)...');
    try {
        if (fs.existsSync(BINARY_PATH)) {
            const stats = await fs.promises.stat(BINARY_PATH);
            dataVersion = stats.mtimeMs;
            const fullBuffer = await fs.promises.readFile(BINARY_PATH);
            const totalEntries = fullBuffer.readUInt32LE(0);
            const indexStart = 4;
            const dataStart = indexStart + (totalEntries * INDEX_ENTRY_SIZE);
            const newIndex = new Map();
            for (let i = 0; i < totalEntries; i++) {
                const entryOffset = indexStart + (i * INDEX_ENTRY_SIZE);
                // Read species and form names (trimming null bytes)
                const speciesId = fullBuffer.toString('utf8', entryOffset, entryOffset + NAME_SIZE).replace(/\0/g, '');
                const formId = fullBuffer.toString('utf8', entryOffset + NAME_SIZE, entryOffset + (NAME_SIZE * 2)).replace(/\0/g, '');
                const dataOffset = fullBuffer.readUInt32LE(entryOffset + (NAME_SIZE * 2));
                newIndex.set(`${speciesId}_${formId}`, dataStart + dataOffset);
            }
            pvpBuffer = fullBuffer;
            pvpIndex = newIndex;
            console.log(`PvP Ranks loaded. Entries: ${totalEntries}, Memory: ${(fullBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        }
        else {
            console.warn('PvP Binary file not found at ' + BINARY_PATH);
        }
    }
    catch (e) {
        console.error('Failed to load PvP ranks binary:', e);
    }
}
export async function reload() {
    await init();
}
export function getRank(pokemonId, form, league, ivAttack, ivDefense, ivStamina) {
    if (!pvpBuffer)
        return null;
    // Normalize input
    const speciesId = pokemonId.toUpperCase();
    const formId = form ? form.toUpperCase() : 'NORMAL';
    const offset = pvpIndex.get(`${speciesId}_${formId}`);
    if (offset === undefined)
        return null;
    let leagueOffset = 0;
    const l = league.toLowerCase();
    if (l === 'great' || l === 'gl')
        leagueOffset = 0;
    else if (l === 'ultra' || l === 'ul')
        leagueOffset = RANK_TABLE_SIZE;
    else if (l === 'master' || l === 'ml')
        leagueOffset = RANK_TABLE_SIZE * 2;
    else
        return null;
    // IV Key: (atk << 8) | (def << 4) | sta
    const ivKey = (ivAttack << 8) | (ivDefense << 4) | ivStamina;
    // Each rank is a 2-byte Uint16
    const rank = pvpBuffer.readUInt16LE(offset + leagueOffset + (ivKey * 2));
    return rank > 0 ? { rank } : null;
}
export function getRowCount() {
    return pvpIndex.size;
}
// Compatibility placeholder
export function getRanks() { return []; }
export const getDataVersion = () => dataVersion;
export default {
    init,
    reload,
    getRank,
    getRanks,
    getRowCount,
    getDataVersion
};
