## 🔧 Troubleshooting

### Problemas Comunes

#### ❌ Error: "Firebase configuration is missing"
**Solución:**
1. Verifica que `.env.local` existe en la raíz del proyecto
2. Copia bien las credenciales de Firebase Console
3. Las variables deben empezar con `NEXT_PUBLIC_`
4. Reinicia el servidor (`npm run dev`)

#### ❌ Error: "User not found" en login
**Solución:**
1. Asegúrate de haber habilitado Email/Password en Firebase Auth
2. El usuario debe existir o crear cuenta nueva
3. Verifica que el email sea válido

#### ❌ Error: "Permission denied" en Firestore
**Solución:**
1. Ve a Firebase Console > Firestore > Reglas
2. Asegúrate de tener las reglas correctas configuradas
3. En modo desarrollo (solo para pruebas):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
⚠️ **NO usar en producción** - Configurar reglas de seguridad apropiadas

#### ❌ El juego no carga componentes
**Solución:**
1. Verifica que todos los componentes tengan `'use client';` al inicio
2. Revisa la consola del navegador (F12 > Console)
3. Limpia caché: `npm run build && npm start`

#### ❌ Chat no muestra mensajes
**Solución:**
1. Verifica que la colección `mensajes` existe en Firestore
2. Comprueba que el usuario está autenticado
3. Revisa las reglas de Firestore para `mensajes`

#### ⚡ El juego es lento
**Solución:**
1. Reduce la frecuencia de `onSnapshot()` listeners
2. Agrega índices en Firestore (te avisa automáticamente)
3. Usa `limit()` en queries para limitar documentos
4. Considera lazy-loading de componentes

### Logs Útiles

En la consola del navegador (F12):
```javascript
// Ver estado del usuario
console.log(auth.currentUser);

// Escuchar cambios en tiempo real
const unsubscribe = onSnapshot(doc(db, 'jugadores', uid), (doc) => {
  console.log("Jugador:", doc.data());
});
```

### Contacto & Soporte

- 📧 Issues: [GitHub Issues](https://github.com/ShacktarMalacky/Red-Obscura/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/ShacktarMalacky/Red-Obscura/discussions)
