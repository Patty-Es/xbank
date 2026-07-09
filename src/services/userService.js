// src/services/userService.js
// Lógica de Firestore relacionada al documento del usuario (users/{uid}).
// La suscripción en tiempo real vive acá, no en el componente: el componente
// solo llama a esta función y recibe los datos por callback.

import { doc, onSnapshot, runTransaction } from 'firebase/firestore'
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

/**
 * Deposita un monto al saldo del usuario de forma atómica.
 * Validación: monto debe ser un número mayor a 0.
 */
export async function realizarDeposito(uid, monto) {
  if (typeof monto !== 'number' || Number.isNaN(monto) || monto <= 0) {
    throw new Error('El monto debe ser mayor a 0.')
  }

  const refUsuario = doc(db, 'users', uid)

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(refUsuario)
    if (!snap.exists()) throw new Error('Tu cuenta no fue encontrada.')
    transaction.update(refUsuario, { saldo: snap.data().saldo + monto })
  })
}

/**
 * Retira un monto del saldo del usuario de forma atómica.
 * Validaciones: monto mayor a 0 y saldo suficiente.
 */
export async function realizarRetiro(uid, monto) {
  if (typeof monto !== 'number' || Number.isNaN(monto) || monto <= 0) {
    throw new Error('El monto debe ser mayor a 0.')
  }

  const refUsuario = doc(db, 'users', uid)

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(refUsuario)
    if (!snap.exists()) throw new Error('Tu cuenta no fue encontrada.')
    const saldoActual = snap.data().saldo
    if (saldoActual < monto) throw new Error('Saldo insuficiente para realizar el retiro.')
    transaction.update(refUsuario, { saldo: saldoActual - monto })
  })
}