// src/services/transferService.js
// RF3: transferencias entre usuarios.
//
// Por qué runTransaction y no operaciones sueltas:
// Si hiciéramos "leer saldo -> restar -> escribir" como pasos separados,
// dos transferencias simultáneas del mismo usuario podrían leer el mismo
// saldo inicial y pisarse una a la otra (condición de carrera clásica).
// runTransaction le garantiza a Firestore que todo el bloque se ejecuta
// de forma atómica: o se aplican los 3 cambios (débito, crédito, registro
// del movimiento) o no se aplica ninguno.

import {
  collection,
  doc,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Busca el documento de usuario cuyo campo "email" coincide con el correo dado.
 */
async function buscarUsuarioPorEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email))
  const resultado = await getDocs(q)

  if (resultado.empty) {
    return null
  }

  const docEncontrado = resultado.docs[0]
  return { uid: docEncontrado.id, ...docEncontrado.data() }
}

/**
 * Ejecuta una transferencia de dinero entre dos usuarios.
 *
 * Validaciones (en este orden):
 * 1. Monto debe ser un número mayor a 0.
 * 2. El destinatario debe existir (buscado por email).
 * 3. No se puede transferir a la propia cuenta.
 * 4. El emisor debe tener saldo suficiente.
 *
 * Todo el movimiento de dinero ocurre dentro de una única transacción.
 */
export async function realizarTransferencia({ uidEmisor, emailEmisor, emailDestinatario, monto }) {
  if (typeof monto !== 'number' || Number.isNaN(monto) || monto <= 0) {
    throw new Error('El monto debe ser mayor a 0.')
  }

  const destinatario = await buscarUsuarioPorEmail(emailDestinatario)

  if (!destinatario) {
    throw new Error('No existe un usuario registrado con ese correo.')
  }

  if (destinatario.uid === uidEmisor) {
    throw new Error('No puedes transferirte dinero a ti mismo.')
  }

  const refEmisor = doc(db, 'users', uidEmisor)
  const refReceptor = doc(db, 'users', destinatario.uid)
  const refMovimiento = doc(collection(db, 'movimientos'))

  await runTransaction(db, async (transaction) => {
    // IMPORTANTE: todas las lecturas de una transacción deben ir antes
    // que cualquier escritura. Firestore lo exige así.
    const snapEmisor = await transaction.get(refEmisor)

    if (!snapEmisor.exists()) {
      throw new Error('Tu cuenta no fue encontrada.')
    }

    const saldoEmisor = snapEmisor.data().saldo

    if (saldoEmisor < monto) {
      throw new Error('Saldo insuficiente para realizar la transferencia.')
    }

    // A partir de acá, solo escrituras.
    transaction.update(refEmisor, { saldo: saldoEmisor - monto })
    transaction.update(refReceptor, {
      saldo: destinatario.saldo + monto,
    })
    transaction.set(refMovimiento, {
      emisorUid: uidEmisor,
      receptorUid: destinatario.uid,
      emisorEmail: emailEmisor,
      receptorEmail: destinatario.email,
      monto,
      fecha: serverTimestamp(),
    })
  })
}