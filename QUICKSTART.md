# 🚀 QUICKSTART - Inicio Rápido

## 📋 Descripción

RPG multijugador en línea. Juega como hacker, gana experiencia, forma clanes y conquista la red.

**URL en vivo:** https://v0-hackerrpg-project-generation.vercel.app

---

## ⚡ Inicio en 5 minutos

### 1️⃣ Clonar
```bash
git clone https://github.com/ShacktarMalacky/Red-Obscura.git
cd Red-Obscura
```

### 2️⃣ Instalar dependencias
```bash
npm install
```

### 3️⃣ Configurar Firebase

**a) Crear proyecto en Firebase Console**
- Ve a https://console.firebase.google.com
- Crea nuevo proyecto
- Habilita: Authentication (Email/Password), Firestore Database

**b) Copiar credenciales**
- Ve a ⚙️ Configuración del proyecto
- Selecciona tu app web
- Copia el objeto `firebaseConfig`

**c) Crear `.env.local`**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### 4️⃣ Ejecutar
```bash
npm run dev
```

### 5️⃣ Abrir en navegador
```
http://localhost:3000
```

---

## 🎮 Primeros pasos en el juego

1. **Registrarse** → Email + contraseña
2. **Verificar email** → Se generará username automático
3. **Dashboard** → Tu panel de control
4. **Mina datos** → Activa el script de minería para ganar XP/créditos
5. **Forma clan** → Crea o únete a un equipo
6. **Conquista** → Completa misiones y ataca nodos

---

## 📁 Estructura

```
src/
├── app/              # Páginas (page.jsx, layout.jsx)
├── components/       # Componentes React
├── context/          # GameContext (estado global)
├── styles/           # CSS global
└── firebase.js       # Config Firebase
```

---

## 🔧 Scripts disponibles

```bash
npm run dev      # Desarrollo (hot reload)
npm run build    # Compilar para producción
npm start        # Ejecutar build
```

---

## 📚 Documentación

- **[README.md](README.md)** - Guía completa
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solucionar problemas
- **[.env.example](.env.example)** - Variables de entorno

---

## 🎯 Features principales

✅ Autenticación con Firebase
✅ Perfiles multijugador
✅ Chat global y de clan
✅ Sistema de clanes
✅ Misiones
✅ Minijuego de hacking
✅ Mapa conquistable
✅ Minería automática

---

## ❓ ¿Problemas?

Ve a [TROUBLESHOOTING.md](TROUBLESHOOTING.md) para soluciones comunes.

---

**¡Bienvenido a la Red Oscura! 🔴**