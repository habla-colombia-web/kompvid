import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './panel.css'
import { supabase } from '../lib/supabase'
import { tools } from '../core/tools/registry'
import { plannedTools } from '../core/tools/planned'
import type { ToolCategory } from '../core/tools/types'
import { useAuth } from '../core/auth/useAuth'
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

type UsageRow = { usage_date: string; tool_id: string; used: number }

const DAYS = 30
const DAY_MS = 86400000

// usage_date se guarda en UTC, asi que los dias tambien se calculan en UTC.
function lastDays(n: number): string[] {
  const now = Date.now()
  return Array.from({ length: n }, (_, i) => new Date(now - (n - 1 - i) * DAY_MS).toISOString().slice(0, 10))
}

function shortDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function useUsageHistory() {
  const [rows, setRows] = useState<UsageRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const from = lastDays(DAYS)[0]
    supabase
      .from('usage_daily')
      .select('usage_date, tool_id, used')
      .gte('usage_date', from)
      .order('usage_date')
      .then(({ data, error }) => {
        if (!active) return
        setRows(error ? [] : ((data as UsageRow[] | null) ?? []))
        setFailed(Boolean(error))
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  return { rows, loaded, failed }
}

function CategoryIcon({ category }: { category: ToolCategory }) {
  const paths: Record<ToolCategory, ReactNode> = {
    video: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M10 9.5v5l4.5-2.5z" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-5-5L5 21" /></>,
    audio: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
    document: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[category]}</svg>
  )
}

function UsageChart({ days, values }: { days: string[]; values: number[] }) {
  const W = 720
  const H = 180
  const max = Math.max(1, ...values)
  const bw = W / values.length
  return (
    <>
      <svg className="pn-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label="Usos por día durante los últimos 30 días">
        <defs>
          <linearGradient id="pn-g" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#2fe0d6" />
            <stop offset="1" stopColor="#d63bff" />
          </linearGradient>
        </defs>
        {values.map((v, i) => {
          const h = v === 0 ? 2 : Math.max(6, (v / max) * (H - 8))
          return (
            <rect key={days[i]} x={i * bw + 3} y={H - h} width={bw - 6} height={h} rx="3"
              fill={v === 0 ? '#e1e4f0' : 'url(#pn-g)'}>
              <title>{shortDate(days[i]) + ': ' + v + (v === 1 ? ' uso' : ' usos')}</title>
            </rect>
          )
        })}
      </svg>
      <div className="pn-axis">
        <span>{shortDate(days[0])}</span>
        <span>{shortDate(days[Math.floor(days.length / 2)])}</span>
        <span>{shortDate(days[days.length - 1])}</span>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { overview, loaded, error } = useAccountOverview()
  const history = useUsageHistory()
  const days = useMemo(() => lastDays(DAYS), [])

  const stats = useMemo(() => {
    const perDay = new Map<string, number>()
    const perTool = new Map<string, number>()
    history.rows.forEach((r) => {
      perDay.set(r.usage_date, (perDay.get(r.usage_date) ?? 0) + r.used)
      perTool.set(r.tool_id, (perTool.get(r.tool_id) ?? 0) + r.used)
    })
    const values = days.map((d) => perDay.get(d) ?? 0)
    const total30 = values.reduce((a, b) => a + b, 0)
    const total7 = values.slice(-7).reduce((a, b) => a + b, 0)
    let topId: string | null = null
    let topUsed = 0
    perTool.forEach((n, id) => {
      if (n > topUsed) {
        topUsed = n
        topId = id
      }
    })
    return { values, total30, total7, topId, topUsed }
  }, [history.rows, days])

  if (!loaded) return <p className="page-status">Cargando...</p>
  if (error || !overview) {
    return (
      <section className="pn">
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
  const usedToday = overview.usage_today.reduce((a, u) => a + u.used, 0)
  const limit = overview.daily_limit
  const name = user?.email ? user.email.split('@')[0] : ''
  const topName = stats.topId ? (tools.find((t) => t.id === stats.topId)?.name ?? stats.topId) : null
  const categories = (Object.keys(CATEGORY_LABELS) as ToolCategory[]).filter(
    (c) => tools.some((t) => t.category === c) || plannedTools.some((p) => p.category === c),
  )

  return (
    <section className="pn">
      <header className="pn-head">
        <div>
          <h1>Mi panel</h1>
          <p>{name ? 'Hola, ' + name + '. ' : ''}Este es el resumen de tu uso en Kompvid.</p>
        </div>
        <Link to="/account" className="pn-btn">Mi cuenta</Link>
      </header>

      <div className="pn-grid pn-metrics">
        <div className="pn-card">
          <span className="pn-label">Usos hoy</span>
          <strong className="pn-value pn-value-grad">{usedToday}</strong>
          <span className="pn-sub">{limit !== null ? 'Límite de ' + limit + ' por herramienta' : 'Sin límite diario'}</span>
        </div>
        <div className="pn-card">
          <span className="pn-label">Últimos 7 días</span>
          <strong className="pn-value pn-value-grad">{history.loaded ? stats.total7 : '-'}</strong>
          <span className="pn-sub">usos en total</span>
        </div>
        <div className="pn-card">
          <span className="pn-label">Últimos 30 días</span>
          <strong className="pn-value pn-value-grad">{history.loaded ? stats.total30 : '-'}</strong>
          <span className="pn-sub">usos en total</span>
        </div>
        <div className="pn-card">
          <span className="pn-label">Más usada (30 días)</span>
          <strong className="pn-value pn-value-small">{topName ?? 'Sin datos'}</strong>
          <span className="pn-sub">{topName ? stats.topUsed + (stats.topUsed === 1 ? ' uso' : ' usos') : 'Aún no usas herramientas'}</span>
        </div>
      </div>

      <div className="pn-grid pn-two">
        <div className="pn-card">
          <h2>Uso de los últimos 30 días</h2>
          {history.failed && <p className="form-error" role="alert">No se pudo cargar tu historial de uso.</p>}
          {!history.failed && history.loaded && stats.total30 === 0 && (
            <p className="pn-empty">Todavía no has usado herramientas en los últimos 30 días. Cuando lo hagas, verás aquí tu actividad.</p>
          )}
          {!history.failed && history.loaded && stats.total30 > 0 && <UsageChart days={days} values={stats.values} />}
        </div>

        <div className="pn-card pn-plan" role="region" aria-labelledby="pn-plan">
          <span className="pn-label">Tu plan</span>
          <h2 id="pn-plan">{isPro ? 'Kompvid Pro' : 'Gratis'}</h2>
          <p><span className={'pn-badge' + (isPro && overview.status === 'active' ? ' pn-badge-ok' : '')}>{statusLabel}</span></p>
          {until && <p className="pn-sub">Acceso hasta {until}</p>}
          <p className="pn-sub">{limit !== null ? limit + ' usos al día por herramienta' : 'Sin límite diario de usos'}</p>
          {!isPro && <Link to="/pricing" className="pn-btn pn-btn-solid">Ver plan Pro</Link>}
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="pn-group">
          <h2 className="pn-group-title">{CATEGORY_LABELS[category]}</h2>
          <div className="pn-grid pn-tools">
            {tools
              .filter((t) => t.category === category)
              .map((tool) => {
                const row = access.get(tool.id)
                const state = row?.status ?? tool.status
                const needsPro = (row?.required_plan ?? tool.requiredPlan) === 'pro' && !isPro
                const used = usage.get(tool.id) ?? 0
                const pct = limit ? Math.min(100, (used / limit) * 100) : 0
                return (
                  <article key={tool.id} className="pn-card pn-tool">
                    <span className="pn-tool-icon"><CategoryIcon category={category} /></span>
                    <h3>{tool.name}</h3>
                    <p className="pn-sub">{tool.description}</p>
                    {state === 'development' && <span className="pn-badge">En desarrollo</span>}
                    {state === 'disabled' && <span className="pn-badge">Desactivada</span>}
                    {state === 'active' && needsPro && (
                      <Link to="/pricing" className="pn-btn">Requiere Pro</Link>
                    )}
                    {state === 'active' && !needsPro && (
                      <>
                        {limit !== null && (
                          <div>
                            <div className="pn-bar" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}
                              aria-label={'Usos de hoy en ' + tool.name}><span style={{ width: pct + '%' }} /></div>
                            <span className="pn-sub">Hoy: {used} de {limit}</span>
                          </div>
                        )}
                        {limit === null && <span className="pn-sub">Hoy: {used}</span>}
                        <Link to={tool.route} className="pn-btn pn-btn-solid">Abrir</Link>
                      </>
                    )}
                  </article>
                )
              })}
            {plannedTools
              .filter((p) => p.category === category)
              .map((p) => (
                <article key={p.id} className="pn-card pn-tool is-planned">
                  <span className="pn-tool-icon"><CategoryIcon category={category} /></span>
                  <h3>{p.name}</h3>
                  <p className="pn-sub">{p.description}</p>
                  <span className="pn-badge">En desarrollo</span>
                </article>
              ))}
          </div>
        </div>
      ))}
    </section>
  )
}