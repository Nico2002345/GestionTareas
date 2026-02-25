const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear/conectar a la base de datos
const dbPath = path.join(__dirname, 'taskmaster.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('✅ Conectado a la base de datos SQLite: taskmaster.db');
        initializeDatabase();
    }
});

// Inicializar tablas
function initializeDatabase() {
    // Tabla de usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creando tabla users:', err.message);
        } else {
            console.log('✅ Tabla users creada/verificada');
        }
    });

    // Tabla de datos del usuario (nivel, XP, rachas, etc.)
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
    `, (err) => {
        if (err) {
            console.error('Error creando tabla user_data:', err.message);
        } else {
            console.log('✅ Tabla user_data creada/verificada');
        }
    });

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
    `, (err) => {
        if (err) {
            console.error('Error creando tabla tasks:', err.message);
        } else {
            console.log('✅ Tabla tasks creada/verificada');
        }
    });

    // Tabla de estadísticas históricas (para gráficos)
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
    `, (err) => {
        if (err) {
            console.error('Error creando tabla stats_history:', err.message);
        } else {
            console.log('✅ Tabla stats_history creada/verificada');
        }
    });

    // Índices para mejorar rendimiento
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_stats_user_date ON stats_history(user_id, date)`);
}

// Funciones helper para promisify las queries
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = {
    db,
    runQuery,
    getQuery,
    allQuery
};
