# 🏗️ Arquitectura de Red-Obscura

## 📊 Diagrama General

```
┌─────────────────────────────────────────────────┐
│          RED-OBSCURA (Next.js + Firebase)       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Frontend (React Components)               │ │
│  ├────────────────────────────────────────────┤ │
│  │ - Login.jsx      (Autenticación)          │ │
│  │ - Dashboard.jsx  (Panel principal)        │ │
│  │ - NavBar.jsx     (Navegación)             │ │
│  │ - Chat.jsx       (Comunicación)           │ │
│  │ - Clan.jsx       (Gestión de clanes)     │ │
│  │ - Misiones.jsx   (Sistema de objetivos)   │ │
│  │ - Mapa.jsx       (Nodos conquistables)    │ │
│  │ - HackingGame.jsx (Minijuego)            │ │
│  │ - LeaderBoard.jsx (Ranking)               │ │
│  └────────────────────────────────────────────┘ │
│                        │                         │
│                        ▼                         │
│  ┌────────────────────────────────────────────┐ │
│  │  GameContext (Estado Global)              │ │
│  │  - user (autenticado)                     │ │
│  │  - player (datos del jugador)             │ │
│  │  - updatePlayer (mutaciones)              │ │
│  └────────────────────────────────────────────┘ │
│                        │                         │
│                        ▼                         │
│  ┌────────────────────────────────────────────┐ │
│  │  Firebase SDK                             │ │
│  │  - Authentication (Email/Password)        │ │
│  │  - Firestore (Realtime Database)          │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│               Cloud             ☁️              │
└─────────────────────────────────────────────────┘
```

## 📁 Estructura de Carpetas

```
Red-Obscura/
│
├── src/
│   ├── app/                      # Next.js App Directory
│   │   ├── layout.jsx            # Layout raíz con metadata
│   │   └── page.jsx              # Página principal
│   │
│   ├── components/               # Componentes React
│   │   ├── Login.jsx             # Pantalla de login/registro
│   │   ├── Logout.jsx            # Botón cerrar sesión
│   │   ├── Dashboard.jsx         # Panel de control
│   │   ├── NavBar.jsx            # Barra de navegación
│   │   ├── PlayerStats.jsx       # Estadísticas del jugador
│   │   ├── Chat.jsx              # Sistema de chat
│   │   ├── Clan.jsx              # Gestión de clanes
│   │   ├── Misiones.jsx          # Sistema de misiones
│   │   ├── Mapa.jsx              # Mapa interactivo
│   │   ├── HackingGame.jsx       # Minijuego de hacking
│   │   ├── ScriptUpgrade.jsx     # Mejora de habilidades
│   │   └── LeaderBoard.jsx       # Ranking de jugadores
│   │
│   ├── context/                  # Estado global
│   │   └── GameContext.jsx       # GameProvider + hooks
│   │
│   ├── styles/                   # Estilos
│   │   └── globals.css           # CSS global
│   │
│   └── firebase.js               # Configuración Firebase
│
├── public/                       # Archivos estáticos
│
├── .env.example                  # Template de env
├── .gitignore                    # Git ignore
├── next.config.js                # Configuración Next.js
├── package.json                  # Dependencias
├── README.md                     # Documentación principal
├── QUICKSTART.md                 # Guía de inicio rápido
├── TROUBLESHOOTING.md            # Solución de problemas
└── ARCHITECTURE.md               # Este archivo
```

## 🔄 Flujo de Datos

### 1. Autenticación
```
Login Component
    ↓
firebase.auth.signInWithEmailAndPassword()
    ↓
Firebase Auth
    ↓
GameContext actualiza user state
    ↓
Redirecciona a Dashboard
```

### 2. Carga de Datos del Jugador
```
GameProvider monta (useEffect)
    ↓
onAuthStateChanged() detecta usuario
    ↓
onSnapshot(doc(db, 'jugadores', uid)) escucha cambios
    ↓
SetState(player)
    ↓
Componentes acceden vía useContext(GameContext)
```

### 3. Actualización de Datos
```
Componente dispara updatePlayer()
    ↓
updateDoc(doc(db, 'jugadores', uid), updates)
    ↓
Firestore actualiza documento
    ↓
onSnapshot() dispara callback
    ↓
GameContext actualiza state
    ↓
Componentes se re-renderizan
```

## 🗄️ Estructura Firestore

### Colecciones

