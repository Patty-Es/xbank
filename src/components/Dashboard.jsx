// src/components/Dashboard.jsx
// RF2: muestra nombre y saldo del usuario, suscrito en tiempo real vía onSnapshot.
// RF5: botón de logout.

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { suscribirseAUsuario } from '../services/userService'
import { cerrarSesion } from '../services/authService'
import Transferir from './Transferir'
import Historial from './Historial'
import DepositoRetiro from './DepositoRetiro'
import Logo from './Logo'

export default function Dashboard() {
  const { usuario } = useAuth()
  const [datosUsuario, setDatosUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [tema, setTema] = useState(
    () => localStorage.getItem('xbank-tema') || 'oscuro'
  )

  const handleToggleTema = useCallback(() => {
    const nuevoTema = tema === 'oscuro' ? 'claro' : 'oscuro'
    setTema(nuevoTema)
    localStorage.setItem('xbank-tema', nuevoTema)
    document.documentElement.setAttribute('data-tema', nuevoTema)
  }, [tema])

  useEffect(() => {
    setCargando(true)
    setError('')

    const unsubscribe = suscribirseAUsuario(
      usuario.uid,
      (datos) => {
        setDatosUsuario(datos)
        setCargando(false)
      },
      (err) => {
        console.error(err)
        setError('No se pudo cargar tu saldo. Intenta recargar la página.')
        setCargando(false)
      }
    )

    return unsubscribe
  }, [usuario.uid])

  async function handleLogout() {
    setCerrandoSesion(true)
    try {
      await cerrarSesion()
    } catch (err) {
      setError('No se pudo cerrar sesión. Intenta nuevamente.')
      setCerrandoSesion(false)
    }
  }

  if (cargando) {
    return (
      <div className="container">
        <p className="loading-text">Cargando tu saldo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-text">{error}</p>
        <button type="button" onClick={handleLogout} disabled={cerrandoSesion}>
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <Logo />
        <div className="dashboard-header-acciones">
          <button type="button" className="btn-tema" onClick={handleToggleTema} title="Cambiar tema">
            {tema === 'oscuro' ? '☀️' : '🌙'}
          </button>
          <button type="button" onClick={handleLogout} disabled={cerrandoSesion}>
            {cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>

      <p className="bienvenida">Bienvenida, <strong>{datosUsuario?.nombre}</strong></p>

      <div className="saldo-card">
        <span className="saldo-cuenta">Cuenta Vista · •••• {numeroCuenta(usuario.uid)}</span>
        <span className="saldo-label">Saldo disponible</span>
        <span className="saldo-monto">{formatearMonto(datosUsuario?.saldo)}</span>
      </div>

      <DepositoRetiro />

      <Transferir />

      <Historial />
    </div>
  )
}

// Genera un número de cuenta de 4 dígitos a partir del UID del usuario.
// Es siempre el mismo para el mismo usuario (determinístico), pero no
// expone el UID real: solo lo usamos como identificador visual.
function numeroCuenta(uid) {
  const hash = uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return String(hash % 9000 + 1000)
}

function formatearMonto(monto) {
  if (typeof monto !== 'number') return '$0'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto)
}