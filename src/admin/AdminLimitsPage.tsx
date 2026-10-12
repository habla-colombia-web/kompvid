import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LIMIT_FIELDS, loadEditorLimits, type LimitRow } from '../tools/video-editor/limitsService'

export default function AdminLimitsPage() {
  const [rows, setRows] = useState<LimitRow[] | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let on = true
    void supabase.rpc('is_admin').then(({ data }) => {
      if (on) setIsAdmin(data === true)
    })
    void loadEditorLimits().then((r) => {
      if (!on) return
      if (r.error) setMsg(r.error)
      else setRows(r.rows)
    })
    return () => {
      on = false
    }
  }, [])

  function setField(plan: string, key: string, value: number) {
    setRows((prev) => (prev ?? []).map((r) => (r.plan === plan ? { ...r, [key]: value } : r)))
  }

  async function save(row: LimitRow) {
    setMsg(null)
    const { plan, ...limits } = row
    const { error } = await supabase.rpc('set_editor_limits', { p_plan: plan, p_limits: limits })
    setMsg(error ? 'No se pudo guardar: ' + error.message : 'Limites del plan ' + plan + ' guardados.')
  }

  if (isAdmin === null || rows === null) return <p className="page-status">{msg ?? 'Cargando...'}</p>
  if (!isAdmin) return <p className="admin-error">Solo un administrador puede editar los limites.</p>

  return (
    <>
      <h1>Herramientas: limites del editor de video</h1>
      <p className="admin-muted">Los limites se aplican en el navegador del editor. La cuota diaria sigue controlada por el servidor.</p>
      {msg && <p role="status">{msg}</p>}
      <div className="admin-grid">
        {rows.map((row) => (
          <div className="admin-card" key={row.plan}>
            <span>Plan {row.plan === 'pro' ? 'Pro' : 'Gratis'}</span>
            {LIMIT_FIELDS.map(([key, label]) => (
              <label key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, margin: '6px 0' }}>
                {label}
                <input
                  type="number"
                  value={row[key]}
                  onChange={(e) => setField(row.plan, key, Number(e.target.value))}
                  style={{ width: 90 }}
                />
              </label>
            ))}
            <button type="button" onClick={() => void save(row)}>Guardar</button>
          </div>
        ))}
      </div>
    </>
  )
}