#### `jugadores/{uid}`
```javascript
{
  uid: string,
  username: string,
  level: number,
  xp: number,
  credits: number,
  clan: string | null,
  scripts: {
    mineria: { level: number, active: boolean },
    defensa: { level: number, active: boolean },
    ataque: { level: number, active: boolean }
  },
  createdAt: timestamp
}
```

#### `clanes/{clanId}`
```javascript
{
  name: string,
  leader: string (uid),
  members: string[] (uids),
  bank: number,
  defense: number,
  publico: boolean,
  createdAt: timestamp
}
```

#### `mensajes/{messageId}`
```javascript
{
  channel: 'global' | 'clan_${clanId}',
  user: string (username),
  uid: string,
  text: string,
  timestamp: timestamp
}
```

#### `misiones/{misionId}`
```javascript
{
  nombre: string,
  descripcion: string,
  objetivo: number,
  recompensa: {
    xp: number,
    credits: number
  }
}
```

#### `nodos/{nodoId}`
```javascript
{
  nombre: string,
  seguridad: number,
  valor: number,
  propietario: string | null (clanId)
}
```

#### `progreso_misiones/{uid}`
```javascript
{
  '${misionId}': {
    progreso: number,
    completada: boolean
  }
}
```

## 🔐 Reglas Firestore (Recomendadas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Jugadores: lectura pública, escritura del propietario
    match /jugadores/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
    }
    
    // Clanes: lectura pública, escritura con restricciones
    match /clanes/{clanId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.leader;
    }
    
    // Mensajes: lectura pública, creación autenticada
    match /mensajes/{messageId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      allow delete: if request.auth.uid == resource.data.uid;
    }
    
    // Misiones: solo lectura pública
    match /misiones/{misionId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Nodos: lectura pública
    match /nodos/{nodoId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Progreso: acceso solo del usuario
    match /progreso_misiones/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 🎯 Flujo de Juego Principal

### 1. Login
- Usuario entra a http://localhost:3000
- Login.jsx muestra formulario
- Auth con Firebase
- GameContext detecta autenticación
- Redirecciona a Dashboard

### 2. Dashboard
- Muestra PlayerStats
- Tabs: Chat, Misiones, Clanes, Mapa, Scripts, Ranking
- NavBar para navegar entre secciones

### 3. Minería Automática
- Script activo en background
- Cada 10 segundos: gana XP/créditos
- Registra en chat global
- Solo funciona si está activo

### 4. Misiones
- Cargar misiones desde Firestore
- Mostrar progreso
- Botón "Avanzar"
- Recompensas al completar

### 5. Clanes
- Crear o unirse a clan
- Depositamos en banco
- Mejorar defensa
- Chat de clan

### 6. Mapa & Conquista
- Mostrar nodos
- Click en nodo → HackingGame
- Si ganas → clan captura nodo
- Recompensas

### 7. Scripts & Upgrades
- Mejorar Minería, Defensa, Ataque
- Costo en créditos
- Aumenta efectividad

## 🚀 Deployment en Vercel

### 1. Preparar repositorio
```bash
git add .
git commit -m "feat: Complete Red-Obscura game"
git push origin main
```

### 2. Conectar a Vercel
- Ve a [vercel.com](https://vercel.com)
- Click "New Project"
- Selecciona tu repositorio GitHub
- Configura variables de entorno

### 3. Configurar Variables de Entorno
En Vercel Dashboard:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Deploy
- Click "Deploy"
- Esperar a que compile
- ¡Live! 🚀

## 🔧 Extensiones Futuras

### Fase 2: Sistema PvP
- Atacar jugadores directamente
- Robar créditos
- Sistema de reputación

### Fase 3: Marketplace
- Comprar/vender items
- Tienda oficial
- Subastas entre jugadores

### Fase 4: Guilds Avanzadas
- Territorios controlados
- Guerra entre guilds
- Alianzas

### Fase 5: Mobile
- App React Native
- Sincronización en tiempo real
- Push notifications

## 📊 Monitoreo

### Firebase Console
- **Firestore**: Ver datos en tiempo real
- **Authentication**: Gestionar usuarios
- **Analytics**: Estadísticas de uso

### Logs del Navegador
```javascript
// Ver estado del contexto
console.log(window.GameContext);

// Ver listeners activos
console.log(document.querySelectorAll('[data-listener]'));
```

### Performance
- Chrome DevTools > Performance
- Lighthouse > Audits
- Firebase Realtime Database > Rules

---

**Última actualización:** 2026-07-08
