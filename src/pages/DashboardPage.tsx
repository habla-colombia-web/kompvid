import { Link } from 'react-router-dom'
import './dashboard.css'
import { tools } from '../core/tools/registry'
import { plannedTools } from '../core/tools/planned'
import type { ToolCategory } from '../core/tools/types'
import { useAccountOverview } from '../core/account/useAccountOverview'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  video: 'Video',
  image: 'Imágenes',
  audio: 'Audio',
  document: 'Documentos',
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

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DashboardPage() {
  const { overview, loaded, error } = useAccountOverview()

  if (!loaded) return <p className="page-status">Cargando...</p>
  if (error || !overview) {
    return (
      <section className="wrap dashboard">
        <p className="form-error" role="alert">{error ?? 'No se pudo cargar tu información.'}</p>
      </section>
    )
  }

  const isPro = overview.plan === 'pro'
  const until = formatDate(overview.current_period_end)
  const statusLabel =
    overview.status === 'active' && !isPro ? 'Vencida' : (STATUS_LABELS[overview.status] ?? overview.status)
  const access = new Map(overview.tools.map((t) => [t.tool_id, t]))
  const usage = new Map(overview.usage_today.map((u) => [u.tool_id, u.used]))
  const categories = (Object.keys(CATEGORY_LABELS) as ToolCategory[]).filter(
    (c) => tools.some((t) => t.category === c) || plannedTools.some((p) => p.category === c),
  )

  return (
    <section className="wrap dashboard">
      <h1>Mi panel</h1>

      <div className="dash-card" role="region" aria-labelledby="dash-plan">
        <h2 id="dash-plan">Tu plan</h2>
        <p className="dash-plan-name">{isPro ? 'Kompvid Pro' : 'Gratis'}</p>
        <p>Estado: {statusLabel}</p>
        {until && <p>Acceso hasta: {until}</p>}
        {overview.daily_limit !== null && (
          <p>Límite: {overview.daily_limit} usos al día por herramienta</p>
        )}
        {!isPro && <Link to="/pricing" className="dash-link">Ver plan Pro</Link>}
      </div>

      {categories.map((category) => (
        <div key={category} className="dash-group">
          <h2>{CATEGORY_LABELS[category]}</h2>
          <div className="dash-grid">
            {tools
              .filter((t) => t.category === category)
              .map((tool) => {
                const row = access.get(tool.id)
                const state = row?.status ?? tool.status
                const needsPro = (row?.required_plan ?? tool.requiredPlan) === 'pro' && !isPro
                const used = usage.get(tool.id) ?? 0
                return (
                  <article key={tool.id} className="dash-card">
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                    {state === 'development' && <span className="dash-tag">En desarrollo</span>}
                    {state === 'disabled' && <span className="dash-tag">Desactivada</span>}
                    {state === 'active' && needsPro && (
                      <Link to="/pricing" className="dash-link">Requiere Pro</Link>
                    )}
                    {state === 'active' && !needsPro && (
                      <>
                        <p className="dash-usage">
                          Hoy: {used}
                          {overview.daily_limit !== null ? ` de ${overview.daily_limit}` : ''}
                        </p>
                        <Link to={tool.route} className="dash-link">Abrir</Link>
                      </>
                    )}
                  </article>
                )
              })}
            {plannedTools
              .filter((p) => p.category === category)
              .map((p) => (
                <article key={p.id} className="dash-card is-planned">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <span className="dash-tag">En desarrollo</span>
                </article>
              ))}
          </div>
        </div>
      ))}
    </section>
  )
}