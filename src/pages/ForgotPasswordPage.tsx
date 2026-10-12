import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../core/auth/authApi'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await requestPasswordReset(email.trim())
    setBusy(false)
    if (err) setError(err)
    else setSent(true)
  }

  return (
    <section className="wrap auth-page">
      <h1>Recuperar contraseña</h1>
      {sent ? (
        <p className="form-ok">
          Si el correo está registrado, recibirás un enlace para crear una contraseña nueva.
        </p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      )}
      <div className="auth-links">
        <Link to="/login">Volver a iniciar sesión</Link>
      </div>
    </section>
  )
}