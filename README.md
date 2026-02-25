# 🎮 TaskMaster Pro

Aplicación web de gestión de tareas con **gamificación**, **temporizador Pomodoro** y **estadísticas visuales**. Construida con **Node.js**, **Express** y **SQLite3**.

![TaskMaster Pro](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Características

### 🎯 Gestión de Tareas
- Crear, completar y eliminar tareas
- Categorías personalizables (Trabajo, Personal, Estudio, Salud, Compras)
- Niveles de prioridad (Alta, Media, Baja)
- Filtros avanzados

### 🎮 Sistema de Gamificación
- **Niveles y XP**: Gana experiencia completando tareas
- **Sistema de rachas**: Mantén días consecutivos activo
- **11 Logros desbloqueables**: Con recompensas en XP
- XP variable según prioridad y categoría

### ⏱️ Temporizador Pomodoro
- Temporizador integrado para técnica Pomodoro
- Duración personalizable (trabajo y descanso)
- Contador de Pomodoros diarios
- Bonus de XP por completar sesiones

### 📊 Estadísticas y Análisis
- Gráficos de tareas por categoría
- Actividad semanal
- Métricas de productividad
- Historial de rachas

### 🔐 Sistema de Autenticación
- Registro de usuarios
- Login seguro con contraseñas hasheadas (bcrypt)
- Sesión persistente
- Datos separados por usuario

### 🎨 Personalización
- Modo claro y modo oscuro
- Diseño responsive (funciona en móvil)
- Notificaciones visuales

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **SQLite3** - Base de datos
- **bcrypt** - Hash de contraseñas
- **CORS** - Manejo de peticiones cross-origin

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos (con variables CSS y animaciones)
- **JavaScript** (Vanilla) - Lógica del cliente

## 📋 Requisitos Previos

- **Node.js** (versión 14 o superior)
- **npm** (incluido con Node.js)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Nico2002345/GestionTareas.git
cd GestionTareas
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará:
- express
- sqlite3
- bcrypt
- cors
- body-parser
- dotenv

### 3. Iniciar el servidor

```bash
npm start
```

O para desarrollo con auto-reload:

```bash
npm run dev
```

El servidor se iniciará en: **http://localhost:3000**

### 4. Abrir la aplicación

Abre tu navegador y ve a:

```
http://localhost:3000/task-manager.html
```

## 📖 Uso

### Primera vez

1. **Crear cuenta**:
   - Haz clic en "Regístrate aquí"
   - Completa el formulario con tu nombre, email y contraseña
   - Haz clic en "Crear Cuenta"

2. **Iniciar sesión**:
   - Ingresa tu email y contraseña
   - Haz clic en "Entrar"

### Gestión de tareas

1. **Agregar tarea**:
   - Escribe el nombre de la tarea
   - Selecciona categoría y prioridad
   - Presiona Enter o haz clic en "Agregar"

2. **Completar tarea**:
   - Marca el checkbox de la tarea
   - Recibirás XP automáticamente

3. **Eliminar tarea**:
   - Haz clic en el botón de basura (🗑️)

### Temporizador Pomodoro

1. Ve a la pestaña "Pomodoro"
2. Ajusta la duración si lo deseas (por defecto 25 min trabajo, 5 min descanso)
3. Opcionalmente selecciona una tarea
4. Haz clic en "Iniciar"
5. Gana 25 XP al completar cada Pomodoro

### Estadísticas

- Ve a la pestaña "Estadísticas" para ver:
  - Tareas completadas totales
  - Racha actual y mejor racha
  - Productividad semanal
  - Gráficos por categoría

### Logros

- Ve a la pestaña "Logros" para ver:
  - Logros desbloqueados
  - Logros pendientes
  - Recompensas obtenidas

## 🗄️ Estructura de la Base de Datos

La aplicación usa SQLite3 con 4 tablas principales:

### `users`
- id (PRIMARY KEY)
- name
- email (UNIQUE)
- password (hasheada)
- created_at

### `user_data`
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- level, xp, total_completed
- streak, best_streak
- last_completed_date
- pomodoros_today
- achievements (JSON)
- current_theme

### `tasks`
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- text, category, priority
- completed, xp
- created_at, completed_at

### `stats_history`
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- date
- tasks_completed
- pomodoros_completed
- xp_earned

## 🔌 API Endpoints

### Autenticación

```
POST /api/auth/register
POST /api/auth/login
```

### Datos de usuario

```
GET    /api/user/:userId/data
PUT    /api/user/:userId/data
```

### Tareas

```
GET    /api/user/:userId/tasks
POST   /api/user/:userId/tasks
PUT    /api/user/:userId/tasks/:taskId
DELETE /api/user/:userId/tasks/:taskId
```

### Estadísticas

```
GET  /api/user/:userId/stats
POST /api/user/:userId/stats/daily
```

## 📁 Estructura del Proyecto

```
GestionTareas/
├── server.js              # Servidor Express y endpoints API
├── database.js            # Configuración SQLite3
├── task-manager.html      # Interfaz de usuario
├── styles.css             # Estilos y temas
├── script-api.js          # Lógica frontend con API
├── package.json           # Dependencias
├── .gitignore            # Archivos ignorados por git
├── README.md             # Este archivo
└── taskmaster.db         # Base de datos (se crea automáticamente)
```

## 🎯 Sistema de XP

| Tipo de Tarea | XP Base | Bonus Prioridad | Bonus Categoría |
|---------------|---------|-----------------|-----------------|
| Baja          | 20      | +5              | +10 (Trabajo/Estudio) |
| Media         | 20      | +15             | +10 (Trabajo/Estudio) |
| Alta          | 20      | +30             | +10 (Trabajo/Estudio) |
| Pomodoro      | -       | -               | +25 |

**Niveles**: Cada nivel requiere `nivel × 100 XP`

## 🏆 Logros

1. **Primera Tarea** (50 XP) - Completa tu primera tarea
2. **Maestro de Tareas** (100 XP) - Completa 10 tareas
3. **Leyenda de Tareas** (500 XP) - Completa 50 tareas
4. **Guerrero Semanal** (200 XP) - Racha de 7 días
5. **Maestro Mensual** (1000 XP) - Racha de 30 días
6. **Inicio Pomodoro** (50 XP) - Completa tu primer Pomodoro
7. **Maestro del Enfoque** (300 XP) - Completa 10 Pomodoros
8. **Prioridad Alta** (150 XP) - Completa 5 tareas de alta prioridad
9. **Organizado** (100 XP) - Crea tareas en todas las categorías
10. **Nivel 5** - Alcanza el nivel 5
11. **Nivel 10** - Alcanza el nivel 10

## 🔒 Seguridad

- Las contraseñas se hashean con **bcrypt** (10 rounds)
- No se almacenan contraseñas en texto plano
- CORS configurado para peticiones del mismo origen
- Validación de datos en frontend y backend

## 🚧 Futuras Mejoras

- [ ] Autenticación con JWT
- [ ] Exportar tareas a PDF/CSV
- [ ] Compartir tareas entre usuarios
- [ ] Recordatorios y notificaciones push
- [ ] Integración con calendarios
- [ ] App móvil nativa
- [ ] Migración a PostgreSQL para producción

## 📝 Licencia

MIT License - Siéntete libre de usar este proyecto para aprender o en tus propios proyectos

## 👤 Autor

Creado con ❤️ usando Claude Code

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras un bug o tienes una sugerencia:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Soporte

Si tienes problemas, por favor abre un issue en GitHub.

---

**¡Disfruta mejorando tu productividad! 🎯🚀**
