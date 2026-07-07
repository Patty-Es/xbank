// src/services/userService.js
// Lógica de Firestore relacionada al documento del usuario (users/{uid}).
// La suscripción en tiempo real vive acá, no en el componente: el componente
// solo llama a esta función y recibe los datos por callback.

import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Se suscribe en tiempo real al documento del usuario.
 * Retorna la función de "unsubscribe" que el componente debe llamar
 * en la limpieza de su useEffect para evitar fugas de memoria.
 */
export function suscribirseAUsuario(uid, onDatos, onError) {
  const refUsuario = doc(db, 'users', uid)

  const unsubscribe = onSnapshot(
    refUsuario,
    (snapshot) => {
      if (snapshot.exists()) {
        onDatos(snapshot.data())
      } else {
        onDatos(null)
      }
    },
    (error) => {
      onError(error)
    }
  )

  return unsubscribe
}