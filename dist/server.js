import express from 'express';
import session from 'express-session';
import sessionFileStore from 'session-file-store';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import fsPromises from 'fs/promises';
import { exec } from 'child_process';
import config from './config.js';
import pokedexService from './services/pokedexService.js';
import playerDataService from './services/playerDataService.js';
import pvpService from './services/pvpService.js';
import { router as authRoutes } from './routes/auth.js';
import apiRoutes from './routes/api.js';
const FileStore = sessionFileStore(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, no-cache, must-revalidate');
    }
};
app.use(express.static('public', staticOptions));
app.use('/data', express.static(path.join(__dirname, 'data'), staticOptions));
// --- Routes ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use(authRoutes);
app.use('/api', apiRoutes);
// --- Start Server ---
(async () => {
    try {
        const directories = [
            path.join(config.DATA_DIR, 'public'),
            path.join(config.DATA_DIR, 'private'),
            path.join(config.DATA_DIR, 'private/sessions'),
            path.join(config.DATA_DIR, 'user/custom'),
            path.join(config.DATA_DIR, 'user/generated'),
            config.DATA_PATH
        ];
        for (const dir of directories) {
            await fsPromises.mkdir(dir, { recursive: true });
        }
        console.log('✅ Required directories initialized.');
        await pokedexService.initialize();
        const pokedexPath = config.POKEDEX_RAW_FILE;
        const ranksPath = config.RANKINGS_FILE;
        let runGen = false;
        try {
            await fsPromises.access(ranksPath);
            const pokedexStats = await fsPromises.stat(pokedexPath);
            const ranksStats = await fsPromises.stat(ranksPath);
            if (ranksStats.mtime < pokedexStats.mtime) {
                console.log('⚠️ PvP Ranks file is older than Pokedex source. Regenerating...');
                runGen = true;
            }
        }
        catch (e) {
            console.log('⚠️ PvP Ranks file not found. Generating...');
            runGen = true;
        }
        if (runGen) {
            console.log('⚠️ PvP Ranks file is older/missing. Starting background generation...');
            // Check if we are running the compiled code or source
            const isProd = __dirname.includes('dist');
            const scriptPath = isProd
                ? path.join(__dirname, 'scripts/generate_pvp_ranks.js')
                : path.join(__dirname, 'scripts/generate_pvp_ranks.ts');
            const command = isProd ? `node ${scriptPath}` : `pnpm tsx ${scriptPath}`;
            const child = exec(command, { cwd: __dirname });
            child.stdout?.on('data', (data) => process.stdout.write(data));
            child.stderr?.on('data', (data) => process.stderr.write(data));
            child.on('close', (code) => {
                if (code !== 0) {
                    console.error(`\n❌ PvP Generation script exited with code ${code}`);
                }
                else {
                    console.log('\n✅ PvP Ranks generation complete. Reloading service...');
                    pvpService.reload();
                }
            });
        }
        else {
            console.log('✅ PvP Ranks are up to date.');
        }
        await pvpService.init();
        await playerDataService.init();
        await playerDataService.initializeRankings();
        app.listen(config.PORT, () => console.log(`🚀 Server running at http://localhost:${config.PORT}`));
    }
    catch (error) {
        console.error('❌ CRITICAL: Failed to initialize services. Server will not start.', error);
        process.exit(1);
    }
})();
