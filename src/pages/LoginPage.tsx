import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { signIn } from '../core/auth/authApi'
import { useAuth } from '../core/auth/useAuth'
import { Field } from '../components/AuthParts'

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
    <section className="au">
      <div className="au-card">
        <div className="au-logo"><img src="/logo.svg" alt="" width={44} height={44} /></div>
        <h1>Iniciar sesión</h1>
        <p className="au-sub">Entra a tu cuenta para usar tus herramientas.</p>
        <form onSubmit={handleSubmit}>
          <Field label="Correo electrónico" icon="mail" type="email" autoComplete="email" required
            placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Contraseña" icon="lock" password autoComplete="current-password" required
            placeholder="Introduce tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="au-error" role="alert">{error}</p>}
          <button className="au-btn" type="submit" disabled={busy}>
            {busy ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
        <div className="au-links">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <Link to="/register">Crear cuenta</Link>
        </div>
        <p className="au-foot">Tus archivos se procesan en tu dispositivo.</p>
      </div>
    </section>
  )
}