# 🔴 RED OBSCURA - RPG Hacker Multiplayer

> Un juego RPG multijugador en línea donde eres un hacker en la "Red Oscura". Compite, forma clanes, completa misiones y conquista nodos de la red.

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.6-blue?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.14.0-orange?style=flat-square&logo=firebase)
![License](https://img.shields.io/badge/License-CC0%201.0-green?style=flat-square)

**[🎮 Jugar en Vivo](https://v0-hackerrpg-project-generation.vercel.app)**

---

## ✨ Características

### 🎮 Jugabilidad Core
- **Autenticación**: Login/Registro con Firebase Auth + verificación de email
- **Perfiles de Jugador**: Username, nivel, XP, créditos, scripts
- **Sistema de Experiencia**: Gana XP y sube de nivel con actividades
- **Minería Automática**: Acumula créditos ejecutando scripts de minería

### 👥 Sistema Social
- **Chat Global & de Clan**: Comunicación en tiempo real
- **Comandos**: `/roll` para tiradas de dados en chat

### 🏴 Sistema de Clanes
- **Crear/Unirse a Clanes**: Forma equipos con otros jugadores
- **Banco de Clan**: Depósito y retiro de créditos compartidos
- **Mejoras de Defensa**: Invierte en defensa del clan
- **Territorialidad**: Los clanes controlan nodos en el mapa

### 📋 Misiones
- **Objetivos Dinámicos**: Misiones con múltiples pasos
- **Recompensas**: XP y créditos por completar misiones
- **Seguimiento de Progreso**: Sistema de progreso persistente

### 🗺️ Mapa de la Red
- **Nodos Conquistables**: Diferentes zonas con niveles de seguridad
- **Minijuego de Hacking**: Completa desafíos para conquistar nodos
- **Control de Territorio**: Clanes compiten por control de zonas

### ⚙️ Scripts & Habilidades
- **Minería** (Level 1+): Genera créditos automáticamente
- **Defensa** (Level 0+): Protege contra ataques
- **Ataque** (Level 0+): Asalta otros jugadores
- **Sistema de Upgrade**: Mejora tus scripts con XP

---

## 🚀 Instalación Rápida

### Requisitos
- Node.js 18+
- npm o yarn
- Cuenta Firebase (free tier es suficiente)

### Pasos

#### 1. Clonar repositorio
```bash
git clone https://github.com/ShacktarMalacky/Red-Obscura.git
cd Red-Obscura
```

#### 2. Instalar dependencias
```bash
npm install
```

#### 3. Configurar Firebase

**a) Crear proyecto en [Firebase Console](https://console.firebase.google.com)**
- Crear nuevo proyecto
- Habilitar Authentication (Email/Password)
- Crear Firestore Database (modo producción)
- Copiar credenciales

**b) Crear archivo `.env.local`**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

#### 4. Configurar Firestore Collections

En Firebase Console, crear estas colecciones vacías (se poblaran automáticamente):
```
- jugadores/
- clanes/
- nodos/
- misiones/
- mensajes/
- progreso_misiones/
```

O ejecutar el script de inicialización:
```bash
npm run init:firebase
```

#### 5. Ejecutar en desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 📦 Estructura del Proyecto

```
Red-Obscura/
├── src/
│   ├── app/
│   │   └── page.jsx          # Página principal
│   │   └── layout.jsx        # Layout global
│   ├── components/
│   │   ├── Login.jsx         # Auth
│   │   ├── Dashboard.jsx     # Panel principal
│   │   ├── Chat.jsx          # Chat global/clan
│   │   ├── Clan.jsx          # Sistema de clanes
│   │   ├── Misiones.jsx      # Sistema de misiones
│   │   ├── Mapa.jsx          # Mapa de nodos
│   │   └── HackingGame.jsx   # Minijuego
│   ├── context/
│   │   └── GameContext.jsx   # Estado global del juego
│   ├── firebase.js           # Configuración Firebase
│   └── styles/
│       └── globals.css       # Estilos globales
├── public/
├── next.config.js
├── package.json
└── .env.local               # Variables de entorno (no versionar)
```

---

## 🎮 Guía de Juego

### Inicio
1. **Registrarse**: Email + contraseña
2. **Verificar email**: Se generará username automático
3. **Dashboard**: Tu panel de control

### Leveling Up
- **Minería Automática**: Activa el script de minería para ganar XP/créditos pasivamente
- **Misiones**: Completa objetivos para recompensas
- **PvP**: Ataca a otros jugadores (cuando esté implementado)

### Clanes
1. **Crear Clan**: Nombre único, eres el líder
2. **Unirse a Clan**: Busca clanes públicos
3. **Banco Compartido**: Deposita créditos para mejoras colectivas
4. **Defensa**: Invierte en protección del clan

### Conquista
- **Mapa**: Visualiza nodos disponibles
- **Hacking**: Completa el minijuego para conquistar
- **Territorios**: Tu clan controla la zona

---

## 🛠️ Desarrollo

### Scripts disponibles
```bash
npm run dev      # Iniciar servidor desarrollo
npm run build    # Build producción
npm start        # Iniciar servidor producción
```

### Agregar nuevas colecciones a Firestore
```javascript
// src/firebase.js
const db = getFirestore(app);
// Usar en componentes con onSnapshot(), setDoc(), etc.
```

### Crear nuevos componentes
```bash
touch src/components/MiComponente.jsx
```

Plantilla:
```jsx
'use client';
import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

export default function MiComponente() {
  const { player, updatePlayer } = useContext(GameContext);
  
  return (
    <div>
      {/* Contenido */}
    </div>
  );
}
```

---

## 🔐 Seguridad

### Reglas Firestore (importante)
En Firebase Console > Firestore > Reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Jugadores: solo lectura pública, escritura del propietario
    match /jugadores/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    
    // Clanes: lectura pública, escritura restringida
    match /clanes/{clanId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Mensajes: lectura pública, escritura autenticada
    match /mensajes/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
    
    // Más reglas según necesites...
  }
}
```

### Variables de entorno
- ✅ Guardar `.env.local` en `.gitignore`
- ✅ Nunca committear claves privadas
- ✅ Usar variables `NEXT_PUBLIC_*` solo para datos públicos

---

## 📊 Roadmap

- [x] Sistema de autenticación
- [x] Perfiles de jugador
- [x] Minería automática
- [x] Chat global/clan
- [x] Sistema de clanes
- [x] Misiones
- [ ] Sistema PvP completo
- [ ] Tienda de items
- [ ] Guilds mejoradas
- [ ] Leaderboards
- [ ] Achievements
- [ ] Mobile responsive

---

## 🤝 Contribuir

1. Fork el repo
2. Crea rama: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Abre Pull Request

---

## 📝 Licencia

Proyecto bajo licencia [CC0 1.0 Universal](LICENSE) - Dominio público

---

## 👨‍💻 Autor

**ShacktarMalacky**
- GitHub: [@ShacktarMalacky](https://github.com/ShacktarMalacky)

---

## 💬 Soporte

- 📧 Issues: [GitHub Issues](https://github.com/ShacktarMalacky/Red-Obscura/issues)
- 🎮 Jugar: [Live Demo](https://v0-hackerrpg-project-generation.vercel.app)

---

**Hecho con ❤️ y café. ¡Bienvenido a la Red Oscura! 🔴**
