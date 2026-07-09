# Defensa técnica — XBank

En este documento explico las decisiones de diseño y código más importantes del proyecto, con el razonamiento detrás de cada una.

---

## 1. ¿Por qué el `useEffect` en `AuthContext` tiene `[]` como dependencias?

En `AuthContext.jsx` uso `useEffect` con un arreglo de dependencias vacío `[]`:

```js
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
    dispatch({ type: 'SESION_RESUELTA', payload: usuarioFirebase })
  })
  return unsubscribe
}, [])
```

El `[]` no es un truco para "saltar" las dependencias — es la elección correcta. `onAuthStateChanged` es una suscripción que debe crearse una sola vez cuando el `AuthProvider` se monta, y debe vivir mientras el proveedor exista. No depende de ningún valor externo que cambie, así que no hay nada que poner en el arreglo. Si pusiera alguna variable que no existe, generaría un loop o suscripciones duplicadas.

---

## 2. ¿Qué pasa si no se hace `unsubscribe`?

Cada vez que llamo a `onSnapshot` o `onAuthStateChanged`, Firebase crea una suscripción activa que escucha cambios en tiempo real. Si no retorno la función de limpieza (`unsubscribe`) en el `useEffect`, esa suscripción sigue viva aunque el componente ya no esté en pantalla.

Eso produce una **fuga de memoria**: Firebase sigue enviando datos, el callback intenta actualizar un estado que ya no existe y React puede lanzar advertencias o comportamientos inesperados. Por eso en todos mis `useEffect` que crean suscripciones retorno el `unsubscribe`:

```js
useEffect(() => {
  const unsubscribe = suscribirseAUsuario(usuario.uid, onDatos, onError)
  return unsubscribe  // se ejecuta cuando el componente se desmonta
}, [usuario.uid])
```

---

## 3. ¿Por qué el saldo se lee con `onSnapshot` y no con `getDoc`?

Si usara `getDoc` (lectura única), el saldo que ve el usuario quedaría "congelado" en el momento en que cargó la página. Si otra persona le transfiere dinero, la pantalla no se actualizaría hasta que el usuario recargue manualmente.

Con `onSnapshot`, Firebase mantiene una conexión abierta y envía los datos cada vez que el documento cambia en Firestore. Así el saldo se actualiza solo, en tiempo real, sin que el usuario haga nada. Eso es exactamente lo que pide el enunciado (RF2: saldo en tiempo real).

---

## 4. ¿Por qué `runTransaction` en las transferencias?

Sin transacciones, una transferencia se haría en pasos separados: leer el saldo del emisor, restar el monto, escribir el nuevo saldo. Si dos transferencias del mismo usuario ocurren casi al mismo tiempo, ambas podrían leer el mismo saldo inicial antes de que ninguna haya escrito, y el resultado final sería incorrecto (se descontaría solo una vez en lugar de dos).

`runTransaction` resuelve esto garantizando que todo el bloque de código — leer el saldo del emisor, verificar que alcanza, descontar al emisor, abonar al receptor y registrar el movimiento — se ejecuta de forma **atómica**. O se aplican los tres cambios o no se aplica ninguno. No puede quedar en un estado intermedio.

También por eso pongo todas las lecturas antes de las escrituras dentro de la transacción, porque Firestore lo exige así.

---

## 5. ¿Por qué `useReducer` en vez de dos `useState` en `AuthContext`?

Podría haber usado dos `useState` separados para `usuario` y `cargando`. Con solo dos campos funcionaría, pero `useReducer` tiene una ventaja: hace explícita la única transición de estado válida que existe aquí.

Con dos `useState`, nada impide que alguien llame `setUsuario(...)` sin llamar `setCargando(false)`, dejando la app en un estado inconsistente (mostrando el spinner aunque ya hay datos). Con `useReducer`, la acción `SESION_RESUELTA` actualiza los dos campos juntos, en un solo dispatch. Es imposible actualizarlos por separado de forma accidental.

```js
function authReducer(estado, accion) {
  switch (accion.type) {
    case 'SESION_RESUELTA':
      return { usuario: accion.payload, cargando: false }
    default:
      return estado
  }
}
```

---

## 6. ¿Por qué el `useEffect` del Dashboard tiene `[usuario.uid]` como dependencia?

```js
useEffect(() => {
  const unsubscribe = suscribirseAUsuario(usuario.uid, ...)
  return unsubscribe
}, [usuario.uid])
```

Porque la suscripción escucha el documento de **ese usuario específico** en Firestore. Si el `uid` cambia (por ejemplo, si cerrara sesión y entrara otra persona sin recargar la página), el efecto tiene que limpiar la suscripción anterior y crear una nueva para el nuevo usuario. Si pusiera `[]`, quedaría escuchando el documento del primer usuario para siempre.

---

## 7. ¿Qué es un formulario controlado y por qué lo usé?

Un formulario controlado es uno donde el valor de cada input vive en el estado de React, no en el DOM. Cada vez que el usuario escribe, un handler actualiza el estado, y el atributo `value` del input siempre refleja ese estado.

```jsx
<input
  value={emailDestinatario}
  onChange={handleEmailChange}
/>
```

Esto me permite leer y validar los datos antes de enviarlos, mostrar mensajes de error en la UI (no solo en consola), y resetear el formulario fácilmente después de una transferencia exitosa. Si no fuera controlado, tendría que leer el valor desde el DOM con `document.getElementById`, lo que está prohibido en el enunciado.

---

## 8. ¿Por qué se deshabilita el botón mientras se procesa?

```jsx
<button type="submit" disabled={enviando}>
  {enviando ? 'Procesando...' : 'Transferir'}
</button>
```

Para evitar el **doble submit**. Si el usuario hace clic dos veces rápido sin el `disabled`, se ejecutarían dos transacciones y se descontaría el dinero dos veces. Al deshabilitar el botón mientras `enviando` es `true`, es imposible lanzar una segunda operación hasta que la primera termine.

---

## 9. ¿Por qué los componentes no importan Firebase directamente?

Toda la lógica de Firestore y Firebase Auth está en `src/services/`. Los componentes solo llaman a las funciones de ese módulo y reciben los datos por parámetro o callback.

Esto respeta el principio de responsabilidad única: un componente como `Transferir.jsx` solo tiene que manejar el formulario y mostrar feedback. No necesita saber cómo funciona Firestore internamente. Si en el futuro quisiera cambiar el backend, solo tendría que modificar los servicios, no tocar cada componente.

También hace el código más legible: al leer `Transferir.jsx` se entiende qué hace sin tener que navegar entre imports de Firestore mezclados con JSX.

---

## 10. ¿Por qué se valida antes de tocar Firestore?

En `Transferir.jsx` y `DepositoRetiro.jsx` valido los inputs antes de llamar al servicio:

```js
const mensajeError = validarFormulario()
if (mensajeError) {
  setError(mensajeError)
  return
}
```

Hay dos razones: primero, evitar llamadas innecesarias a Firestore (que tienen costo y latencia). Segundo, dar feedback inmediato al usuario — si el monto está vacío o es inválido, el mensaje aparece al instante sin esperar la respuesta del servidor.
