// ============================================
// CONFIGURACIÓN DE LA API
// ============================================

const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// ============================================
// SISTEMA DE AUTENTICACIÓN CON API
// ============================================

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

async function register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // Validaciones frontend
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un correo válido', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.error || 'Error al registrar', 'error');
            return;
        }

        showNotification('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión', 'success');

        // Limpiar formulario
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirmPassword').value = '';

        showLogin();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión con el servidor', 'error');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un correo válido', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.error || 'Error al iniciar sesión', 'error');
            return;
        }

        // Guardar usuario actual
        currentUser = data.user;
        localStorage.setItem('currentUserId', data.user.id);
        localStorage.setItem('currentUserName', data.user.name);
        localStorage.setItem('currentUserEmail', data.user.email);

        // Limpiar formulario
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';

        // Mostrar aplicación
        showApp();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión con el servidor', 'error');
    }
}

function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUserName');
        localStorage.removeItem('currentUserEmail');
        currentUser = null;

        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authContainer').style.display = 'flex';

        showNotification('Sesión cerrada correctamente', 'success');
    }
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    document.getElementById('userEmail').textContent = currentUser.name || currentUser.email;

    initializeApp();
    showNotification(`¡Bienvenido de nuevo, ${currentUser.name}!`, 'success');
}

async function initializeApp() {
    await loadData();
    renderTasks();
    renderAchievements();
    updateUI();
    updateStats();
    updatePomodoroDisplay();
    updatePomodoroTaskList();

    if (appState.user.totalCompleted === 0 && appState.tasks.length === 0) {
        setTimeout(() => {
            showNotification('👋 ¡Completa tareas y sube de nivel!', 'success');
        }, 1000);
    }
}

