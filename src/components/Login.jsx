// src/components/Login.jsx
// Formulario controlado de login y registro (alterna entre ambos modos).
// Cumple los requisitos de manejo de eventos:
// - inputs controlados (el valor vive en el estado, no en el DOM)
// - handlers nombrados con responsabilidad clara
// - preventDefault en el submit
// - validación antes de tocar Firestore/Auth, con mensaje visible
// - botón deshabilitado mientras la operación está en curso

import { useState } from 'react'
import { registrarUsuario, iniciarSesion } from '../services/authService'
import Logo from './Logo'

export default function Login() {
  const [modoRegistro, setModoRegistro] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  function handleNombreChange(event) {
    setNombre(event.target.value)
  }

  function handleEmailChange(event) {
    setEmail(event.target.value)
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value)
  }

  function handleToggleModo() {
    setError('')
    setModoRegistro((valorActual) => !valorActual)
  }

  function validarFormulario() {
    if (!email.trim() || !password.trim()) {
      return 'Correo y contraseña son obligatorios.'
    }
    if (modoRegistro && !nombre.trim()) {
      return 'El nombre es obligatorio para registrarte.'
    }
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.'
    }
    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const mensajeError = validarFormulario()
    if (mensajeError) {
      setError(mensajeError)
      return
    }

    setError('')
    setEnviando(true)

    try {
      if (modoRegistro) {
        await registrarUsuario({ nombre, email, password })
      } else {
        await iniciarSesion({ email, password })
      }
      // No hace falta redirigir manualmente: AuthContext detecta el cambio
      // de sesión vía onAuthStateChanged y App.jsx renderiza el Dashboard.
    } catch (err) {
      setError(traducirErrorFirebase(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '8px' }}><Logo /></div>
      <h2>{modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}</h2>

      <form onSubmit={handleSubmit} noValidate>
        {modoRegistro && (
          <div>
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={handleNombreChange}
              disabled={enviando}
            />
          </div>
        )}

        <div>
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            disabled={enviando}
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            disabled={enviando}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Procesando...' : modoRegistro ? 'Registrarme' : 'Ingresar'}
        </button>
      </form>

      <button type="button" onClick={handleToggleModo} disabled={enviando}>
        {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
    </div>
  )
}

/**
 * Traduce los códigos de error de Firebase Auth a mensajes legibles
 * para el usuario final (evita mostrarle "auth/invalid-credential" pelado).
 */
function traducirErrorFirebase(codigo) {
  const mensajes = {
    'auth/email-already-in-use': 'Ese correo ya está registrado.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/weak-password': 'La contraseña es muy débil.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
  }
  return mensajes[codigo] || 'Ocurrió un error. Intenta nuevamente.'
}
