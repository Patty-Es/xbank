// src/services/movimientosService.js
// RF4: historial de movimientos del usuario, en tiempo real.
//
// Un usuario puede aparecer como emisor O como receptor de un movimiento.
// Firestore no permite un "OR" directo entre dos campos distintos en una
// sola consulta, así que hacemos dos suscripciones (una por cada rol) y
// combinamos los resultados en el componente.

import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function suscribirseAMovimientos(uid, onDatos, onError) {
  const movimientosPorUid = new Map()

  function emitirCombinados() {
    const lista = Array.from(movimientosPorUid.values()).sort(
      (a, b) => (b.fecha?.toMillis?.() ?? 0) - (a.fecha?.toMillis?.() ?? 0)
    )
    onDatos(lista)
  }

  const refMovimientos = collection(db, 'movimientos')

  const qComoEmisor = query(
    refMovimientos,
    where('emisorUid', '==', uid),
    orderBy('fecha', 'desc')
  )
  const qComoReceptor = query(
    refMovimientos,
    where('receptorUid', '==', uid),
    orderBy('fecha', 'desc')
  )

  function actualizarDesdeSnapshot(snapshot) {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'removed') {
        movimientosPorUid.delete(change.doc.id)
      } else {
        movimientosPorUid.set(change.doc.id, { id: change.doc.id, ...change.doc.data() })
      }
    })
    emitirCombinados()
  }

  const unsubscribeEmisor = onSnapshot(qComoEmisor, actualizarDesdeSnapshot, onError)
  const unsubscribeReceptor = onSnapshot(qComoReceptor, actualizarDesdeSnapshot, onError)

  return function unsubscribeAmbas() {
    unsubscribeEmisor()
    unsubscribeReceptor()
  }
}