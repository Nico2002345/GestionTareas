// ============================================
// SISTEMA DE AUTENTICACIÓN
// ============================================

let currentUser = null;

// Funciones de autenticación
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // Validaciones
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

    // Obtener usuarios existentes
    const users = JSON.parse(localStorage.getItem('taskMasterUsers') || '{}');

    // Verificar si el email ya existe
    if (users[email]) {
        showNotification('Este correo ya está registrado', 'error');
        return;
    }

    // Crear nuevo usuario
    users[email] = {
        name: name,
        email: email,
        password: btoa(password), // Codificar contraseña (no es seguro para producción, solo para demo)
        createdAt: new Date().toISOString()
    };

    // Guardar usuarios
    localStorage.setItem('taskMasterUsers', JSON.stringify(users));

    showNotification('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión', 'success');

    // Limpiar formulario y mostrar login
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';

    showLogin();
}

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validaciones
    if (!email || !password) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un correo válido', 'error');
        return;
    }

    // Obtener usuarios
    const users = JSON.parse(localStorage.getItem('taskMasterUsers') || '{}');

    // Verificar credenciales
    if (!users[email]) {
        showNotification('Usuario no encontrado', 'error');
        return;
    }

    if (users[email].password !== btoa(password)) {
        showNotification('Contraseña incorrecta', 'error');
        return;
    }

    // Login exitoso
    currentUser = email;
    localStorage.setItem('taskMasterCurrentUser', email);

    // Limpiar formulario
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';

    // Mostrar aplicación
    showApp();
}

function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        // Guardar datos antes de salir
        saveData();

        // Limpiar sesión
        localStorage.removeItem('taskMasterCurrentUser');
        currentUser = null;

        // Ocultar app y mostrar login
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authContainer').style.display = 'flex';

        showNotification('Sesión cerrada correctamente', 'success');
    }
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Cargar datos del usuario
    loadData();

    // Mostrar email en el header
    const users = JSON.parse(localStorage.getItem('taskMasterUsers') || '{}');
    document.getElementById('userEmail').textContent = users[currentUser]?.name || currentUser;

    // Inicializar la interfaz de usuario
    initializeApp();

    showNotification(`¡Bienvenido de nuevo, ${users[currentUser]?.name || 'Usuario'}!`, 'success');
}

function initializeApp() {
    // Renderizar todo
    renderTasks();
    renderAchievements();
    updateUI();
    updateStats();
    updatePomodoroDisplay();
    updatePomodoroTaskList();

    // Mensaje de bienvenida para nuevos usuarios
    if (appState.user.totalCompleted === 0 && appState.tasks.length === 0) {
        setTimeout(() => {
            showNotification('👋 ¡Completa tareas y sube de nivel!', 'success');
        }, 1000);
    }
}

function checkAuth() {
    const savedUser = localStorage.getItem('taskMasterCurrentUser');

    if (savedUser) {
        const users = JSON.parse(localStorage.getItem('taskMasterUsers') || '{}');

        if (users[savedUser]) {
            currentUser = savedUser;
            showApp();
            return true;
        }
    }

    // No hay sesión activa
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

    // Bonus por prioridad
    if (task.priority === 'alta') baseXP += 30;
    else if (task.priority === 'media') baseXP += 15;
    else baseXP += 5;

    // Bonus por categoría (estudio y trabajo dan más XP)
    if (task.category === 'estudio' || task.category === 'trabajo') {
        baseXP += 10;
    }

    return baseXP;
}

// ============================================
// GESTIÓN DE TAREAS
// ============================================

function addTask() {
    const input = document.getElementById('taskInput');
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;

    if (input.value.trim() === '') {
        showNotification('Por favor escribe una tarea', 'error');
        return;
    }

    const task = {
        id: Date.now(),
        text: input.value.trim(),
        category: category,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString(),
        xp: 0
    };

    task.xp = calculateTaskXP(task);

    appState.tasks.unshift(task);
    input.value = '';

    saveData();
    renderTasks();
    updatePomodoroTaskList();
    showNotification('✅ Tarea agregada correctamente', 'success');
}

function toggleTask(id) {
    const task = appState.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;

    if (task.completed) {
        // Dar XP y actualizar estadísticas
        addXP(task.xp);
        appState.user.totalCompleted++;
        updateStreak();
        checkAchievements();

        showNotification(`🎉 ¡Ganaste ${task.xp} XP!`, 'success');
    } else {
        // Quitar XP si se desmarca
        appState.user.xp = Math.max(0, appState.user.xp - task.xp);
        appState.user.totalCompleted--;
        updateLevel();
    }

    saveData();
    renderTasks();
    updateUI();
    updateStats();
}

function deleteTask(id) {
    appState.tasks = appState.tasks.filter(t => t.id !== id);
    saveData();
    renderTasks();
    updatePomodoroTaskList();
    showNotification('🗑️ Tarea eliminada', 'success');
}

