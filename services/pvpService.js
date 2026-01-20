const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/user/pvp_ranks.db');

// Ensure data/user directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize Database Schema
let insertStmt;
let insertTransaction;

function init() {
    db.pragma('journal_mode = WAL');

    db.exec(`
        CREATE TABLE IF NOT EXISTS pvp_ranks (
            pokemon_id TEXT,
            form TEXT,
            league TEXT,
            rank INTEGER,
            iv_attack INTEGER,
            iv_defense INTEGER,
            iv_stamina INTEGER,
            level REAL,
            cp INTEGER,
            stat_product REAL,
            percentage REAL,
            PRIMARY KEY (pokemon_id, form, league, rank)
        );

        CREATE INDEX IF NOT EXISTS idx_pokemon_lookup 
        ON pvp_ranks(pokemon_id, form, league);

        CREATE UNIQUE INDEX IF NOT EXISTS idx_pvp_lookup_ivs 
        ON pvp_ranks(pokemon_id, form, league, iv_attack, iv_defense, iv_stamina);
    `);

    // Prepare the insert statement once for performance
    insertStmt = db.prepare(`
        INSERT OR REPLACE INTO pvp_ranks 
        (pokemon_id, form, league, rank, iv_attack, iv_defense, iv_stamina, level, cp, stat_product, percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTransaction = db.transaction((rows) => {
        for (const row of rows) {
            insertStmt.run(
                row.pokemon_id,
                row.form,
                row.league,
                row.rank,
                row.iv_attack,
                row.iv_defense,
                row.iv_stamina,
                row.level,
                row.cp,
                row.stat_product,
                row.percentage
            );
        }
    });
}

function insertMany(rows) {
    if (!insertTransaction) {
        throw new Error("Database not initialized. Call init() first.");
    }
    insertTransaction(rows);
}


function getRanks(pokemonId, form, league, limit = 100) {
    const stmt = db.prepare(`
        SELECT rank, iv_attack, iv_defense, iv_stamina, level, cp, stat_product, percentage
        FROM pvp_ranks
        WHERE pokemon_id = ? AND form = ? AND league = ?
        ORDER BY rank ASC
        LIMIT ?
    `);
    return stmt.all(pokemonId, form, league, limit);
}

function getRank(pokemonId, form, league, ivAttack, ivDefense, ivStamina) {
    const stmt = db.prepare(`
        SELECT rank, percentage, level, cp, stat_product
        FROM pvp_ranks
        WHERE pokemon_id = ? AND form = ? AND league = ? 
        AND iv_attack = ? AND iv_defense = ? AND iv_stamina = ?
    `);
    return stmt.get(pokemonId, form, league, ivAttack, ivDefense, ivStamina);
}

module.exports = {
    init,
    insertMany,
    getRanks,
    getRank,
    db
};
