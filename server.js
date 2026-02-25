const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { runQuery, getQuery, allQuery } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Servir archivos estáticos (HTML, CSS, JS)

// ============================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validaciones
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el email ya existe
        const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Este correo ya está registrado' });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const result = await runQuery(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Crear datos iniciales del usuario
        await runQuery(
            'INSERT INTO user_data (user_id) VALUES (?)',
            [result.id]
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            userId: result.id
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario
        const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Retornar datos del usuario (sin contraseña)
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

// Obtener datos completos del usuario
app.get('/api/user/:userId/data', async (req, res) => {
    try {
        const { userId } = req.params;

        const userData = await getQuery('SELECT * FROM user_data WHERE user_id = ?', [userId]);

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

// Actualizar datos del usuario
app.put('/api/user/:userId/data', async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            level,
            xp,
            totalCompleted,
            streak,
            bestStreak,
            lastCompletedDate,
            pomodorosToday,
            achievements,
            currentTheme
        } = req.body;

        await runQuery(`
            UPDATE user_data SET
                level = ?,
                xp = ?,
                total_completed = ?,
                streak = ?,
                best_streak = ?,
                last_completed_date = ?,
                pomodoros_today = ?,
                achievements = ?,
                current_theme = ?
            WHERE user_id = ?
        `, [
            level,
            xp,
            totalCompleted,
            streak,
            bestStreak,
            lastCompletedDate,
            pomodorosToday,
            JSON.stringify(achievements),
            currentTheme,
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

// Obtener todas las tareas de un usuario
app.get('/api/user/:userId/tasks', async (req, res) => {
    try {
        const { userId } = req.params;

        const tasks = await allQuery(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // Convertir el campo completed de 0/1 a boolean
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

// Crear nueva tarea
app.post('/api/user/:userId/tasks', async (req, res) => {
    try {
        const { userId } = req.params;
        const { text, category, priority, xp } = req.body;

        if (!text || !category || !priority) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const result = await runQuery(
            'INSERT INTO tasks (user_id, text, category, priority, xp) VALUES (?, ?, ?, ?, ?)',
            [userId, text, category, priority, xp || 0]
        );

        res.status(201).json({
            message: 'Tarea creada exitosamente',
            taskId: result.id
        });
    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error al crear tarea' });
    }
});

// Actualizar tarea (marcar como completada, etc.)
app.put('/api/user/:userId/tasks/:taskId', async (req, res) => {
    try {
        const { userId, taskId } = req.params;
        const { completed } = req.body;

        const completedAt = completed ? new Date().toISOString() : null;

        await runQuery(
            'UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ? AND user_id = ?',
            [completed ? 1 : 0, completedAt, taskId, userId]
        );

        res.json({ message: 'Tarea actualizada correctamente' });
    } catch (error) {
        console.error('Error actualizando tarea:', error);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
});

// Eliminar tarea
app.delete('/api/user/:userId/tasks/:taskId', async (req, res) => {
    try {
        const { userId, taskId } = req.params;

        await runQuery(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );

        res.json({ message: 'Tarea eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminando tarea:', error);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});

// ============================================
// ENDPOINTS DE ESTADÍSTICAS
// ============================================

// Obtener estadísticas del usuario
app.get('/api/user/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;

        // Obtener tareas completadas por categoría
        const categoryStats = await allQuery(`
            SELECT category, COUNT(*) as count
            FROM tasks
            WHERE user_id = ? AND completed = 1
            GROUP BY category
        `, [userId]);

        // Obtener actividad semanal (últimos 7 días)
        const weeklyStats = await allQuery(`
            SELECT date, tasks_completed
            FROM stats_history
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT 7
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

// Actualizar estadísticas del día
app.post('/api/user/:userId/stats/daily', async (req, res) => {
    try {
        const { userId } = req.params;
        const { tasksCompleted, pomodorosCompleted, xpEarned } = req.body;

        const today = new Date().toISOString().split('T')[0];

        // Verificar si ya existe registro para hoy
        const existing = await getQuery(
            'SELECT id FROM stats_history WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        if (existing) {
            // Actualizar
            await runQuery(`
                UPDATE stats_history SET
                    tasks_completed = tasks_completed + ?,
                    pomodoros_completed = pomodoros_completed + ?,
                    xp_earned = xp_earned + ?
                WHERE id = ?
            `, [tasksCompleted || 0, pomodorosCompleted || 0, xpEarned || 0, existing.id]);
        } else {
            // Crear nuevo
            await runQuery(
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
// SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📱 Abre tu navegador en: http://localhost:${PORT}/task-manager.html\n`);
});
