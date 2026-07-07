// src/context/AuthContext.jsx
// Contexto global de sesión. Escucha los cambios de autenticación de Firebase
// con onAuthStateChanged y expone { usuario, cargando } a toda la app.
//
// Por qué useEffect con [] como dependencias:
// onAuthStateChanged debe suscribirse UNA sola vez, cuando el proveedor se monta.
// No depende de ningún valor externo que cambie, así que el arreglo vacío es correcto
// (no es un "[] mágico que esconde bugs": es la elección correcta para una suscripción
// que vive mientras vive el componente).

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // onAuthStateChanged retorna una función de limpieza (unsubscribe).
    // Si no la retornáramos, la suscripción seguiría viva incluso después
    // de desmontar este componente: eso es la fuga de memoria que pide
    // evitar el enunciado.
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
      setUsuario(usuarioFirebase)
      setCargando(false)
    })

    return unsubscribe
  }, [])

  const value = { usuario, cargando }

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
