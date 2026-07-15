// src/utils/validaciones.js
// Funciones puras de validación extraídas de los componentes.
// Al ser funciones puras (sin efectos, sin Firebase), se pueden testear
// de forma directa sin necesidad de mocks ni de montar componentes.

/**
 * Valida los datos de una transferencia.
 * Retorna un string con el mensaje de error, o '' si todo está OK.
 */
export function validarTransferencia({ emailDestinatario, monto, emailEmisor, saldo }) {
  if (!emailDestinatario || !emailDestinatario.trim()) {
    return 'Ingresa el correo del destinatario.'
  }

  if (!esEmailValido(emailDestinatario.trim())) {
    return 'El correo del destinatario no tiene un formato válido.'
  }

  if (emailDestinatario.trim().toLowerCase() === emailEmisor?.toLowerCase()) {
    return 'No puedes transferirte dinero a ti mismo.'
  }

  const montoNum = Number(monto)

  if (!monto && monto !== 0) {
    return 'Ingresa un monto válido, mayor a 0.'
  }

  if (Number.isNaN(montoNum) || montoNum <= 0) {
    return 'Ingresa un monto válido, mayor a 0.'
  }

  if (!Number.isInteger(montoNum)) {
    return 'Ingresa un monto válido, mayor a 0.'
  }

  if (typeof saldo === 'number' && montoNum > saldo) {
    return 'Saldo insuficiente para realizar la transferencia.'
  }

  return ''
}

/**
 * Verifica si un string tiene formato de email válido.
 */
export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