function checkAuth() {
    const userId = localStorage.getItem('currentUserId');
    const userName = localStorage.getItem('currentUserName');
    const userEmail = localStorage.getItem('currentUserEmail');

    if (userId && userName && userEmail) {
        currentUser = {
            id: parseInt(userId),
            name: userName,
            email: userEmail
        };
        showApp();
        return true;
    }

    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    return false;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ============================================

let appState = {
    tasks: [],
    user: {
        level: 1,
        xp: 0,
        totalCompleted: 0,
        streak: 0,
        bestStreak: 0,
        lastCompletedDate: null,
        pomodorosToday: 0,
        achievements: []
    },
    filter: 'todas',
    currentTheme: 'light',
    pomodoro: {
        isRunning: false,
        isPaused: false,
        timeLeft: 25 * 60,
        mode: 'work',
        currentTaskId: null
    }
};

// ============================================
// SISTEMA DE LOGROS
// ============================================

const ACHIEVEMENTS = [
    {
        id: 'first_task',
        name: 'Primera Tarea',
        description: 'Completa tu primera tarea',
        icon: '🎯',
        reward: 50,
        check: (state) => state.user.totalCompleted >= 1
    },
    {
        id: 'task_master',
        name: 'Maestro de Tareas',
        description: 'Completa 10 tareas',
        icon: '⭐',
        reward: 100,
        check: (state) => state.user.totalCompleted >= 10
    },
    {
        id: 'task_legend',
        name: 'Leyenda de Tareas',
        description: 'Completa 50 tareas',
        icon: '👑',
        reward: 500,
        check: (state) => state.user.totalCompleted >= 50
    },
    {
        id: 'week_warrior',
        name: 'Guerrero Semanal',
        description: 'Mantén una racha de 7 días',
        icon: '🔥',
        reward: 200,
        check: (state) => state.user.streak >= 7
    },
    {
        id: 'month_master',
        name: 'Maestro Mensual',
        description: 'Mantén una racha de 30 días',
        icon: '💎',
        reward: 1000,
        check: (state) => state.user.streak >= 30
    },
    {
        id: 'pomodoro_starter',
        name: 'Inicio Pomodoro',
        description: 'Completa tu primer Pomodoro',
        icon: '🍅',
        reward: 50,
        check: (state) => state.user.pomodorosToday >= 1
    },
    {
        id: 'focus_master',
        name: 'Maestro del Enfoque',
        description: 'Completa 10 Pomodoros',
        icon: '🧠',
        reward: 300,
        check: (state) => {
            const stats = getStats();
            return stats.totalPomodoros >= 10;
        }
    },
    {
        id: 'high_priority',
        name: 'Prioridad Alta',
        description: 'Completa 5 tareas de alta prioridad',
        icon: '⚡',
        reward: 150,
        check: (state) => {
            const highPriorityCompleted = state.tasks.filter(
                t => t.completed && t.priority === 'alta'
            ).length;
            return highPriorityCompleted >= 5;
        }
    },
    {
        id: 'organized',
        name: 'Organizado',
        description: 'Crea tareas en todas las categorías',
        icon: '📚',
        reward: 100,
        check: (state) => {
            const categories = new Set(state.tasks.map(t => t.category));
            return categories.size >= 5;
        }
    },
    {
        id: 'level_5',
        name: 'Nivel 5',
        description: 'Alcanza el nivel 5',
        icon: '🏅',
        reward: 0,
        check: (state) => state.user.level >= 5
    },
    {
        id: 'level_10',
        name: 'Nivel 10',
        description: 'Alcanza el nivel 10',
        icon: '🏆',
        reward: 0,
        check: (state) => state.user.level >= 10
    }
];

// ============================================
// CÁLCULO DE XP POR TAREA
// ============================================

function calculateTaskXP(task) {
    let baseXP = 20;

    if (task.priority === 'alta') baseXP += 30;
    else if (task.priority === 'media') baseXP += 15;
    else baseXP += 5;

    if (task.category === 'estudio' || task.category === 'trabajo') {
        baseXP += 10;
    }

    return baseXP;
}

// ============================================
// GESTIÓN DE TAREAS CON API
// ============================================

async function addTask() {
    const input = document.getElementById('taskInput');
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;

    if (input.value.trim() === '') {
        showNotification('Por favor escribe una tarea', 'error');
        return;
    }

    const taskData = {
        text: input.value.trim(),
        category: category,
        priority: priority
    };

    const xp = calculateTaskXP(taskData);
    taskData.xp = xp;

    try {
        const response = await fetch(`${API_URL}/user/${currentUser.id}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            throw new Error('Error al crear tarea');
        }

        input.value = '';
        await loadTasks();
        renderTasks();
        updatePomodoroTaskList();
        showNotification('✅ Tarea agregada correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al agregar tarea', 'error');
    }
}

async function toggleTask(id) {
    const task = appState.tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;

    try {
        const response = await fetch(`${API_URL}/user/${currentUser.id}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: newCompleted })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar tarea');
        }

        // Actualizar estado local
        task.completed = newCompleted;

        if (newCompleted) {
            addXP(task.xp);
            appState.user.totalCompleted++;
            updateStreak();
            checkAchievements();
            showNotification(`🎉 ¡Ganaste ${task.xp} XP!`, 'success');

            // Actualizar estadísticas del día
            await updateDailyStats(1, 0, task.xp);
        } else {
            appState.user.xp = Math.max(0, appState.user.xp - task.xp);
            appState.user.totalCompleted--;
            updateLevel();
        }

        await saveData();
        renderTasks();
        updateUI();
        updateStats();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al actualizar tarea', 'error');
    }
}

