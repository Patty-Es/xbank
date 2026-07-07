import { useAuth } from './context/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="container">
        <p className="loading-text">Cargando sesión...</p>
      </div>
    )
  }

  if (!usuario) {
    return <Login />
  }

  return <Dashboard />
}