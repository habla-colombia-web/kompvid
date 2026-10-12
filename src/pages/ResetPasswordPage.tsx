import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { updatePassword } from '../core/auth/authApi'
import { useAuth } from '../core/auth/useAuth'

const MIN_PASSWORD = 8

export default function ResetPasswordPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="page-status">Cargando...</p>

  if (!session) {
    return (
      <section className="wrap auth-page">
        <h1>Enlace no válido</h1>
        <p className="form-error">El enlace venció o ya fue usado. Solicita uno nuevo.</p>
        <div className="auth-links">
          <Link to="/forgot-password">Recuperar contraseña</Link>
        </div>
      </section>
    )
  }

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
    const err = await updatePassword(password)
    setBusy(false)
    if (err) setError(err)
    else navigate('/account', { replace: true })
  }

  return (
    <section className="wrap auth-page">
      <h1>Nueva contraseña</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Contraseña nueva
          <input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          Repite la contraseña
          <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </section>
  )
}