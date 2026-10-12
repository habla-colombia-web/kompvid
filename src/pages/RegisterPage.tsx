import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { signUp } from '../core/auth/authApi'
import { useAuth } from '../core/auth/useAuth'

const MIN_PASSWORD = 8

export default function RegisterPage() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  if (!loading && session) return <Navigate to="/account" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD) {
      setError('La contraseña debe tener al menos ' + MIN_PASSWORD + ' caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    const err = await signUp(email.trim(), password)
    setBusy(false)
    if (err) setError(err)
    else setSent(true)
  }

  if (sent) {
    return (
      <section className="wrap auth-page">
        <h1>Revisa tu correo</h1>
        <p className="form-ok">
          Si el correo es válido, te enviamos un enlace para confirmar tu cuenta. Después podrás iniciar sesión.
        </p>
        <div className="auth-links">
          <Link to="/login">Ir a iniciar sesión</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="wrap auth-page">
      <h1>Crear cuenta</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          Repite la contraseña
          <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
      <div className="auth-links">
        <p>¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></p>
      </div>
    </section>
  )
}