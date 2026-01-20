const express = require('express');
const session = require('express-session');
const path = require('path');

const config = require('./config');
const pokedexService = require('./services/pokedexService');
const playerDataService = require('./services/playerDataService');
const pvpService = require('./services/pvpService');
const authRoutes = require('./routes/auth').router;
const apiRoutes = require('./routes/api');

const app = express();
app.set('trust proxy', 1);

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 }
}));
app.use(express.static('public'));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/data', express.static('data'));

// --- Routes ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use(authRoutes);
app.use('/api', apiRoutes);

// --- Start Server ---
(async () => {
    try {
        await pokedexService.initialize();
        
        // --- PvP Ranks Auto-Generation Check ---
        const fsPromises = require('fs').promises;
        const { exec } = require('child_process');
        // Compare against RAW pokedex.json because pokedex_modified.json is rewritten on every boot
        const pokedexPath = path.join(__dirname, 'data/public/pokedex.json'); 
        const ranksPath = path.join(__dirname, 'data/user/pvp_ranks.db');
        
        let runGen = false;
        try {
            await fsPromises.access(ranksPath);
            const pokedexStats = await fsPromises.stat(pokedexPath);
            const ranksStats = await fsPromises.stat(ranksPath);
            if (ranksStats.mtime < pokedexStats.mtime) {
                console.log('⚠️ PvP Ranks file is older than Pokedex source. Regenerating...');
                runGen = true;
            }
        } catch (e) {
            console.log('⚠️ PvP Ranks file not found. Generating...');
            runGen = true;
        }

        if (runGen) {
            await new Promise((resolve, reject) => {
                const child = exec('node scripts/generate_pvp_ranks.js', { cwd: __dirname });
                
                child.stdout.on('data', (data) => process.stdout.write(data)); // Stream output
                child.stderr.on('data', (data) => process.stderr.write(data));

                child.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`PvP Generation script exited with code ${code}`);
                        reject(new Error('PvP Generation Failed'));
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            console.log('✅ PvP Ranks are up to date.');
        }
        // ---------------------------------------

        pvpService.init();
        await playerDataService.init();
        await playerDataService.initializeRankings();
        app.listen(config.PORT, () => console.log(`🚀 Server running at http://localhost:${config.PORT}`));
    } catch (error) {
        console.error('❌ CRITICAL: Failed to initialize services. Server will not start.', error);
        process.exit(1);
    }
})();
