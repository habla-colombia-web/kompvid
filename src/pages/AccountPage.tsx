import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { useAuth } from '../core/auth/useAuth'

interface Subscription {
  plan: string
  status: string
  current_period_end: string | null
}

const STATUS_LABELS: Record<string, string> = {
  free: 'Sin suscripción',
  pending: 'Pago pendiente',
  active: 'Activa',
  past_due: 'Pago vencido',
  canceled: 'Cancelada',
  expired: 'Vencida',
  suspended: 'Suspendida',
}

export default function AccountPage() {
  const { user } = useAuth()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return
        setSub((data as Subscription | null) ?? null)
        setError(queryError ? 'No se pudo cargar tu suscripción.' : null)
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  const planName = sub?.plan === 'pro' ? 'Kompvid Pro' : 'Gratis'

  return (
    <section className="wrap auth-page">
      <h1>Tu cuenta</h1>
      <dl className="account-list">
        <dt>Correo</dt>
        <dd>{user?.email}</dd>
        <dt>Plan</dt>
        <dd>{loaded ? planName : 'Cargando...'}</dd>
        <dt>Estado</dt>
        <dd>{loaded && sub ? (STATUS_LABELS[sub.status] ?? sub.status) : '-'}</dd>
      </dl>
      <p><Link to="/dashboard">Ir a mi panel</Link></p>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  )
}