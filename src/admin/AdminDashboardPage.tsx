import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Overview = {
  users_total: number; users_7d: number; users_30d: number
  pro_active: number; pending: number; past_due: number
  canceled_or_expired: number; suspended: number
  operations_total: number; operations_today: number; compressor_total: number
  generated_at: string
}

const NO_DATA = 'Sin datos todavía'

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.rpc('admin_overview').then(({ data, error }) => {
      if (error) setError(error.message)
      else setData(data as Overview)
    })
  }, [])

  if (error) return <p className="admin-error">No se pudo cargar el resumen: {error}</p>
  if (!data) return <p className="page-status">Cargando resumen...</p>

  const real: [string, number][] = [
    ['Usuarios registrados', data.users_total],
    ['Nuevos (7 días)', data.users_7d],
    ['Nuevos (30 días)', data.users_30d],
    ['Suscripciones Pro activas', data.pro_active],
    ['Pendientes de pago', data.pending],
    ['Pago fallido (past due)', data.past_due],
    ['Vencidas o canceladas', data.canceled_or_expired],
    ['Suspendidas', data.suspended],
    ['Operaciones totales', data.operations_total],
    ['Operaciones hoy', data.operations_today],
    ['Usos del compresor', data.compressor_total],
  ]
  const pending = ['Usuarios activos', 'MRR estimado', 'ARR estimado', 'Ingresos cobrados del mes', 'Errores de procesamiento']

  return (
    <>
      <h1>Resumen general</h1>
      <p className="admin-muted">Datos reales de la base de datos. Actualizado: {new Date(data.generated_at).toLocaleString('es-CO')}</p>
      <div className="admin-grid">
        {real.map(([label, value]) => (
          <div className="admin-card" key={label}>
            <span>{label}</span><strong>{value}</strong>
          </div>
        ))}
        {pending.map((label) => (
          <div className="admin-card is-empty" key={label}>
            <span>{label}</span><em>{NO_DATA}</em>
          </div>
        ))}
      </div>
      <p className="admin-muted">Pro activas incluye concesiones manuales; no equivale a ingresos. Los ingresos y el MRR requieren un proveedor de pagos; los errores, que el compresor reporte eventos.</p>
    </>
  )
}