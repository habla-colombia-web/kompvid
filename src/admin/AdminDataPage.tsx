import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Kind = 'usuarios' | 'planes' | 'uso' | 'auditoria'
type Row = Record<string, unknown>

const CFG: Record<Kind, { title: string; rpc: string; cols: [string, string][] }> = {
  usuarios: { title: 'Usuarios', rpc: 'admin_users', cols: [['email', 'Correo'], ['created_at', 'Registro'], ['plan', 'Plan'], ['status', 'Estado']] },
  planes: { title: 'Planes y suscripciones', rpc: 'admin_plans', cols: [['email', 'Correo'], ['plan', 'Plan'], ['billing_period', 'Periodo'], ['status', 'Estado'], ['provider', 'Proveedor'], ['current_period_end', 'Vence']] },
  uso: { title: 'Uso y procesamiento', rpc: 'admin_usage', cols: [['tool_id', 'Herramienta'], ['total', 'Total'], ['today', 'Hoy'], ['users', 'Usuarios']] },
  auditoria: { title: 'Auditoria', rpc: 'admin_audit', cols: [['created_at', 'Fecha'], ['action', 'Accion'], ['resource_type', 'Recurso'], ['resource_id', 'Id'], ['result', 'Resultado'], ['actor_id', 'Actor']] },
}

function show(v: unknown): string {
  if (v === null || v === undefined || v === '') return '-'
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s).toLocaleString('es-CO')
  return s
}

export default function AdminDataPage({ kind }: { kind: Kind }) {
  const cfg = CFG[kind]
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let on = true
    void supabase.rpc(cfg.rpc).then(({ data, error: err }) => {
      if (!on) return
      if (err) setError(err.message)
      else setRows(Array.isArray(data) ? (data as Row[]) : [])
    })
    return () => {
      on = false
    }
  }, [cfg.rpc])

  if (error) return <p className="admin-error">No se pudo cargar: {error}</p>
  if (!rows) return <p className="page-status">Cargando...</p>
  return (
    <>
      <h1>{cfg.title}</h1>
      <p className="admin-muted">Datos reales de la base de datos. Filas: {rows.length}.</p>
      {rows.length === 0 ? (
        <div className="admin-card is-empty"><em>Sin datos todavia</em></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>{cfg.cols.map(([k, l]) => <th key={k} style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc' }}>{l}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>{cfg.cols.map(([k]) => <td key={k} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{show(r[k])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}