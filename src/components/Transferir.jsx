// src/components/Transferir.jsx
// RF3: formulario controlado para transferir dinero a otro usuario.

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { realizarTransferencia } from '../services/transferService'

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
    if (!emailDestinatario.trim()) {
      return 'Ingresa el correo del destinatario.'
    }
    const montoNumerico = Number(monto)
    if (!monto || Number.isNaN(montoNumerico) || montoNumerico <= 0) {
      return 'Ingresa un monto válido, mayor a 0.'
    }
    if (emailDestinatario.trim().toLowerCase() === usuario.email.toLowerCase()) {
      return 'No puedes transferirte dinero a ti mismo.'
    }
    return ''
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
      <h2>Transferir dinero</h2>

      <form onSubmit={handleSubmit}>
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