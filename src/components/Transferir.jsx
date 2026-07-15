// src/components/Transferir.jsx
// RF3: formulario controlado para transferir dinero a otro usuario.

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { realizarTransferencia } from '../services/transferService'
import { validarTransferencia } from '../utils/validaciones'

export default function Transferir({ onExito }) {
  const { usuario } = useAuth()
  const [emailDestinatario, setEmailDestinatario] = useState('')
  const [monto, setMonto] = useState('')
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [enviando, setEnviando] = useState(false)

  function handleEmailChange(event) {
    setEmailDestinatario(event.target.value)
  }

  function handleMontoChange(event) {
    setMonto(event.target.value)
  }

  function validarFormulario() {
    return validarTransferencia({
      emailDestinatario,
      monto,
      emailEmisor: usuario.email,
      saldo: null, // el saldo real lo verifica runTransaction en el servicio
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const mensajeError = validarFormulario()
    if (mensajeError) {
      setError(mensajeError)
      setMensajeExito('')
      return
    }

    setError('')
    setMensajeExito('')
    setEnviando(true)

    try {
      await realizarTransferencia({
        uidEmisor: usuario.uid,
        emailEmisor: usuario.email,
        emailDestinatario: emailDestinatario.trim(),
        monto: Number(monto),
      })

      setMensajeExito(`Transferiste $${Number(monto).toLocaleString('es-CL')} a ${emailDestinatario.trim()} correctamente.`)
      setEmailDestinatario('')
      setMonto('')
      onExito?.()
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar la transferencia.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="transferir-card">
      <h2 className="seccion-titulo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Transferir dinero
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="emailDestinatario">Correo del destinatario</label>
        <input
          id="emailDestinatario"
          type="email"
          value={emailDestinatario}
          onChange={handleEmailChange}
          disabled={enviando}
          placeholder="usuario2@xbank.test"
        />

        <label htmlFor="monto">Monto</label>
        <input
          id="monto"
          type="number"
          min="1"
          value={monto}
          onChange={handleMontoChange}
          disabled={enviando}
          placeholder="10000"
        />

        {error && <p className="error-text">{error}</p>}
        {mensajeExito && <p className="success-text">{mensajeExito}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Procesando...' : 'Transferir'}
        </button>
      </form>
    </div>
  )
}