async function deleteTask(id) {
    try {
        const response = await fetch(`${API_URL}/user/${currentUser.id}/tasks/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar tarea');
        }

        await loadTasks();
        renderTasks();
        updatePomodoroTaskList();
        showNotification('🗑️ Tarea eliminada', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar tarea', 'error');
    }
}

function filterTasks(filter) {
    appState.filter = filter;
    renderTasks();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function renderTasks() {
    const container = document.getElementById('tasksList');
    let filteredTasks = appState.tasks;

    if (appState.filter === 'activas') {
        filteredTasks = appState.tasks.filter(t => !t.completed);
    } else if (appState.filter === 'completadas') {
        filteredTasks = appState.tasks.filter(t => t.completed);
    } else if (appState.filter === 'alta') {
        filteredTasks = appState.tasks.filter(t => !t.completed && t.priority === 'alta');
    }

    if (filteredTasks.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">📭 No hay tareas aquí</div>';
        return;
    }

    container.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" style="border-left-color: var(--cat-${task.category})">
            <input type="checkbox"
                   class="task-checkbox"
                   ${task.completed ? 'checked' : ''}
                   onchange="toggleTask(${task.id})">
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    <span class="task-category ${task.category}">${getCategoryIcon(task.category)} ${task.category}</span>
                    <span class="task-priority ${task.priority}">${getPriorityIcon(task.priority)} ${task.priority}</span>
                    <span class="task-xp">+${task.xp} XP</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn delete" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        trabajo: '💼',
        personal: '🏠',
        estudio: '📚',
        salud: '💪',
        compras: '🛒'
    };
    return icons[category] || '📌';
}

function getPriorityIcon(priority) {
    const icons = {
        alta: '⬆️',
        media: '➡️',
        baja: '⬇️'
    };
    return icons[priority] || '➡️';
}

// ============================================
// SISTEMA DE GAMIFICACIÓN
// ============================================

function addXP(amount) {
    appState.user.xp += amount;
    updateLevel();
}

function updateLevel() {
    const xpForNextLevel = appState.user.level * 100;

    if (appState.user.xp >= xpForNextLevel) {
        appState.user.level++;
        appState.user.xp -= xpForNextLevel;
        showNotification(`🎊 ¡NIVEL ${appState.user.level}! ¡Sigue así!`, 'level-up');
        checkAchievements();
    }

    updateUI();
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastDate = appState.user.lastCompletedDate;

    if (!lastDate) {
        appState.user.streak = 1;
        appState.user.lastCompletedDate = today;
    } else {
        const lastCompleted = new Date(lastDate);
        const now = new Date();
        const diffTime = Math.abs(now - lastCompleted);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Mismo día
        } else if (diffDays === 1) {
            appState.user.streak++;
            appState.user.lastCompletedDate = today;
        } else {
            appState.user.streak = 1;
            appState.user.lastCompletedDate = today;
        }
    }

    if (appState.user.streak > appState.user.bestStreak) {
        appState.user.bestStreak = appState.user.streak;
    }
}

function updateUI() {
    document.getElementById('userLevel').textContent = appState.user.level;
    document.getElementById('userXP').textContent = appState.user.xp;
    document.getElementById('userStreak').textContent = appState.user.streak + '🔥';

    const xpForNextLevel = appState.user.level * 100;
    const progress = (appState.user.xp / xpForNextLevel) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `${appState.user.xp} / ${xpForNextLevel} XP`;
}

// ============================================
// SISTEMA DE LOGROS
// ============================================

function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
        if (!appState.user.achievements.includes(achievement.id)) {
            if (achievement.check(appState)) {
                unlockAchievement(achievement);
            }
        }
    });
}

function unlockAchievement(achievement) {
    appState.user.achievements.push(achievement.id);

    if (achievement.reward > 0) {
        appState.user.xp += achievement.reward;
        updateLevel();
    }

    showNotification(`🏆 ¡LOGRO DESBLOQUEADO! ${achievement.name} (+${achievement.reward} XP)`, 'level-up');
    renderAchievements();
    saveData();
}

function renderAchievements() {
    const container = document.getElementById('achievementsList');

    container.innerHTML = ACHIEVEMENTS.map(achievement => {
        const unlocked = appState.user.achievements.includes(achievement.id);
        return `
            <div class="achievement-card ${unlocked ? '' : 'locked'}">
                <div class="achievement-icon">${unlocked ? achievement.icon : '🔒'}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                ${achievement.reward > 0 ? `<div class="achievement-reward">+${achievement.reward} XP</div>` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// TEMPORIZADOR POMODORO
// ============================================

let pomodoroInterval = null;

function startPomodoro() {
    if (appState.pomodoro.isRunning && !appState.pomodoro.isPaused) return;

    appState.pomodoro.isRunning = true;
    appState.pomodoro.isPaused = false;

    pomodoroInterval = setInterval(() => {
        if (appState.pomodoro.timeLeft > 0) {
            appState.pomodoro.timeLeft--;
            updatePomodoroDisplay();
        } else {
            pomodoroComplete();
        }
    }, 1000);
}

function pausePomodoro() {
    appState.pomodoro.isPaused = true;
    clearInterval(pomodoroInterval);
}

function resetPomodoro() {
    clearInterval(pomodoroInterval);
    appState.pomodoro.isRunning = false;
    appState.pomodoro.isPaused = false;

    const workDuration = parseInt(document.getElementById('workDuration').value) || 25;
    appState.pomodoro.timeLeft = workDuration * 60;
    appState.pomodoro.mode = 'work';

    updatePomodoroDisplay();
}

async function pomodoroComplete() {
    clearInterval(pomodoroInterval);

    if (appState.pomodoro.mode === 'work') {
        appState.user.pomodorosToday++;
        addXP(25);
        showNotification('🍅 ¡Pomodoro completado! Toma un descanso', 'success');

        const breakDuration = parseInt(document.getElementById('breakDuration').value) || 5;
        appState.pomodoro.timeLeft = breakDuration * 60;
        appState.pomodoro.mode = 'break';

        checkAchievements();
        await updateDailyStats(0, 1, 25);
    } else {
        showNotification('✅ Descanso completado. ¡A trabajar!', 'success');

        const workDuration = parseInt(document.getElementById('workDuration').value) || 25;
        appState.pomodoro.timeLeft = workDuration * 60;
        appState.pomodoro.mode = 'work';
    }

    appState.pomodoro.isRunning = false;
    updatePomodoroDisplay();
    await saveData();
    updateStats();
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(appState.pomodoro.timeLeft / 60);
    const seconds = appState.pomodoro.timeLeft % 60;

    document.getElementById('timerDisplay').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('timerMode').textContent =
        appState.pomodoro.mode === 'work' ? 'Trabajo 💼' : 'Descanso ☕';

    document.getElementById('pomodoroCount').textContent = appState.user.pomodorosToday;
}

function updatePomodoroTaskList() {
    const select = document.getElementById('pomodoroTaskSelect');
    const activeTasks = appState.tasks.filter(t => !t.completed);

    select.innerHTML = '<option value="">Selecciona una tarea...</option>' +
        activeTasks.map(task =>
            `<option value="${task.id}">${task.text}</option>`
        ).join('');
}

// ============================================
// ESTADÍSTICAS
// ============================================

function getStats() {
    const completedTasks = appState.tasks.filter(t => t.completed);
    const totalTasks = appState.tasks.length;
    const productivity = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    const byCategory = {};
    appState.tasks.forEach(task => {
        if (!byCategory[task.category]) {
            byCategory[task.category] = 0;
        }
        if (task.completed) {
            byCategory[task.category]++;
        }
    });

    const weeklyActivity = [12, 15, 8, 20, 18, 14, appState.user.totalCompleted % 25];

    return {
        totalCompleted: appState.user.totalCompleted,
        currentStreak: appState.user.streak,
        bestStreak: appState.user.bestStreak,
        productivity: productivity,
        byCategory: byCategory,
        weeklyActivity: weeklyActivity,
        totalPomodoros: getTotalPomodoros()
    };
}

function getTotalPomodoros() {
    return appState.user.pomodorosToday + (appState.user.totalCompleted * 2);
}

function updateStats() {
    const stats = getStats();

    document.getElementById('totalCompleted').textContent = stats.totalCompleted;
    document.getElementById('currentStreak').textContent = stats.currentStreak;
    document.getElementById('productivityScore').textContent = stats.productivity + '%';
    document.getElementById('bestStreak').textContent = stats.bestStreak;

    renderCharts(stats);
}

function renderCharts(stats) {
    const categoryChart = document.getElementById('categoryChart');
    const categories = Object.entries(stats.byCategory);

    if (categories.length > 0) {
        const maxCount = Math.max(...categories.map(([, count]) => count), 1);
        categoryChart.innerHTML = categories.map(([category, count]) => `
            <div style="margin: 10px 0;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="width: 100px;">${getCategoryIcon(category)} ${category}</span>
                    <div style="flex: 1; background: var(--bg-tertiary); border-radius: 5px; height: 30px;">
                        <div style="width: ${(count/maxCount)*100}%; background: var(--cat-${category}); height: 100%; border-radius: 5px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: bold;">
                            ${count}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        categoryChart.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No hay datos todavía</p>';
    }

    const weeklyChart = document.getElementById('weeklyChart');
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const maxActivity = Math.max(...stats.weeklyActivity, 1);

    weeklyChart.innerHTML = `
        <div style="display: flex; gap: 10px; justify-content: space-around; align-items: flex-end; height: 200px;">
            ${stats.weeklyActivity.map((count, i) => `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                    <div style="width: 100%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); border-radius: 5px; height: ${(count/maxActivity)*150}px; min-height: 5px;"></div>
                    <span style="font-size: 12px; color: var(--text-secondary);">${days[i]}</span>
                    <span style="font-size: 14px; font-weight: bold;">${count}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// TEMAS
// ============================================

function toggleTheme() {
    appState.currentTheme = appState.currentTheme === 'light' ? 'dark' : 'light';

    if (appState.currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('themeToggle').textContent = '🌙';
    }

    saveData();
}

// ============================================
// NOTIFICACIONES
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log('Notification:', message);
        return;
    }
    notification.textContent = message;
    notification.className = `notification show ${type}`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============================================
// NAVEGACIÓN POR TABS
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabName + '-panel').classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'stats') {
        updateStats();
    }
}

// ============================================
// PERSISTENCIA DE DATOS CON API
// ============================================

async function saveData() {
    if (!currentUser) return;

    try {
        await fetch(`${API_URL}/user/${currentUser.id}/data`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                level: appState.user.level,
                xp: appState.user.xp,
                totalCompleted: appState.user.totalCompleted,
                streak: appState.user.streak,
                bestStreak: appState.user.bestStreak,
                lastCompletedDate: appState.user.lastCompletedDate,
                pomodorosToday: appState.user.pomodorosToday,
                achievements: appState.user.achievements,
                currentTheme: appState.currentTheme
            })
        });
    } catch (error) {
        console.error('Error guardando datos:', error);
    }
}

async function loadData() {
    if (!currentUser) return;

    try {
        // Cargar datos del usuario
        const userData = await fetch(`${API_URL}/user/${currentUser.id}/data`);
        const data = await userData.json();

        appState.user = {
            level: data.level,
            xp: data.xp,
            totalCompleted: data.totalCompleted,
            streak: data.streak,
            bestStreak: data.bestStreak,
            lastCompletedDate: data.lastCompletedDate,
            pomodorosToday: data.pomodorosToday,
            achievements: data.achievements
        };

        appState.currentTheme = data.currentTheme;

        // Aplicar tema
        if (appState.currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').textContent = '☀️';
        }

        // Cargar tareas
        await loadTasks();

        // Reset pomodoros diarios si es un nuevo día
        const today = new Date().toDateString();
        if (appState.user.lastCompletedDate !== today && appState.user.lastCompletedDate) {
            appState.user.pomodorosToday = 0;
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

async function loadTasks() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/user/${currentUser.id}/tasks`);
        const tasks = await response.json();
        appState.tasks = tasks;
    } catch (error) {
        console.error('Error cargando tareas:', error);
    }
}

async function updateDailyStats(tasksCompleted, pomodorosCompleted, xpEarned) {
    if (!currentUser) return;

    try {
        await fetch(`${API_URL}/user/${currentUser.id}/stats/daily`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tasksCompleted,
                pomodorosCompleted,
                xpEarned
            })
        });
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

function init() {
    setupEventListeners();
    const isAuthenticated = checkAuth();

    if (isAuthenticated) {
        initializeApp();
    }
}

function setupEventListeners() {
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appState.filter = btn.dataset.filter;
            renderTasks();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    document.getElementById('startTimer').addEventListener('click', startPomodoro);
    document.getElementById('pauseTimer').addEventListener('click', pausePomodoro);
    document.getElementById('resetTimer').addEventListener('click', resetPomodoro);
}

document.addEventListener('DOMContentLoaded', init);
