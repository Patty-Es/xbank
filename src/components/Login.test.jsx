// src/components/Login.test.jsx
// Tests del formulario de login/registro (RT4).

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login'

// Mock de los servicios de autenticación
vi.mock('../services/authService', () => ({
  iniciarSesion: vi.fn(),
  registrarUsuario: vi.fn(),
}))

// Mock del Logo para evitar problemas de SVG en jsdom
vi.mock('./Logo', () => ({
  default: () => <div>XBank</div>,
}))

import { iniciarSesion, registrarUsuario } from '../services/authService'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login — inicio de sesión', () => {
  it('renderiza el campo de correo, contraseña y botón de ingresar', () => {
    // Arrange & Act
    render(<Login />)

    // Assert
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('no llama al servicio si los campos están vacíos', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Login />)

    // Act
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    // Assert
    expect(await screen.findByText(/obligatorios/i)).toBeInTheDocument()
    expect(iniciarSesion).not.toHaveBeenCalled()
  })

  it('muestra error visible si el servicio rechaza las credenciales', async () => {
    // Arrange
    iniciarSesion.mockRejectedValueOnce({ code: 'auth/invalid-credential' })
    const user = userEvent.setup()
    render(<Login />)

    // Act
    await user.type(screen.getByLabelText(/correo/i), 'malo@test.cl')
    await user.type(screen.getByLabelText(/contraseña/i), '123456')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    // Assert
    expect(await screen.findByText(/contraseña incorrectos/i)).toBeInTheDocument()
  })

  it('llama a iniciarSesion con los datos correctos', async () => {
    // Arrange
    iniciarSesion.mockResolvedValueOnce()
    const user = userEvent.setup()
    render(<Login />)

    // Act
    await user.type(screen.getByLabelText(/correo/i), 'patricia@xbank.test')
    await user.type(screen.getByLabelText(/contraseña/i), '123456')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    // Assert
    await waitFor(() => {
      expect(iniciarSesion).toHaveBeenCalledTimes(1)
      expect(iniciarSesion).toHaveBeenCalledWith({
        email: 'patricia@xbank.test',
        password: '123456',
      })
    })
  })
})

describe('Login — registro', () => {
  it('muestra el campo nombre al cambiar a modo registro', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Login />)

    // Act
    await user.click(screen.getByRole('button', { name: /regístrate/i }))

    // Assert
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
  })

  it('no llama a registrarUsuario si el nombre está vacío en modo registro', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Login />)
    await user.click(screen.getByRole('button', { name: /regístrate/i }))

    // Act — enviar sin nombre
    await user.type(screen.getByLabelText(/correo/i), 'nuevo@xbank.test')
    await user.type(screen.getByLabelText(/contraseña/i), '123456')
    await user.click(screen.getByRole('button', { name: /registrarme/i }))

    // Assert
    expect(await screen.findByText(/nombre es obligatorio/i)).toBeInTheDocument()
    expect(registrarUsuario).not.toHaveBeenCalled()
  })
})
