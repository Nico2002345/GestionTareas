const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'taskmaster.db');

let db = null;

async function initDatabase() {
    const SQL = await initSqlJs();

    // Intentar cargar base de datos existente
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
        console.log('✅ Conectado a la base de datos SQLite: taskmaster.db');
    } else {
        db = new SQL.Database();
        console.log('✅ Creada nueva base de datos SQLite: taskmaster.db');
    }

    // Habilitar claves foráneas
    db.run('PRAGMA foreign_keys = ON');

    // Crear tablas
    createTables();

    // Guardar la base de datos
    saveDatabase();

    return db;
}

function createTables() {
    // Tabla de usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Tabla users creada/verificada');

    // Tabla de datos del usuario
    db.run(`
        CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            total_completed INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0,
            best_streak INTEGER DEFAULT 0,
            last_completed_date TEXT,
            pomodoros_today INTEGER DEFAULT 0,
            achievements TEXT DEFAULT '[]',
            current_theme TEXT DEFAULT 'light',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('✅ Tabla user_data creada/verificada');

    // Tabla de tareas
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            completed BOOLEAN DEFAULT 0,
            xp INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('✅ Tabla tasks creada/verificada');

    // Tabla de estadísticas históricas
    db.run(`
        CREATE TABLE IF NOT EXISTS stats_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            tasks_completed INTEGER DEFAULT 0,
            pomodoros_completed INTEGER DEFAULT 0,
            xp_earned INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('✅ Tabla stats_history creada/verificada');

    // Índices
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_stats_user_date ON stats_history(user_id, date)`);
}

function saveDatabase() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

// Helper functions
function runQuery(sql, params = []) {
    if (!db) throw new Error('Database not initialized');
    db.run(sql, params);
    saveDatabase();
    return { lastID: getLastInsertId(), changes: db.getRowsModified() };
}

function getQuery(sql, params = []) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
}

function allQuery(sql, params = []) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function getLastInsertId() {
    const result = getQuery('SELECT last_insert_rowid() as id');
    return result ? result.id : null;
}

module.exports = {
    initDatabase,
    getDb: () => db,
    runQuery,
    getQuery,
    allQuery,
    saveDatabase
};
