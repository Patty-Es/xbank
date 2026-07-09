# XBank — Mini Banco Digital (TI3V31)

Prototipo de banca digital construido con React + Firebase (Authentication + Firestore).
Permite registro/login, ver saldo en tiempo real, transferir dinero entre usuarios y
consultar el historial de movimientos, todo actualizado en vivo sin recargar la página.

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

| Email | Contraseña |
|---|---|
| patricia@xbank.test | 123456 |
| andrea-23@bank.test | 123456 |

## Modelo de datos

```
users/{uid}        → { nombre, email, saldo, creadoEn }
movimientos/{id}   → { emisorUid, receptorUid, emisorEmail, receptorEmail, monto, fecha }
```

**Nota sobre el modelo sugerido:** se omitió el campo `descripcion` porque el
enunciado no pide que el usuario escriba un mensaje junto con la transferencia
(RF3 solo pide monto y destinatario). En cambio, se agregaron `emisorEmail` y
`receptorEmail` directamente en el documento del movimiento: así el historial
(RF4) puede mostrar "Enviado a / Recibido de" sin tener que hacer una lectura
extra a la colección `users` por cada movimiento, lo que mantiene las consultas
del historial eficientes y en tiempo real.

Los movimientos se consultan con dos suscripciones `onSnapshot` (una por
`emisorUid` y otra por `receptorUid`, ambas con `orderBy('fecha', 'desc')`),
combinadas en el cliente. Firestore requiere un índice compuesto para cada una
de esas consultas (equality + orderBy en campos distintos); ambos índices están
creados en el proyecto de Firebase asociado a este repositorio.

## Uso de IA

Usé Claude (Anthropic) como asistente durante todo el desarrollo: para generar
la estructura inicial del proyecto y los módulos de `src/services/` (auth,
usuario, transferencias, movimientos), explicarme por qué usar `runTransaction`
en vez de lecturas/escrituras sueltas para evitar condiciones de carrera en las
transferencias, y guiarme paso a paso en la configuración de Firebase Console
(Authentication, Firestore, índices compuestos) y en el uso de Git/GitHub. Todo
el código fue revisado y probado por mí antes de integrarlo; entendí cada
decisión (por ejemplo, por qué las lecturas de una transacción de Firestore
deben ir antes que las escrituras, o por qué el `useEffect` de las
suscripciones depende de `[usuario.uid]` y no de `[]`).

## Arquitectura del proyecto

```
src/
  firebase/config.js       → inicializa Firebase (Auth + Firestore) desde .env
  services/
    authService.js         → registro, login, logout
    userService.js         → suscripción en tiempo real al saldo (RF2)
    transferService.js     → transferencias con runTransaction (RF3)
    movimientosService.js  → suscripción en tiempo real al historial (RF4)
  context/AuthContext.jsx  → estado global de sesión (onAuthStateChanged)
  components/
    Login.jsx               → RF1, formulario controlado de login/registro
    Dashboard.jsx            → RF2 + RF5, saldo y botón de logout
    Transferir.jsx           → RF3, formulario de transferencia
    Historial.jsx            → RF4, lista de movimientos
  App.jsx                   → enruta entre Login y Dashboard según la sesión
```

Los componentes nunca llaman a Firebase directamente: siempre pasan por un
módulo de `services/`. Esto separa la lógica de datos de la UI y hace que cada
componente tenga una sola responsabilidad.

Los bonuses se implementaron sin librerías externas:

- **Filtro/búsqueda en historial**: filtrado en memoria sobre los datos del `onSnapshot`, sin consultas extra a Firestore.
- **useReducer + useContext para la sesión**: `AuthContext` usa `useReducer` con una sola acción (`SESION_RESUELTA`) para que la transición sea explícita e imposible de llamar de forma inconsistente.
- **Depósito/retiro simulado**: componente `DepositoRetiro.jsx` con validaciones y `runTransaction` en `userService.js`, igual de atómico que las transferencias.
- **Modo oscuro/claro persistente**: variables CSS en `:root` y `[data-tema="claro"]`, toggle en el header que guarda la preferencia en `localStorage`. Un script inline en `index.html` aplica el tema antes de que React renderice para evitar el flash de color.

## Reglas de seguridad de Firestore

Las reglas restringen el acceso a usuarios autenticados:

- `users/{userId}`: cualquier usuario logueado puede leer perfiles (necesario
  para buscar destinatarios por email y mostrar nombres en el historial), pero
  solo puede crear su propio documento al registrarse, y las actualizaciones
  solo pueden modificar el campo `saldo` (necesario para que las
  transferencias funcionen sin permitir que alguien edite el nombre o el
  email de otro usuario).
- `movimientos/{movId}`: solo pueden leerse por quienes participaron en el
  movimiento (emisor o receptor), solo se crean si el usuario autenticado es
  el emisor, y no se permite editarlos ni borrarlos.

## Progreso

- [x] Setup del proyecto (Vite + estructura de carpetas + config Firebase)
- [x] Proyecto Firebase creado, Authentication (email/contraseña) y Firestore habilitados
- [x] RF1 — Autenticación (registro, login, logout, saldo inicial $100.000)
- [x] RF2 — Dashboard con saldo en tiempo real (onSnapshot)
- [x] RF3 — Transferencias (runTransaction, atómico)
- [x] RF4 — Historial de movimientos (onSnapshot, tiempo real)
- [x] RF5 — Cerrar sesión (botón funcional en el Dashboard)
- [x] Bonus — Filtro y búsqueda en el historial (por tipo y contraparte)
- [x] Bonus — useReducer + useContext para el estado global de sesión
- [x] Bonus — Depósito y retiro simulado con validaciones y runTransaction
- [x] Bonus — Modo oscuro/claro persistente con localStorage
