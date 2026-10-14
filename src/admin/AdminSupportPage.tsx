import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Ticket { id: string; user_id: string; subject: string; message: string; status: string; staff_note: string | null; created_at: string }
const ST: Record<string, string> = { open: 'Abierto', in_progress: 'En curso', closed: 'Cerrado' }

export default function AdminSupportPage() {
  const [rows, setRows] = useState<Ticket[] | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) setMsg(error.message)
    else setRows((data ?? []) as Ticket[])
  }
  useEffect(() => { void load() }, [])

  async function save(t: Ticket) {
    setMsg(null)
    const { error } = await supabase.from('support_tickets').update({ status: t.status, staff_note: t.staff_note }).eq('id', t.id)
    setMsg(error ? 'No se pudo guardar: ' + error.message : 'Guardado.')
  }
  function patch(id: string, p: Partial<Ticket>) {
    setRows((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, ...p } : r)))
  }

  if (!rows) return <p className="page-status">{msg ?? 'Cargando...'}</p>
  return (
    <>
      <h1>Soporte</h1>
      <p className="admin-muted">Tickets reales enviados por usuarios. Total: {rows.length}.</p>
      {msg && <p role="status">{msg}</p>}
      {rows.length === 0 && <div className="admin-card is-empty"><em>Sin datos todavia</em></div>}
      <div className="admin-grid">
        {rows.map((t) => (
          <div className="admin-card" key={t.id}>
            <span>{new Date(t.created_at).toLocaleString('es-CO')} - usuario {t.user_id.slice(0, 8)}</span>
            <strong>{t.subject}</strong>
            <p>{t.message}</p>
            <select value={t.status} onChange={(e) => patch(t.id, { status: e.target.value })}>
              {Object.entries(ST).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <textarea rows={2} placeholder="Nota interna" value={t.staff_note ?? ''} onChange={(e) => patch(t.id, { staff_note: e.target.value })} />
            <button type="button" onClick={() => void save(t)}>Guardar</button>
          </div>
        ))}
      </div>
    </>
  )
}