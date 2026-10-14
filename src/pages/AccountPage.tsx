import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './panel.css'
import './account.css'
import { supabase } from '../lib/supabase'
import { PLANS } from '../config/product'
import { useAuth } from '../core/auth/useAuth'
import { signOut } from '../core/auth/authApi'
import { useAccountOverview } from '../core/account/useAccountOverview'

const STATUS_LABELS: Record<string, string> = {
  free: 'Sin suscripción',
  pending: 'Pago pendiente',
  active: 'Activa',
  past_due: 'Pago vencido',
  canceled: 'Cancelada',
  expired: 'Vencida',
  suspended: 'Suspendida',
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function PasswordForm() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pw.length < 8) return setMsg({ ok: false, text: 'La contraseña debe tener al menos 8 caracteres.' })
    if (pw !== pw2) return setMsg({ ok: false, text: 'Las contraseñas no coinciden.' })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setMsg({ ok: false, text: 'No se pudo cambiar la contraseña: ' + error.message })
    setPw('')
    setPw2('')
    setMsg({ ok: true, text: 'Contraseña actualizada.' })
  }

  return (
    <form className="ac-form" onSubmit={submit}>
      <label>
        Nueva contraseña
        <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      <label>
        Repite la contraseña
        <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </label>
      <button type="submit" className="pn-btn pn-btn-solid" disabled={busy || !pw}>
        {busy ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
      {msg && <p className={msg.ok ? 'ac-ok' : 'form-error'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
    </form>
  )
}

export default function AccountPage() {
  const { user } = useAuth()
  const { overview, loaded, error } = useAccountOverview()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  if (!loaded) return <p className="page-status">Cargando...</p>

  const isPro = overview?.plan === 'pro'
  const status = overview?.status ?? 'free'
  const statusLabel = status === 'active' && !isPro ? 'Vencida' : (STATUS_LABELS[status] ?? status)
  const until = formatDate(overview?.current_period_end)
  const maxMB = isPro ? (PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB) : PLANS.free.maxFileMB
  const limit = overview?.daily_limit ?? null

  return (
    <section className="pn">
      <header className="pn-head">
        <div>
          <h1>Tu cuenta</h1>
          <p>Administra tu perfil, tu plan y tu seguridad.</p>
        </div>
        <Link to="/dashboard" className="pn-btn">Ir a mi panel</Link>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="pn-grid ac-grid">
        <div className="pn-card">
          <h2>Perfil</h2>
          <dl className="ac-list">
            <dt>Correo</dt>
            <dd>{user?.email}</dd>
            <dt>Miembro desde</dt>
            <dd>{formatDate(user?.created_at) ?? '-'}</dd>
          </dl>
        </div>

        <div className="pn-card pn-plan">
          <span className="pn-label">Tu plan</span>
          <h2>{isPro ? 'Kompvid Pro' : 'Gratis'}</h2>
          <p><span className={'pn-badge' + (isPro && status === 'active' ? ' pn-badge-ok' : '')}>{statusLabel}</span></p>
          {until && <p className="pn-sub">Acceso hasta {until}</p>}
          <p className="pn-sub">Hasta {maxMB} MB por archivo</p>
          <p className="pn-sub">{limit !== null ? limit + ' usos al día por herramienta' : 'Sin límite diario de usos'}</p>
          {!isPro && <Link to="/pricing" className="pn-btn pn-btn-solid">Ver plan Pro</Link>}
        </div>

        <div className="pn-card">
          <h2>Suscripción</h2>
          <p className="pn-sub">Aquí podrás ver tus facturas, cambiar de plan o cancelar.</p>
          <button type="button" className="pn-btn" disabled>Gestionar suscripción</button>
          <p className="pn-sub">Disponible cuando se activen los pagos.</p>
        </div>

        <div className="pn-card">
          <h2>Seguridad</h2>
          <PasswordForm />
        </div>

        <div className="pn-card">
          <h2>Sesión</h2>
          <p className="pn-sub">Cierra la sesión en este dispositivo.</p>
          <button type="button" className="pn-btn" onClick={handleSignOut}>Cerrar sesión</button>
        </div>
      </div>
    </section>
  )
}