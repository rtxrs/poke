const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/user/pvp_ranks.db');
const db = new Database(DB_PATH);

try {
    const row = db.prepare('SELECT count(*) as count FROM pvp_ranks').get();
    console.log(`Row count: ${row.count}`);
} catch (error) {
    console.error('Error querying database:', error.message);
}
