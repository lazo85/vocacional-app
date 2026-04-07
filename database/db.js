const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'vocacional.db');

let _db = null;

// Save the in-memory database to disk
function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Initialize synchronously by blocking on a promise resolution trick
async function init() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  // Run schema
  _db.run(`PRAGMA foreign_keys = ON;`);
  _db.run(`
    CREATE TABLE IF NOT EXISTS estudiantes (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre           TEXT    NOT NULL,
      apellido         TEXT    NOT NULL,
      edad             INTEGER NOT NULL,
      colegio          TEXT    NOT NULL,
      area_interes     TEXT    NOT NULL,
      carrera_elegida  TEXT    NOT NULL,
      fecha_registro   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS evaluaciones (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id    INTEGER NOT NULL,
      comprension      INTEGER NOT NULL,
      interes          INTEGER NOT NULL,
      habilidades      INTEGER NOT NULL,
      disfrute         INTEGER NOT NULL,
      puntaje_total    REAL    NOT NULL,
      decision_final   TEXT    NOT NULL,
      fecha_evaluacion TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  persist();
  return _db;
}

// ── Sync-style wrappers (matching better-sqlite3 API shape) ──────────────────

function getDb() {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

const db = {
  // Returns first matching row as plain object, or undefined
  get(sql, params = []) {
    const stmt = getDb().prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  },

  // Returns all matching rows as array of plain objects
  all(sql, params = []) {
    const results = [];
    const stmt = getDb().prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  // Runs a write statement, returns { lastInsertRowid, changes }
  run(sql, params = []) {
    getDb().run(sql, params);
    const lastInsertRowid = getDb().exec('SELECT last_insert_rowid()')[0]?.values[0][0] ?? 0;
    persist();
    return { lastInsertRowid };
  },

  // Convenience: prepare().run() style used in routes
  prepare(sql) {
    return {
      run: (...args) => {
        const params = args.flat();
        return db.run(sql, params);
      },
      get: (...args) => {
        const params = args.flat();
        return db.get(sql, params);
      },
      all: (...args) => {
        const params = args.flat();
        return db.all(sql, params);
      }
    };
  }
};

module.exports = { db, init };
