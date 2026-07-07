// src/services/authService.js
// Toda la lógica de Firebase Authentication vive acá.
// Los componentes NUNCA llaman a Firebase directamente: llaman a estas funciones.
// Esto cumple el requisito de "separar la lógica de Firebase en un módulo propio".

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const SALDO_INICIAL = 100000

/**
 * Registra un usuario nuevo en Firebase Auth y crea su documento
 * correspondiente en Firestore (colección "users") con saldo inicial.
 */
export async function registrarUsuario({ nombre, email, password }) {
  const credenciales = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credenciales.user.uid

  await setDoc(doc(db, 'users', uid), {
    nombre,
    email,
    saldo: SALDO_INICIAL,
    creadoEn: serverTimestamp(),
  })

  return credenciales.user
}

/**
 * Inicia sesión con email y contraseña.
 */
export async function iniciarSesion({ email, password }) {
  const credenciales = await signInWithEmailAndPassword(auth, email, password)
  return credenciales.user
}

/**
 * Cierra la sesión activa.
 */
export async function cerrarSesion() {
  await signOut(auth)
}
