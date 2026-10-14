import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const FIELDS: [string, string][] = [['maintenance', 'Modo mantenimiento (on u off)'], ['banner', 'Mensaje del banner']]

export default function AdminSettingsPage() {
  const [vals, setVals] = useState<Record<string, string> | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    void supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true))
    void supabase.from('app_settings').select('key,value').then(({ data, error }) => {
      if (error) { setMsg(error.message); return }
      setVals(Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])))
    })
  }, [])

  async function save(key: string) {
    setMsg(null)
    const { error } = await supabase.from('app_settings').upsert({ key, value: vals?.[key] ?? '' })
    setMsg(error ? 'No se pudo guardar: ' + error.message : 'Guardado: ' + key)
  }

  if (isAdmin === null || !vals) return <p className="page-status">{msg ?? 'Cargando...'}</p>
  if (!isAdmin) return <p className="admin-error">Solo un administrador puede ver la configuracion.</p>
  return (
    <>
      <h1>Configuracion</h1>
      <p className="admin-muted">Valores guardados en la base de datos. Aun no activan cambios en el sitio por si solos.</p>
      {msg && <p role="status">{msg}</p>}
      <div className="admin-grid">
        {FIELDS.map(([k, l]) => (
          <div className="admin-card" key={k}>
            <span>{l}</span>
            <input value={vals[k] ?? ''} onChange={(e) => setVals((p) => ({ ...(p ?? {}), [k]: e.target.value }))} />
            <button type="button" onClick={() => void save(k)}>Guardar</button>
          </div>
        ))}
      </div>
    </>
  )
}