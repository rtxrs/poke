const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const RANKINGS_FILE = path.join(DATA_DIR, 'private/rankings.json');
const POKEDEX_FILE = path.join(DATA_DIR, 'user/generated/pokedex_modified.json');
const POKEDEX_SERVER_FILE = path.join(DATA_DIR, 'user/generated/pokedex_server.json');
const POKEDEX_CLIENT_FILE = path.join(DATA_DIR, 'user/generated/pokedex_client.json');
const POKEDEX_RAW_FILE = path.join(DATA_DIR, 'public/pokedex.json');
const COSTUME_ID_MAP_FILE = path.join(DATA_DIR, 'user/custom/costumeIdMap.json');
const PUBLIC_ID_MAP_FILE = path.join(DATA_DIR, 'private/publicIdMap.json');
const SHINY_RATES_FILE = path.join(DATA_DIR, 'user/custom/shinyRates.json');
const MOVE_ID_MAP_FILE = path.join(DATA_DIR, 'moveIdMap.json');
const FAST_MOVES_FILE = path.join(DATA_DIR, 'public/fast_moves.json');
const CHARGED_MOVES_FILE = path.join(DATA_DIR, 'public/charged_moves.json');
const TYPE_EFFECTIVENESS_FILE = path.join(DATA_DIR, 'public/type_effectiveness.json');
const TYPE_EFFECTIVENESS_API_URL = 'https://pogoapi.net/api/v1/type_effectiveness.json';

/**
 * For a production environment, it's highly recommended to use environment variables
 * for sensitive data and configuration that varies between environments.
 * Example: const PORT = process.env.PORT || 3000;
 */

const PORT = 3000;
const DATA_FOLDER = 'pgsharp_player_data';
const USERS_FILE = path.join(DATA_DIR, 'private/users.json');
const POKEDEX_API_URL = 'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json';
const SALT_ROUNDS = 10;
const SESSION_SECRET = 'your-secret-key-goes-here'; // IMPORTANT: In production, use an environment variable!

module.exports = {
    PORT,
    DATA_FOLDER,
    USERS_FILE,
    POKEDEX_FILE,
    POKEDEX_SERVER_FILE,
    POKEDEX_CLIENT_FILE,
    POKEDEX_API_URL,
    SALT_ROUNDS,
    SESSION_SECRET,
    DATA_PATH: path.join(__dirname, DATA_FOLDER),
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
    TYPE_EFFECTIVENESS_API_URL
};
