const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const compression = require('compression');
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
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    store: new FileStore({
        path: path.join(__dirname, 'data/private/sessions'),
        ttl: 86400, // 1 day
        retries: 0
    }),
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
}));

const staticOptions = {
    maxAge: 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Force browser to check server every time (revalidation)
        res.setHeader('Cache-Control', 'public, no-cache, must-revalidate');
    }
};

app.use(express.static('public', staticOptions));
app.use('/data', express.static(path.join(__dirname, 'data'), staticOptions));
app.use('/data', express.static('data', staticOptions));

// --- Routes ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use(authRoutes);
app.use('/api', apiRoutes);

// --- Start Server ---
(async () => {
    try {
        const fsPromises = require('fs').promises;
        const { exec } = require('child_process');
        
        // --- Ensure Required Directories Exist ---
        const directories = [
            path.join(__dirname, 'data/public'),
            path.join(__dirname, 'data/private'),
            path.join(__dirname, 'data/private/sessions'),
            path.join(__dirname, 'data/user/custom'),
            path.join(__dirname, 'data/user/generated'),
            path.join(__dirname, config.DATA_FOLDER)
        ];

        for (const dir of directories) {
            await fsPromises.mkdir(dir, { recursive: true });
        }
        console.log('✅ Required directories initialized.');

        await pokedexService.initialize();
        
        // --- PvP Ranks Auto-Generation Check ---
        // Compare against RAW pokedex.json because pokedex_modified.json is rewritten on every boot
        const pokedexPath = path.join(__dirname, 'data/public/pokedex.json'); 
        const ranksPath = path.join(__dirname, 'data/user/generated/pvp_ranks.json');
        
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
            console.log('⚠️ PvP Ranks file is older/missing. Starting background generation...');
            // Non-blocking execution
            const child = exec('node scripts/generate_pvp_ranks.js', { cwd: __dirname });
            
            child.stdout.on('data', (data) => process.stdout.write(data)); 
            child.stderr.on('data', (data) => process.stderr.write(data));

            child.on('close', (code) => {
                if (code !== 0) {
                    console.error(`\n❌ PvP Generation script exited with code ${code}`);
                } else {
                    console.log('\n✅ PvP Ranks generation complete. Reloading service...');
                    pvpService.reload();
                }
            });
        } else {
            console.log('✅ PvP Ranks are up to date.');
        }
        // ---------------------------------------

        // Initialize with whatever exists (could be empty or old file)
        await pvpService.init();
        await playerDataService.init();
        await playerDataService.initializeRankings();
        app.listen(config.PORT, () => console.log(`🚀 Server running at http://localhost:${config.PORT}`));
    } catch (error) {
        console.error('❌ CRITICAL: Failed to initialize services. Server will not start.', error);
        process.exit(1);
    }
})();