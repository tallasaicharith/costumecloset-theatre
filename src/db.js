// PART 2 - DATABASE
// Creates the SQLite database, the 3 related tables, and some starter data.

const path = require('path');
const Database = require('better-sqlite3');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'costumecloset.db');
const db = new Database(DB_FILE);

// SQLite does not check foreign keys unless we switch it on
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS actors (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT NOT NULL,
    email  TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS costumes (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name   TEXT NOT NULL,
    era    TEXT NOT NULL,
    size   TEXT
  );

  CREATE TABLE IF NOT EXISTS hires (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id     INTEGER NOT NULL REFERENCES actors(id),
    costume_id   INTEGER NOT NULL REFERENCES costumes(id),
    hire_date    TEXT NOT NULL,
    due_date     TEXT NOT NULL,
    return_date  TEXT            -- NULL means the costume is still out
  );
`);

// Seed starter data only when the database is empty
const count = db.prepare('SELECT COUNT(*) AS n FROM actors').get().n;
if (count === 0) {
  const addActor = db.prepare('INSERT INTO actors (name, email) VALUES (?, ?)');
  addActor.run('Priya Sharma', 'priya@costumecloset.test');
  addActor.run('Rahul Verma', 'rahul@costumecloset.test');
  addActor.run('Ananya Rao', 'ananya@costumecloset.test');

  const addCostume = db.prepare('INSERT INTO costumes (name, era, size) VALUES (?, ?, ?)');
  addCostume.run('Ball Gown', 'Victorian', 'M');
  addCostume.run('Knight Armour', 'Medieval', 'L');
  addCostume.run('Flapper Dress', '1920s', 'S');
  addCostume.run('Top Hat and Tails', 'Victorian', 'L');
  addCostume.run('Toga', 'Roman', 'M');

  const addHire = db.prepare(
    'INSERT INTO hires (actor_id, costume_id, hire_date, due_date, return_date) VALUES (?, ?, ?, ?, ?)'
  );
  addHire.run(1, 1, '2026-11-01', '2026-11-08', null);         // hire 1: Priya, still out (used in Test 1)
  addHire.run(2, 2, '2026-11-02', '2026-11-09', null);         // hire 2: Rahul, still out
  addHire.run(1, 3, '2026-10-20', '2026-10-27', '2026-10-26'); // hire 3: Priya, already returned
}

module.exports = db;
