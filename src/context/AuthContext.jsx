// src/context/AuthContext.jsx
// Contexto global de sesión. Escucha los cambios de autenticación de Firebase
// con onAuthStateChanged y expone { usuario, cargando } a toda la app.
//
// Bonus: el estado de sesión se maneja con useReducer en vez de dos useState
// sueltos. Con solo dos campos (usuario, cargando) un useState alcanzaría,
// pero useReducer deja explícita la única transición de estado válida que
// existe acá ("Firebase ya resolvió la sesión, con este usuario o sin
// ninguno"), en vez de dos setters independientes que alguien podría llamar
// de forma inconsistente (por ejemplo, olvidar bajar "cargando").
//
// Por qué useEffect con [] como dependencias:
// onAuthStateChanged debe suscribirse UNA sola vez, cuando el proveedor se monta.
// No depende de ningún valor externo que cambie, así que el arreglo vacío es correcto
// (no es un "[] mágico que esconde bugs": es la elección correcta para una suscripción
// que vive mientras vive el componente).

import { createContext, useContext, useEffect, useReducer } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext(null)

const estadoInicial = {
  usuario: null,
  cargando: true,
}

function authReducer(estado, accion) {
  switch (accion.type) {
    case 'SESION_RESUELTA':
      // Firebase terminó de revisar si hay una sesión activa: puede venir
      // con un usuario (login previo restaurado) o con null (sin sesión).
      return { usuario: accion.payload, cargando: false }
    default:
      return estado
  }
}

export function AuthProvider({ children }) {
  const [estado, dispatch] = useReducer(authReducer, estadoInicial)

  useEffect(() => {
    // onAuthStateChanged retorna una función de limpieza (unsubscribe).
    // Si no la retornáramos, la suscripción seguiría viva incluso después
    // de desmontar este componente: eso es la fuga de memoria que pide
    // evitar el enunciado.
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
      dispatch({ type: 'SESION_RESUELTA', payload: usuarioFirebase })
    })

    return unsubscribe
  }, [])

  const value = estado

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook para consumir el contexto de sesión desde cualquier componente.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}