// src/components/DepositoRetiro.jsx
// Bonus: depósito y retiro simulado.
// El usuario elige la operación (depositar o retirar), ingresa un monto
// y confirma. La actualización del saldo ocurre con runTransaction en
// userService, igual que las transferencias: atómica y sin condiciones de carrera.
// El componente no importa Firestore directamente; delega en el servicio.

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { realizarDeposito, realizarRetiro } from '../services/userService'

export default function DepositoRetiro() {
  const { usuario } = useAuth()
  const [operacion, setOperacion] = useState(null) // 'deposito' | 'retiro' | null
  const [monto, setMonto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  function handleSeleccionOperacion(tipo) {
    setOperacion(tipo)
    setMonto('')
    setError('')
    setExito('')
  }

  function handleMontoChange(e) {
    setError('')
    setExito('')
    setMonto(e.target.value)
  }

  function handleCancelar() {
    setOperacion(null)
    setMonto('')
    setError('')
    setExito('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExito('')

    const montoNum = Number(monto)

    if (!monto || Number.isNaN(montoNum) || montoNum <= 0) {
      setError('Ingresa un monto válido mayor a 0.')
      return
    }

    setCargando(true)
    try {
      if (operacion === 'deposito') {
        await realizarDeposito(usuario.uid, montoNum)
        setExito(`Depósito de $${montoNum.toLocaleString('es-CL')} realizado.`)
      } else {
        await realizarRetiro(usuario.uid, montoNum)
        setExito(`Retiro de $${montoNum.toLocaleString('es-CL')} realizado.`)
      }
      setMonto('')
      setOperacion(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="deposito-retiro-card">
      <h2 className="seccion-titulo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        Depósito / Retiro
      </h2>

      {exito && <p className="exito-text">{exito}</p>}

      {!operacion && (
        <div className="dr-botones">
          <button
            type="button"
            className="btn-deposito"
            onClick={() => handleSeleccionOperacion('deposito')}
          >
            + Depositar
          </button>
          <button
            type="button"
            className="btn-retiro"
            onClick={() => handleSeleccionOperacion('retiro')}
          >
            − Retirar
          </button>
        </div>
      )}

      {operacion && (
        <form onSubmit={handleSubmit} className="dr-form">
          <label className="dr-label">
            {operacion === 'deposito' ? 'Monto a depositar' : 'Monto a retirar'}
          </label>
          <input
            type="number"
            className="dr-input"
            placeholder="Ej: 10000"
            value={monto}
            onChange={handleMontoChange}
            min="1"
            disabled={cargando}
          />
          {error && <p className="error-text">{error}</p>}
          <div className="dr-acciones">
            <button
              type="submit"
              className={operacion === 'deposito' ? 'btn-deposito' : 'btn-retiro'}
              disabled={cargando}
            >
              {cargando
                ? 'Procesando...'
                : operacion === 'deposito'
                ? 'Confirmar depósito'
                : 'Confirmar retiro'}
            </button>
            <button
              type="button"
              className="btn-cancelar"
              onClick={handleCancelar}
              disabled={cargando}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
