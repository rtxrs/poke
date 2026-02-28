import fs from 'fs';
import path from 'path';
import { Worker, isMainThread, parentPort } from 'worker_threads';
import { exec } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';
import config from '../config.js'; // Import config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POKEDEX_PATH = config.POKEDEX_FILE; // Use the path from config.ts
const OUTPUT_PATH = path.join(__dirname, '../data/user/generated/pvp_ranks.json');
const TEMP_OUTPUT_PATH = OUTPUT_PATH + '.tmp';
// --- Constants ---
const CPM_TABLE = {
    "1": 0.094, "1.5": 0.1351374318, "2": 0.16639787, "2.5": 0.192650919, "3": 0.21573247, "3.5": 0.2365726613, "4": 0.25572005, "4.5": 0.2735303812, "5": 0.29024988, "5.5": 0.3060573775, "6": 0.3210876, "6.5": 0.3354450362, "7": 0.34921268, "7.5": 0.3624577511, "8": 0.3752356, "8.5": 0.387592416, "9": 0.39956728, "9.5": 0.4111935514, "10": 0.4225, "10.5": 0.4329264091, "11": 0.44310755, "11.5": 0.4530599591, "12": 0.4627984, "12.5": 0.472336093, "13": 0.48168495, "13.5": 0.4908558003, "14": 0.49985844, "14.5": 0.508701765, "15": 0.51739395, "15.5": 0.5259425113, "16": 0.5343543, "16.5": 0.5426357375, "17": 0.5507927, "17.5": 0.5588305862, "18": 0.5667545, "18.5": 0.5745691333, "19": 0.5822789, "19.5": 0.5898879072, "20": 0.5974, "20.5": 0.6048236651, "21": 0.6121573, "21.5": 0.6194041216, "22": 0.6265671, "22.5": 0.6336491432, "23": 0.64065295, "23.5": 0.6475809666, "24": 0.65443563, "24.5": 0.6612192524, "25": 0.667934, "25.5": 0.6745818959, "26": 0.6811649, "26.5": 0.6876849038, "27": 0.69414365, "27.5": 0.70054287, "28": 0.7068842, "28.5": 0.7131691091, "29": 0.7193991, "29.5": 0.7255756136, "30": 0.7317, "30.5": 0.7377694897, "31": 0.7437366, "31.5": 0.749609799, "32": 0.7553897, "32.5": 0.761080073, "33": 0.7666845, "33.5": 0.772199568, "34": 0.7776309, "34.5": 0.782983635, "35": 0.7882599, "35.5": 0.793460966, "36": 0.7985881, "36.5": 0.803645071, "37": 0.8086304, "37.5": 0.813544863, "38": 0.8183946, "38.5": 0.823179625, "39": 0.7846369743347168, "39.5": 0.7874736085132754, "40": 0.7903000116348267, "40.5": 0.792803968023538, "41": 0.7953000068664551, "41.5": 0.7978038983716224, "42": 0.8003000020980835, "42.5": 0.8028038718775964, "43": 0.8052999973297119, "43.5": 0.8078038508470536, "44": 0.8102999925613403, "44.5": 0.812803835179168, "45": 0.8152999877929688, "45.5": 0.8178037928037928, "46": 0.8203000020980835, "46.5": 0.822803776019539, "47": 0.825300009250640, "47.5": 0.827803755931569, "48": 0.830300023555755, "48.5": 0.832803729034748, "49": 0.835300011634827, "49.5": 0.837803721427917, "50": 0.840299994945526
};
const SORTED_LEVELS = Object.entries(CPM_TABLE)
    .map(([lvl, cpm]) => ({ level: parseFloat(lvl), cpm, cpm2: cpm * cpm }))
    .filter(l => l.level <= 50)
    .sort((a, b) => a.level - b.level);
const LEAGUES = { great: 1500, ultra: 2500, master: 10000 };
// --- Optimized Math Utils ---
const SQRT_TABLE = new Float64Array(1000);
for (let i = 0; i < 1000; i++)
    SQRT_TABLE[i] = Math.sqrt(i);
