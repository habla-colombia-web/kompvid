import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { signUp } from '../core/auth/authApi'
import { useAuth } from '../core/auth/useAuth'
import { Field, StrengthMeter } from '../components/AuthParts'

const MIN_PASSWORD = 8

export default function RegisterPage() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    setBusy(true)
    const err = await signUp(email.trim(), password)
    setBusy(false)
    if (err) setError(err)
    else setSent(true)
  }

  if (sent) {
    return (
      <section className="au">
        <div className="au-card">
          <div className="au-logo"><img src="/logo.svg" alt="" width={44} height={44} /></div>
          <h1>Revisa tu correo</h1>
          <p className="au-ok">
            Si el correo es válido, te enviamos un enlace para confirmar tu cuenta. Después podrás iniciar sesión.
          </p>
          <div className="au-links"><Link to="/login">Ir a iniciar sesión</Link></div>
        </div>
      </section>
    )
  }

  return (
    <section className="au">
      <div className="au-card">
        <div className="au-logo"><img src="/logo.svg" alt="" width={44} height={44} /></div>
        <h1>Crea tu cuenta</h1>
        <p className="au-sub">Usa tu correo y una contraseña para empezar. Es gratis.</p>
        <form onSubmit={handleSubmit}>
          <Field label="Correo electrónico" icon="mail" type="email" autoComplete="email" required
            placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Contraseña" icon="lock" password autoComplete="new-password" required minLength={MIN_PASSWORD}
            placeholder="Crea una contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <StrengthMeter password={password} />
          {error && <p className="au-error" role="alert">{error}</p>}
          <button className="au-btn" type="submit" disabled={busy}>
            {busy ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <div className="au-links">
          <span>¿Ya tienes cuenta?</span>
          <Link to="/login">Iniciar sesión</Link>
        </div>
        <p className="au-foot">Al crear tu cuenta aceptas los <Link to="/terminos">Términos y condiciones</Link> y la <Link to="/privacidad">Política de privacidad</Link>.</p>
      </div>
    </section>
  )
}