function filterTasks(filter) {
    appState.filter = filter;
    renderTasks();

    // Actualizar botones de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function renderTasks() {
    const container = document.getElementById('tasksList');
    let filteredTasks = appState.tasks;

    // Aplicar filtros
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
        // Primera tarea completada
        appState.user.streak = 1;
        appState.user.lastCompletedDate = today;
    } else {
        const lastCompleted = new Date(lastDate);
        const now = new Date();
        const diffTime = Math.abs(now - lastCompleted);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Mismo día, no hacer nada
        } else if (diffDays === 1) {
            // Día consecutivo
            appState.user.streak++;
            appState.user.lastCompletedDate = today;
        } else {
            // Se rompió la racha
            appState.user.streak = 1;
            appState.user.lastCompletedDate = today;
        }
    }

    // Actualizar mejor racha
    if (appState.user.streak > appState.user.bestStreak) {
        appState.user.bestStreak = appState.user.streak;
    }
}

function updateUI() {
    // Actualizar nivel y XP
    document.getElementById('userLevel').textContent = appState.user.level;
    document.getElementById('userXP').textContent = appState.user.xp;
    document.getElementById('userStreak').textContent = appState.user.streak + '🔥';

    // Actualizar barra de progreso
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

function pomodoroComplete() {
    clearInterval(pomodoroInterval);

    if (appState.pomodoro.mode === 'work') {
        // Completó un pomodoro de trabajo
        appState.user.pomodorosToday++;
        addXP(25); // Bonus por completar pomodoro
        showNotification('🍅 ¡Pomodoro completado! Toma un descanso', 'success');

        // Cambiar a modo descanso
        const breakDuration = parseInt(document.getElementById('breakDuration').value) || 5;
        appState.pomodoro.timeLeft = breakDuration * 60;
        appState.pomodoro.mode = 'break';

        checkAchievements();
    } else {
        // Completó un descanso
        showNotification('✅ Descanso completado. ¡A trabajar!', 'success');

        // Volver a modo trabajo
        const workDuration = parseInt(document.getElementById('workDuration').value) || 25;
        appState.pomodoro.timeLeft = workDuration * 60;
        appState.pomodoro.mode = 'work';
    }

    appState.pomodoro.isRunning = false;
    updatePomodoroDisplay();
    saveData();
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

    // Agrupar por categoría
    const byCategory = {};
    appState.tasks.forEach(task => {
        if (!byCategory[task.category]) {
            byCategory[task.category] = 0;
        }
        if (task.completed) {
            byCategory[task.category]++;
        }
    });

    // Simular actividad semanal (en una app real esto vendría de datos históricos)
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
    // En una app real esto se guardaría en localStorage
    return appState.user.pomodorosToday + (appState.user.totalCompleted * 2); // Estimación
}

function updateStats() {
    const stats = getStats();

    document.getElementById('totalCompleted').textContent = stats.totalCompleted;
    document.getElementById('currentStreak').textContent = stats.currentStreak;
    document.getElementById('productivityScore').textContent = stats.productivity + '%';
    document.getElementById('bestStreak').textContent = stats.bestStreak;

    // Actualizar gráficos
    renderCharts(stats);
}

function renderCharts(stats) {
    // Gráfico de categorías (simple con div bars)
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

    // Gráfico semanal
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
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Desactivar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Activar el tab seleccionado
    document.getElementById(tabName + '-panel').classList.add('active');
    event.target.classList.add('active');

    // Actualizar estadísticas si se abre el panel de stats
    if (tabName === 'stats') {
        updateStats();
    }
}

// ============================================
// PERSISTENCIA DE DATOS
// ============================================

function saveData() {
    if (!currentUser) return;

    // Guardar datos del usuario actual
    const userDataKey = `taskMasterData_${currentUser}`;
    localStorage.setItem(userDataKey, JSON.stringify(appState));
}

function loadData() {
    if (!currentUser) return;

    const userDataKey = `taskMasterData_${currentUser}`;
    const saved = localStorage.getItem(userDataKey);

    if (saved) {
        const loaded = JSON.parse(saved);

        // Merge con valores por defecto
        appState = {
            ...appState,
            ...loaded,
            pomodoro: {
                ...appState.pomodoro,
                isRunning: false,
                isPaused: false
            }
        };

        // Aplicar tema guardado
        if (appState.currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').textContent = '☀️';
        }

        // Reset pomodoros diarios si es un nuevo día
        const today = new Date().toDateString();
        if (appState.user.lastCompletedDate !== today && appState.user.lastCompletedDate) {
            appState.user.pomodorosToday = 0;
        }
    } else {
        // Si no hay datos guardados, resetear al estado inicial
        appState = {
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
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

function init() {
    // Agregar event listeners (solo una vez al cargar la página)
    setupEventListeners();

    // Verificar autenticación
    const isAuthenticated = checkAuth();

    if (isAuthenticated) {
        // Inicializar la app si está autenticado
        initializeApp();
    }
}

function setupEventListeners() {
    // Event listeners para tareas
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appState.filter = btn.dataset.filter;
            renderTasks();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Pomodoro
    document.getElementById('startTimer').addEventListener('click', startPomodoro);
    document.getElementById('pauseTimer').addEventListener('click', pausePomodoro);
    document.getElementById('resetTimer').addEventListener('click', resetPomodoro);
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