// Reusable buffers to avoid allocation in workers
const statProducts = new Float64Array(4096);
const cps = new Uint16Array(4096);
const sortBuffer = new Float64Array(4096);
const ivKeys = new Uint16Array(4096);
function generateRankList(baseStats, cap) {
    const atkTotalBase = baseStats.attack;
    const defTotalBase = baseStats.defense;
    const staTotalBase = baseStats.stamina;
    let i = 0;
    for (let atk = 0; atk <= 15; atk++) {
        const atkTotal = atkTotalBase + atk;
        for (let def = 0; def <= 15; def++) {
            const defTotal = defTotalBase + def;
            const cpPart = (atkTotal * SQRT_TABLE[defTotal]) / 10;
            const sqrtDef = SQRT_TABLE[defTotal];
            for (let sta = 0; sta <= 15; sta++) {
                const staTotal = staTotalBase + sta;
                const cpConst = cpPart * SQRT_TABLE[staTotal];
                // Binary Search for Level
                let low = 0, high = SORTED_LEVELS.length - 1, bestIdx = 0;
                while (low <= high) {
                    const mid = (low + high) >> 1;
                    if (Math.floor(cpConst * SORTED_LEVELS[mid].cpm2) <= cap) {
                        bestIdx = mid;
                        low = mid + 1;
                    }
                    else {
                        high = mid - 1;
                    }
                }
                const best = SORTED_LEVELS[bestIdx];
                const realHp = Math.floor(staTotal * best.cpm);
                const statProduct = (atkTotal * best.cpm) * (defTotal * best.cpm) * realHp;
                const finalCp = Math.max(10, Math.floor(cpConst * best.cpm2));
                const ivKey = (atk << 8) | (def << 4) | sta;
                // Pack for sorting: statProduct is primary, cp is secondary tie-breaker
                // We use a large multiplier for statProduct to keep it as the most significant part
                // and add CP as a small fractional part.
                statProducts[i] = statProduct;
                cps[i] = finalCp;
                ivKeys[i] = ivKey;
                // statProduct is ~1-10 million. CP is ~10-10000.
                sortBuffer[i] = (statProduct * 100000) + finalCp;
                i++;
            }
        }
    }
    // Create an index array to sort
    const indices = new Uint16Array(4096);
    for (let j = 0; j < 4096; j++)
        indices[j] = j;
    // Sort indices based on packed values in sortBuffer
    indices.sort((a, b) => sortBuffer[b] - sortBuffer[a]);
    // Return the ivKeys in ranked order
    const result = new Uint16Array(4096);
    for (let j = 0; j < 4096; j++) {
        result[j] = ivKeys[indices[j]];
    }
    return Array.from(result);
}
// --- Worker Logic ---
if (!isMainThread) {
    parentPort.on('message', (speciesData) => {
        const speciesResult = {};
        const processEntry = (entry) => {
            if (!entry || !entry.stats)
                return;
            const formKey = entry.formId || 'NORMAL';
            speciesResult[formKey] = {
                gl: generateRankList(entry.stats, LEAGUES.great),
                ul: generateRankList(entry.stats, LEAGUES.ultra),
                ml: generateRankList(entry.stats, LEAGUES.master)
            };
        };
        processEntry(speciesData);
        if (speciesData.regionForms)
            Object.values(speciesData.regionForms).forEach(processEntry);
        if (speciesData.megaEvolutions)
            Object.values(speciesData.megaEvolutions).forEach(processEntry);
        parentPort.postMessage({ id: speciesData.id, result: speciesResult });
    });
}
// --- Main Thread Logic ---
else {
    async function main() {
        console.log("Loading Pokedex...");
        const pokedex = JSON.parse(fs.readFileSync(POKEDEX_PATH, 'utf8'));
        const writeStream = fs.createWriteStream(TEMP_OUTPUT_PATH);
        writeStream.write('{\n');
        const numCPUs = Math.max(1, os.cpus().length);
        console.log(`Spawning ${numCPUs} workers for parallel calculation...`);
        const isProd = __dirname.includes('dist');
        const workerPath = __filename;
        const workers = Array.from({ length: numCPUs }, () => {
            // If using tsx (dev), we need to pass the loader to the worker
            if (!isProd) {
                return new Worker(workerPath, {
                    execArgv: ['--import', 'tsx']
                });
            }
            return new Worker(workerPath);
        });
        let activeWorkers = numCPUs;
        let index = 0;
        let finished = 0;
        let isFirst = true;
        const distribute = (worker) => {
            if (index < pokedex.length) {
                worker.postMessage(pokedex[index++]);
            }
            else {
                worker.terminate();
                activeWorkers--;
                if (activeWorkers === 0) {
                    writeStream.write('\n}');
                    writeStream.end();
                }
            }
        };
        workers.forEach(worker => {
            worker.on('message', ({ id, result }) => {
                if (Object.keys(result).length > 0) {
                    if (!isFirst)
                        writeStream.write(',\n');
                    writeStream.write(`  "${id}": ${JSON.stringify(result)}`);
                    isFirst = false;
                }
                finished++;
                if (finished % 50 === 0)
                    process.stdout.write(`\rProgress: ${finished}/${pokedex.length}`);
                distribute(worker);
            });
            distribute(worker);
        });
        writeStream.on('finish', () => {
            process.stdout.write(`\rProgress: ${finished}/${pokedex.length}\n`);
            fs.renameSync(TEMP_OUTPUT_PATH, OUTPUT_PATH);
            console.log(`Done! Saved to ${OUTPUT_PATH}`);
            console.log("Compiling binary ranks...");
            const compileScriptPath = isProd
                ? path.join(__dirname, 'compile_pvp_binary.js')
                : path.join(__dirname, 'compile_pvp_binary.ts');
            const compileCommand = isProd ? `node ${compileScriptPath}` : `pnpm tsx ${compileScriptPath}`;
            exec(compileCommand, { cwd: path.join(__dirname, '..') }, (err, stdout) => {
                if (err)
                    console.error(err);
                else
                    console.log(stdout);
            });
        });
    }
    main().catch(console.error);
}
