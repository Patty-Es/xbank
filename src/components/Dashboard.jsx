// src/components/Dashboard.jsx
// RF2: muestra nombre y saldo del usuario, suscrito en tiempo real vía onSnapshot.
// RF5: botón de logout.

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { suscribirseAUsuario } from '../services/userService'
import { cerrarSesion } from '../services/authService'

export default function Dashboard() {
  const { usuario } = useAuth()
  const [datosUsuario, setDatosUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

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
        <h1>XBank</h1>
        <button type="button" onClick={handleLogout} disabled={cerrandoSesion}>
          {cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión'}
        </button>
      </div>

      <p>Hola, {datosUsuario?.nombre}</p>

      <div className="saldo-card">
        <span className="saldo-label">Saldo disponible</span>
        <span className="saldo-monto">{formatearMonto(datosUsuario?.saldo)}</span>
      </div>

      <p className="placeholder-note">
        Siguiente paso: transferencias (RF3) e historial de movimientos (RF4).
      </p>
    </div>
  )
}

function formatearMonto(monto) {
  if (typeof monto !== 'number') return '$0'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto)
}