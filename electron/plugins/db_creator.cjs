// Pure Node SQLite generator (sql.js / WASM) — no native build, no Python dependency.
'use strict';
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const parseMaybeJson = (v, fallback) => {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

function buildColumnSql(col) {
  const name = col.name;
  const type = String(col.type || 'TEXT').toUpperCase();
  if (col.primary_key) {
    return type === 'INTEGER' ? `"${name}" INTEGER PRIMARY KEY AUTOINCREMENT` : `"${name}" ${type} PRIMARY KEY`;
  }
  return `"${name}" ${type}`;
}

async function createDatabase(payload = {}) {
  const { file_path, db_type = 'sqlite', tables = [] } = payload;
  if (!file_path) return { success: false, message: 'file_path is required' };
  if (db_type !== 'sqlite') {
    return { success: false, message: `Database type "${db_type}" is not supported — only "sqlite" is supported.` };
  }

  try {
    fs.mkdirSync(path.dirname(file_path), { recursive: true });

    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const createdTables = [];

    for (const table of tables) {
      const columns = parseMaybeJson(table.columns, []);
      if (!Array.isArray(columns) || columns.length === 0) continue;

      db.run(`CREATE TABLE "${table.name}" (${columns.map(buildColumnSql).join(', ')});`);
      createdTables.push(table.name);

      const sampleData = parseMaybeJson(table.sample_data, []);
      if (Array.isArray(sampleData) && sampleData.length > 0) {
        const colNames = columns.map((c) => `"${c.name}"`).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const stmt = db.prepare(`INSERT INTO "${table.name}" (${colNames}) VALUES (${placeholders});`);
        for (const row of sampleData) {
          stmt.run(Array.isArray(row) ? row : columns.map((c) => row[c.name] ?? null));
        }
        stmt.free();
      }
    }

    const bytes = db.export();
    fs.writeFileSync(file_path, Buffer.from(bytes));
    db.close();

    return { success: true, message: `Database created with ${createdTables.length} table(s)`, file_path, tables: createdTables };
  } catch (err) {
    return { success: false, message: err.message || 'Failed to create database' };
  }
}

module.exports = { createDatabase };

if (require.main === module) {
  const payload = JSON.parse(process.argv[2] || '{}');
  createDatabase(payload).then((r) => {
    console.log(JSON.stringify(r));
    process.exitCode = r.success ? 0 : 1;
  });
}
