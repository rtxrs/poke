import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// If we are running from the 'dist' folder, the root is one level up
const rootDir = __dirname.includes('dist') ? path.join(__dirname, '..') : __dirname;
export const DATA_DIR = path.join(rootDir, 'data');
export const RANKINGS_FILE = path.join(DATA_DIR, 'private/rankings.json');
export const POKEDEX_FILE = path.join(DATA_DIR, 'user/generated/pokedex_modified.json');
export const POKEDEX_SERVER_FILE = path.join(DATA_DIR, 'user/generated/pokedex_server.json');
export const POKEDEX_CLIENT_FILE = path.join(DATA_DIR, 'user/generated/pokedex_client.json');
export const POKEDEX_RAW_FILE = path.join(DATA_DIR, 'public/pokedex.json');
export const COSTUME_ID_MAP_FILE = path.join(DATA_DIR, 'user/custom/costumeIdMap.json');
export const PUBLIC_ID_MAP_FILE = path.join(DATA_DIR, 'private/publicIdMap.json');
export const SHINY_RATES_FILE = path.join(DATA_DIR, 'user/custom/shinyRates.json');
export const MOVE_ID_MAP_FILE = path.join(DATA_DIR, 'moveIdMap.json');
export const FAST_MOVES_FILE = path.join(DATA_DIR, 'public/fast_moves.json');
export const CHARGED_MOVES_FILE = path.join(DATA_DIR, 'public/charged_moves.json');
export const TYPE_EFFECTIVENESS_FILE = path.join(DATA_DIR, 'public/type_effectiveness.json');
export const TYPE_EFFECTIVENESS_API_URL = 'https://pogoapi.net/api/v1/type_effectiveness.json';
export const RAID_BOSS_FILE = path.join(DATA_DIR, 'public/raidboss.json');
export const STATUS_FILE = path.join(DATA_DIR, 'user/generated/raidboss-update-status.json');
/**
 * For a production environment, it's highly recommended to use environment variables
 * for sensitive data and configuration that varies between environments.
 */
export const PORT = process.env.PORT || 3000;
export const DATA_FOLDER = 'pgsharp_player_data';
export const USERS_FILE = path.join(DATA_DIR, 'private/users.json');
export const POKEDEX_API_URL = 'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json';
export const SALT_ROUNDS = 10;
export const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-goes-here';
export const DATA_PATH = path.join(rootDir, DATA_FOLDER);
export default {
    PORT,
    DATA_FOLDER,
    USERS_FILE,
    POKEDEX_FILE,
    POKEDEX_SERVER_FILE,
    POKEDEX_CLIENT_FILE,
    POKEDEX_API_URL,
    SALT_ROUNDS,
    SESSION_SECRET,
    DATA_PATH,
    RANKINGS_FILE,
    DATA_DIR,
    PUBLIC_ID_MAP_FILE,
    SHINY_RATES_FILE,
    POKEDEX_RAW_FILE,
    COSTUME_ID_MAP_FILE,
    MOVE_ID_MAP_FILE,
    FAST_MOVES_FILE,
    CHARGED_MOVES_FILE,
    TYPE_EFFECTIVENESS_FILE,
    TYPE_EFFECTIVENESS_API_URL,
    RAID_BOSS_FILE,
    STATUS_FILE
};
