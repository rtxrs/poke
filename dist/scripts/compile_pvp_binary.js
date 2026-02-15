import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_PATH = path.join(__dirname, '../data/user/generated/pvp_ranks.json');
const BINARY_PATH = path.join(__dirname, '../data/user/generated/pvp_ranks.bin');
// Format Constants
const NAME_SIZE = 32; // Fixed size for species/form names
const RANK_TABLE_SIZE = 4096 * 2; // 4096 Uint16s
const ENTRY_DATA_SIZE = RANK_TABLE_SIZE * 3; // GL, UL, ML
const INDEX_ENTRY_SIZE = NAME_SIZE + NAME_SIZE + 4; // Species, Form, Offset
function stringToBuffer(str, size) {
    const buf = Buffer.alloc(size, 0);
    buf.write(str.substring(0, size));
    return buf;
}
async function compile() {
    console.log("Reading JSON ranks...");
    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    const speciesIds = Object.keys(data);
    // Count total form combinations
    let totalEntries = 0;
    for (const id of speciesIds) {
        totalEntries += Object.keys(data[id]).length;
    }
    console.log(`Compiling ${totalEntries} entries to binary...`);
    // Buffers
    const header = Buffer.alloc(4);
    header.writeUInt32LE(totalEntries, 0);
    const indexTable = Buffer.alloc(totalEntries * INDEX_ENTRY_SIZE);
    const dataTable = Buffer.alloc(totalEntries * ENTRY_DATA_SIZE);
    let currentEntry = 0;
    let currentDataOffset = 0;
    for (const speciesId of speciesIds) {
        const forms = data[speciesId];
        for (const formId in forms) {
            const ranks = forms[formId];
            // 1. Write to Index
            const entryOffset = currentEntry * INDEX_ENTRY_SIZE;
            stringToBuffer(speciesId, NAME_SIZE).copy(indexTable, entryOffset);
            stringToBuffer(formId, NAME_SIZE).copy(indexTable, entryOffset + NAME_SIZE);
            indexTable.writeUInt32LE(currentDataOffset, entryOffset + NAME_SIZE + NAME_SIZE);
            // 2. Convert "Sorted IV List" to "Rank Table"
            // The JSON has: gl: [iv_at_rank1, iv_at_rank2, ...]
            // We want: table[iv] = rank
            const writeLeague = (ivList, buffer, offset) => {
                const table = new Uint16Array(4096).fill(0);
                if (ivList) {
                    ivList.forEach((ivKey, index) => {
                        if (ivKey >= 0 && ivKey < 4096) {
                            table[ivKey] = index + 1; // Rank is index + 1
                        }
                    });
                }
                const leagueBuffer = Buffer.from(table.buffer);
                leagueBuffer.copy(buffer, offset);
            };
            const dataOffset = currentEntry * ENTRY_DATA_SIZE;
            writeLeague(ranks.gl, dataTable, dataOffset);
            writeLeague(ranks.ul, dataTable, dataOffset + RANK_TABLE_SIZE);
            writeLeague(ranks.ml, dataTable, dataOffset + (RANK_TABLE_SIZE * 2));
            currentEntry++;
            currentDataOffset += ENTRY_DATA_SIZE;
        }
    }
    const finalBuffer = Buffer.concat([header, indexTable, dataTable]);
    fs.writeFileSync(BINARY_PATH, finalBuffer);
    console.log(`Successfully compiled binary ranks.`);
    console.log(`JSON size: ${(fs.statSync(JSON_PATH).size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Binary size: ${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB`);
}
compile().catch(console.error);
