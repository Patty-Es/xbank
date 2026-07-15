// src/components/Transferir.test.jsx
// Tests del formulario de transferencia (RT3).
// Firebase se mockea con vi.mock para no conectarse a Firestore real.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Transferir from './Transferir'

// Mock del contexto de autenticación
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { uid: 'uid-patricia', email: 'patricia@xbank.test' },
  }),
}))

// Mock del servicio de transferencias
vi.mock('../services/transferService', () => ({
  realizarTransferencia: vi.fn(),
}))

import { realizarTransferencia } from '../services/transferService'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Transferir — formulario', () => {
  it('renderiza el campo de correo, monto y botón de transferir', () => {
    // Arrange & Act
    render(<Transferir />)

    // Assert
    expect(screen.getByLabelText(/correo del destinatario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/monto/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /transferir/i })).toBeInTheDocument()
  })

  it('muestra error y no llama al servicio si el correo está vacío', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Transferir />)

    // Act — enviar sin completar campos
    await user.click(screen.getByRole('button', { name: /transferir/i }))

    // Assert
    expect(await screen.findByText(/ingresa el correo/i)).toBeInTheDocument()
    expect(realizarTransferencia).not.toHaveBeenCalled()
  })

  it('muestra error y no llama al servicio si el monto es inválido', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Transferir />)

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'andrea-23@bank.test')
    await user.type(screen.getByLabelText(/monto/i), '-500')
    await user.click(screen.getByRole('button', { name: /transferir/i }))

    // Assert
    expect(await screen.findByText(/monto válido/i)).toBeInTheDocument()
    expect(realizarTransferencia).not.toHaveBeenCalled()
  })

  it('no llama al servicio si el destinatario es el mismo usuario', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Transferir />)

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'patricia@xbank.test')
    await user.type(screen.getByLabelText(/monto/i), '5000')
    await user.click(screen.getByRole('button', { name: /transferir/i }))

    // Assert
    expect(await screen.findByText(/mismo/i)).toBeInTheDocument()
    expect(realizarTransferencia).not.toHaveBeenCalled()
  })

  it('llama al servicio exactamente una vez con datos correctos', async () => {
    // Arrange
    realizarTransferencia.mockResolvedValueOnce()
    const user = userEvent.setup()
    render(<Transferir />)

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'andrea-23@bank.test')
    await user.type(screen.getByLabelText(/monto/i), '10000')
    await user.click(screen.getByRole('button', { name: /transferir/i }))

    // Assert
    await waitFor(() => {
      expect(realizarTransferencia).toHaveBeenCalledTimes(1)
      expect(realizarTransferencia).toHaveBeenCalledWith({
        uidEmisor: 'uid-patricia',
        emailEmisor: 'patricia@xbank.test',
        emailDestinatario: 'andrea-23@bank.test',
        monto: 10000,
      })
    })
  })

  it('deshabilita el botón mientras procesa para evitar doble submit', async () => {
    // Arrange — el servicio tarda (promise que no resuelve inmediatamente)
    realizarTransferencia.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<Transferir />)

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'andrea-23@bank.test')
    await user.type(screen.getByLabelText(/monto/i), '10000')
    await user.click(screen.getByRole('button', { name: /transferir/i }))

    // Assert
    expect(screen.getByRole('button', { name: /procesando/i })).toBeDisabled()
  })

  it('muestra error visible si el servicio falla', async () => {
    // Arrange
    realizarTransferencia.mockRejectedValueOnce(new Error('Saldo insuficiente para realizar la transferencia.'))
    const user = userEvent.setup()
    render(<Transferir />)

    // Act
    await user.type(screen.getByLabelText(/correo del destinatario/i), 'andrea-23@bank.test')
    await user.type(screen.getByLabelText(/monto/i), '10000')
    await user.click(screen.getByRole('button', { name: /transferir/i }))

    // Assert
    expect(await screen.findByText(/saldo insuficiente/i)).toBeInTheDocument()
  })
})
