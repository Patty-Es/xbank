// src/utils/validaciones.test.js
// Tests de lógica pura para las validaciones de transferencia.
// No se mockea nada: son funciones puras que no dependen de Firebase ni de React.

import { describe, it, expect } from 'vitest'
import { validarTransferencia, esEmailValido } from './validaciones'

const BASE = {
  emailDestinatario: 'andrea-23@bank.test',
  monto: 10000,
  emailEmisor: 'patricia@xbank.test',
  saldo: 50000,
}

describe('validarTransferencia', () => {
  // ── Caso feliz ──────────────────────────────────────────────────────────
  it('acepta una transferencia válida', () => {
    // Arrange & Act
    const error = validarTransferencia(BASE)
    // Assert
    expect(error).toBe('')
  })

  // ── Destinatario ────────────────────────────────────────────────────────
  it('rechaza destinatario vacío', () => {
    const error = validarTransferencia({ ...BASE, emailDestinatario: '' })
    expect(error).toBeTruthy()
  })

  it('rechaza destinatario con formato de email inválido', () => {
    const error = validarTransferencia({ ...BASE, emailDestinatario: 'no-es-un-email' })
    expect(error).toBeTruthy()
  })

  it('rechaza transferencia a uno mismo', () => {
    const error = validarTransferencia({
      ...BASE,
      emailDestinatario: 'patricia@xbank.test',
    })
    expect(error).toMatch(/mismo/i)
  })

  // ── Monto ────────────────────────────────────────────────────────────────
  it('rechaza monto negativo', () => {
    const error = validarTransferencia({ ...BASE, monto: -1000 })
    expect(error).toBeTruthy()
  })

  it('rechaza monto igual a cero', () => {
    const error = validarTransferencia({ ...BASE, monto: 0 })
    expect(error).toBeTruthy()
  })

  it('rechaza monto no numérico', () => {
    const error = validarTransferencia({ ...BASE, monto: 'abc' })
    expect(error).toBeTruthy()
  })

  it('rechaza monto con decimales', () => {
    const error = validarTransferencia({ ...BASE, monto: 1000.5 })
    expect(error).toBeTruthy()
  })

  // ── Saldo ────────────────────────────────────────────────────────────────
  it('rechaza monto mayor al saldo disponible', () => {
    const error = validarTransferencia({ ...BASE, monto: 99999, saldo: 50000 })
    expect(error).toMatch(/saldo/i)
  })

  it('acepta monto exactamente igual al saldo disponible', () => {
    const error = validarTransferencia({ ...BASE, monto: 50000, saldo: 50000 })
    expect(error).toBe('')
  })
})

describe('esEmailValido', () => {
  it('acepta un email con formato correcto', () => {
    expect(esEmailValido('usuario@banco.cl')).toBe(true)
  })

  it('rechaza un email sin @', () => {
    expect(esEmailValido('usuariobancocl')).toBe(false)
  })

  it('rechaza un email sin dominio', () => {
    expect(esEmailValido('usuario@')).toBe(false)
  })

  it('rechaza una cadena vacía', () => {
    expect(esEmailValido('')).toBe(false)
  })
})
