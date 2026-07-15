// src/components/Historial.test.jsx
// Tests del componente Historial (RT4).
// suscribirseAMovimientos se mockea para inyectar datos de prueba
// sin conectarse a Firestore.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Historial from './Historial'

// Mock del contexto de autenticación
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { uid: 'uid-patricia', email: 'patricia@xbank.test' },
  }),
}))

// Mock del servicio de movimientos
vi.mock('../services/movimientosService', () => ({
  suscribirseAMovimientos: vi.fn(),
}))

import { suscribirseAMovimientos } from '../services/movimientosService'

// Movimientos de prueba (no vienen de Firestore)
const MOVIMIENTOS = [
  {
    id: 'mov1',
    emisorUid: 'uid-andrea',
    receptorUid: 'uid-patricia',
    emisorEmail: 'andrea-23@bank.test',
    receptorEmail: 'patricia@xbank.test',
    monto: 5000,
    fecha: { toDate: () => new Date('2024-06-01T10:00:00') },
  },
  {
    id: 'mov2',
    emisorUid: 'uid-patricia',
    receptorUid: 'uid-andrea',
    emisorEmail: 'patricia@xbank.test',
    receptorEmail: 'andrea-23@bank.test',
    monto: 12000,
    fecha: { toDate: () => new Date('2024-06-02T10:00:00') },
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Historial', () => {
  it('muestra estado vacío cuando no hay movimientos', () => {
    // Arrange — el mock llama al callback con lista vacía
    suscribirseAMovimientos.mockImplementation((uid, onDatos) => {
      onDatos([])
      return () => {}
    })

    // Act
    render(<Historial />)

    // Assert
    expect(screen.getByText(/no tienes movimientos/i)).toBeInTheDocument()
  })

  it('renderiza los movimientos recibidos', () => {
    // Arrange
    suscribirseAMovimientos.mockImplementation((uid, onDatos) => {
      onDatos(MOVIMIENTOS)
      return () => {}
    })

    // Act
    render(<Historial />)

    // Assert — andrea-23@bank.test aparece dos veces (en mov recibido y enviado)
    expect(screen.getAllByText('andrea-23@bank.test').length).toBeGreaterThan(0)
  })

  it('distingue movimientos enviados de recibidos', () => {
    // Arrange
    suscribirseAMovimientos.mockImplementation((uid, onDatos) => {
      onDatos(MOVIMIENTOS)
      return () => {}
    })

    // Act
    render(<Historial />)

    // Assert
    expect(screen.getByText(/recibido de/i)).toBeInTheDocument()
    expect(screen.getByText(/enviado a/i)).toBeInTheDocument()
  })

  it('llama a unsubscribe al desmontar el componente', () => {
    // Arrange
    const unsubscribeMock = vi.fn()
    suscribirseAMovimientos.mockImplementation((uid, onDatos) => {
      onDatos([])
      return unsubscribeMock
    })

    // Act
    const { unmount } = render(<Historial />)
    unmount()

    // Assert
    expect(unsubscribeMock).toHaveBeenCalledTimes(1)
  })
})
