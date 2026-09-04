const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { initDatabase, runQuery, getQuery, allQuery } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ============================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================

app.post('/api/auth/register', (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const existingUser = getQuery('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Este correo ya está registrado' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = runQuery('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        runQuery('INSERT INTO user_data (user_id) VALUES (?)', [result.lastID]);

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            userId: result.lastID
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const user = getQuery('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        res.json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ============================================
// ENDPOINTS DE DATOS DEL USUARIO
// ============================================

app.get('/api/user/:userId/data', (req, res) => {
    try {
        const { userId } = req.params;
        const userData = getQuery('SELECT * FROM user_data WHERE user_id = ?', [userId]);

        if (!userData) {
            return res.status(404).json({ error: 'Datos de usuario no encontrados' });
        }

        res.json({
            level: userData.level,
            xp: userData.xp,
            totalCompleted: userData.total_completed,
            streak: userData.streak,
            bestStreak: userData.best_streak,
            lastCompletedDate: userData.last_completed_date,
            pomodorosToday: userData.pomodoros_today,
            achievements: JSON.parse(userData.achievements),
            currentTheme: userData.current_theme
        });
    } catch (error) {
        console.error('Error obteniendo datos:', error);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

app.put('/api/user/:userId/data', (req, res) => {
    try {
        const { userId } = req.params;
        const {
            level, xp, totalCompleted, streak, bestStreak,
            lastCompletedDate, pomodorosToday, achievements, currentTheme
        } = req.body;

        // Asegurar que no haya valores undefined
        runQuery(`
            UPDATE user_data SET
                level = ?, xp = ?, total_completed = ?,
                streak = ?, best_streak = ?, last_completed_date = ?,
                pomodoros_today = ?, achievements = ?, current_theme = ?
            WHERE user_id = ?
        `, [
            level || 1,
            xp || 0,
            totalCompleted || 0,
            streak || 0,
            bestStreak || 0,
            lastCompletedDate || null,
            pomodorosToday || 0,
            JSON.stringify(achievements || []),
            currentTheme || 'light',
            userId
        ]);

        res.json({ message: 'Datos actualizados correctamente' });
    } catch (error) {
        console.error('Error actualizando datos:', error);
        res.status(500).json({ error: 'Error al actualizar datos' });
    }
});

// ============================================
// ENDPOINTS DE TAREAS
// ============================================

app.get('/api/user/:userId/tasks', (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = allQuery('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        const formattedTasks = tasks.map(task => ({
            id: task.id,
            text: task.text,
            category: task.category,
            priority: task.priority,
            completed: Boolean(task.completed),
            xp: task.xp,
            createdAt: task.created_at,
            completedAt: task.completed_at
        }));

        res.json(formattedTasks);
    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});

app.post('/api/user/:userId/tasks', (req, res) => {
    try {
        const { userId } = req.params;
        const { text, category, priority, xp } = req.body;

        if (!text || !category || !priority) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const result = runQuery(
            'INSERT INTO tasks (user_id, text, category, priority, xp) VALUES (?, ?, ?, ?, ?)',
            [userId, text, category, priority, xp || 0]
        );

        res.status(201).json({
            message: 'Tarea creada exitosamente',
            taskId: result.lastID
        });
    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error al crear tarea' });
    }
});

app.put('/api/user/:userId/tasks/:taskId', (req, res) => {
    try {
        const { userId, taskId } = req.params;
        const { completed } = req.body;
        const completedAt = completed ? new Date().toISOString() : null;

        runQuery(
            'UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ? AND user_id = ?',
            [completed ? 1 : 0, completedAt, taskId, userId]
        );

        res.json({ message: 'Tarea actualizada correctamente' });
    } catch (error) {
        console.error('Error actualizando tarea:', error);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
});

app.delete('/api/user/:userId/tasks/:taskId', (req, res) => {
    try {
        const { userId, taskId } = req.params;
        runQuery('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
        res.json({ message: 'Tarea eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminando tarea:', error);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});

// ============================================
// ENDPOINTS DE ESTADÍSTICAS
// ============================================

app.get('/api/user/:userId/stats', (req, res) => {
    try {
        const { userId } = req.params;

        const categoryStats = allQuery(`
            SELECT category, COUNT(*) as count
            FROM tasks WHERE user_id = ? AND completed = 1
            GROUP BY category
        `, [userId]);

        const weeklyStats = allQuery(`
            SELECT date, tasks_completed
            FROM stats_history WHERE user_id = ?
            ORDER BY date DESC LIMIT 7
        `, [userId]);

        res.json({
            categoryStats,
            weeklyStats: weeklyStats.reverse()
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

app.post('/api/user/:userId/stats/daily', (req, res) => {
    try {
        const { userId } = req.params;
        const { tasksCompleted, pomodorosCompleted, xpEarned } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const existing = getQuery(
            'SELECT id FROM stats_history WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        if (existing) {
            runQuery(`
                UPDATE stats_history SET
                    tasks_completed = tasks_completed + ?,
                    pomodoros_completed = pomodoros_completed + ?,
                    xp_earned = xp_earned + ?
                WHERE id = ?
            `, [tasksCompleted || 0, pomodorosCompleted || 0, xpEarned || 0, existing.id]);
        } else {
            runQuery(
                'INSERT INTO stats_history (user_id, date, tasks_completed, pomodoros_completed, xp_earned) VALUES (?, ?, ?, ?, ?)',
                [userId, today, tasksCompleted || 0, pomodorosCompleted || 0, xpEarned || 0]
            );
        }

        res.json({ message: 'Estadísticas actualizadas' });
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
        res.status(500).json({ error: 'Error al actualizar estadísticas' });
    }
});

// ============================================
// INICIALIZAR Y SERVIDOR
// ============================================

async function startServer() {
    try {
        await initDatabase();

        app.listen(PORT, () => {
            console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📱 Abre tu navegador en: http://localhost:${PORT}/task-manager.html\n`);
        });
    } catch (error) {
        console.error('Error iniciando servidor:', error);
        process.exit(1);
    }
}

startServer();
