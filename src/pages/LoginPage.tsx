import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { signIn } from '../core/auth/authApi'
import { useAuth } from '../core/auth/useAuth'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/account'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && session) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await signIn(email.trim(), password)
    setBusy(false)
    if (err) setError(err)
    else navigate(from, { replace: true })
  }

  return (
    <section className="wrap auth-page">
      <h1>Iniciar sesión</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
      <div className="auth-links">
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        <p>¿No tienes cuenta? <Link to="/register">Crear cuenta</Link></p>
      </div>
    </section>
  )
}