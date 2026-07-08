// src/components/Historial.jsx
// RF4: lista de movimientos del usuario en tiempo real, más reciente primero.

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { suscribirseAMovimientos } from '../services/movimientosService'

export default function Historial() {
  const { usuario } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setCargando(true)
    setError('')

    const unsubscribe = suscribirseAMovimientos(
      usuario.uid,
      (lista) => {
        setMovimientos(lista)
        setCargando(false)
      },
      (err) => {
        console.error(err)
        setError('No se pudo cargar el historial de movimientos.')
        setCargando(false)
      }
    )

    return unsubscribe
  }, [usuario.uid])

  return (
    <div className="historial-card">
      <h2>Historial de movimientos</h2>

      {cargando && <p className="loading-text">Cargando movimientos...</p>}
      {error && <p className="error-text">{error}</p>}

      {!cargando && !error && movimientos.length === 0 && (
        <p className="placeholder-note">Todavía no tienes movimientos.</p>
      )}

      {!cargando && movimientos.length > 0 && (
        <ul className="movimientos-lista">
          {movimientos.map((mov) => {
            const esEnviado = mov.emisorUid === usuario.uid
            return (
              <li key={mov.id} className="movimiento-item">
                <div className="movimiento-info">
                  <span className={esEnviado ? 'movimiento-tipo enviado' : 'movimiento-tipo recibido'}>
                    {esEnviado ? 'Enviado a' : 'Recibido de'}
                  </span>
                  <span className="movimiento-contraparte">
                    {esEnviado ? mov.receptorEmail : mov.emisorEmail}
                  </span>
                </div>
                <div className="movimiento-monto-fecha">
                  <span className={esEnviado ? 'movimiento-monto negativo' : 'movimiento-monto positivo'}>
                    {esEnviado ? '-' : '+'}
                    {formatearMonto(mov.monto)}
                  </span>
                  <span className="movimiento-fecha">{formatearFecha(mov.fecha)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
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

function formatearFecha(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}