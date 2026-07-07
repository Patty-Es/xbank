# XBank — Mini Banco Digital (TI3V31)

Prototipo de banca digital construido con React + Firebase (Authentication + Firestore).

> ⚠️ Estado actual: proyecto en construcción. Este README se irá completando
> a medida que avancemos en cada requisito funcional (RF1-RF5).

## Instalación y ejecución local

1. Clonar el repositorio.
2. Instalar dependencias:
   ```
   npm install
   ```
3. Copiar `.env.example` como `.env` y completar con las credenciales de tu
   proyecto de Firebase (Configuración del proyecto > General > Tus apps > SDK config).
   ```
   cp .env.example .env
   ```
4. Correr en modo desarrollo:
   ```
   npm run dev
   ```

## Usuarios de prueba

Crea estos 2 usuarios registrándote directamente desde la app (`npm run dev` → pantalla de registro),
y luego actualiza esta tabla con las credenciales reales que usaste:

| Email | Contraseña |
|---|---|
| usuario1@xbank.test | (la que definas, mínimo 6 caracteres) |
| usuario2@xbank.test | (la que definas, mínimo 6 caracteres) |

## Modelo de datos

```
users/{uid}        → { nombre, email, saldo }
movimientos/{id}   → { emisorUid, receptorUid, monto, fecha, descripcion }
```

## Uso de IA

_(Pendiente: se completará al final del desarrollo)_

## Progreso

- [x] Setup del proyecto (Vite + estructura de carpetas + config Firebase)
- [x] Proyecto Firebase creado, Authentication (email/contraseña) y Firestore habilitados
- [x] RF1 — Autenticación (registro, login, logout, saldo inicial $100.000)
- [ ] RF2 — Dashboard con saldo en tiempo real
- [ ] RF3 — Transferencias
- [ ] RF4 — Historial de movimientos
- [ ] RF5 — Cerrar sesión (falta el botón en la UI; la función ya existe en authService)
