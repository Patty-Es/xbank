// src/components/Historial.jsx
// RF4: lista de movimientos del usuario en tiempo real, más reciente primero.
// Bonus: filtro por tipo (todos/enviados/recibidos) y búsqueda por contraparte.
// El filtrado es puramente en memoria sobre los datos ya suscritos: no se
// vuelve a consultar Firestore por cada cambio de filtro, así que sigue
// siendo reactivo y liviano.

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { suscribirseAMovimientos } from '../services/movimientosService'

export default function Historial() {
  const { usuario } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

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

  function handleTipoChange(nuevoTipo) {
    setTipoFiltro(nuevoTipo)
  }

  function handleBusquedaChange(event) {
    setBusqueda(event.target.value)
  }

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((mov) => {
      const esEnviado = mov.emisorUid === usuario.uid

      if (tipoFiltro === 'enviados' && !esEnviado) return false
      if (tipoFiltro === 'recibidos' && esEnviado) return false

      if (busqueda.trim()) {
        const contraparte = esEnviado ? mov.receptorEmail : mov.emisorEmail
        const coincide = contraparte
          ?.toLowerCase()
          .includes(busqueda.trim().toLowerCase())
        if (!coincide) return false
      }

      return true
    })
  }, [movimientos, tipoFiltro, busqueda, usuario.uid])

  return (
    <div className="historial-card">
      <h2 className="seccion-titulo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Historial de movimientos
      </h2>

      <div className="historial-filtros">
        <div className="filtro-tipo-grupo">
          <button
            type="button"
            className={tipoFiltro === 'todos' ? 'filtro-btn activo' : 'filtro-btn'}
            onClick={() => handleTipoChange('todos')}
          >
            Todos
          </button>
          <button
            type="button"
            className={tipoFiltro === 'enviados' ? 'filtro-btn activo' : 'filtro-btn'}
            onClick={() => handleTipoChange('enviados')}
          >
            Enviados
          </button>
          <button
            type="button"
            className={tipoFiltro === 'recibidos' ? 'filtro-btn activo' : 'filtro-btn'}
            onClick={() => handleTipoChange('recibidos')}
          >
            Recibidos
          </button>
        </div>

        <input
          type="text"
          className="filtro-busqueda"
          placeholder="Buscar por correo..."
          value={busqueda}
          onChange={handleBusquedaChange}
        />
      </div>

      {cargando && <p className="loading-text">Cargando movimientos...</p>}
      {error && <p className="error-text">{error}</p>}

      {!cargando && !error && movimientos.length === 0 && (
        <p className="placeholder-note">Todavía no tienes movimientos.</p>
      )}

      {!cargando && !error && movimientos.length > 0 && movimientosFiltrados.length === 0 && (
        <p className="placeholder-note">Ningún movimiento coincide con el filtro.</p>
      )}

      {!cargando && movimientosFiltrados.length > 0 && (
        <ul className="movimientos-lista">
          {movimientosFiltrados.map((mov) => {
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