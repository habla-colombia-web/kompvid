import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Notice { id: string; title: string; body: string; active: boolean; created_at: string }

export default function AdminNoticesPage() {
  const [rows, setRows] = useState<Notice[] | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (error) setMsg(error.message)
    else setRows((data ?? []) as Notice[])
  }
  useEffect(() => {
    void load()
    void supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true))
  }, [])

  async function create() {
    if (!title.trim()) return
    const { error } = await supabase.from('announcements').insert({ title: title.trim(), body: body.trim(), active: true })
    if (error) { setMsg('No se pudo crear: ' + error.message); return }
    setTitle(''); setBody(''); setMsg('Aviso creado.')
    void load()
  }
  async function toggle(n: Notice) {
    const { error } = await supabase.from('announcements').update({ active: !n.active }).eq('id', n.id)
    if (error) setMsg(error.message)
    else void load()
  }
  async function remove(n: Notice) {
    if (!window.confirm('Eliminar este aviso?')) return
    const { error } = await supabase.from('announcements').delete().eq('id', n.id)
    if (error) setMsg(error.message)
    else void load()
  }

  if (!rows) return <p className="page-status">{msg ?? 'Cargando...'}</p>
  return (
    <>
      <h1>Notificaciones</h1>
      <p className="admin-muted">Avisos internos de la plataforma. No se envian correos.</p>
      {msg && <p role="status">{msg}</p>}
      {isAdmin && (
        <div className="admin-card">
          <input placeholder="Titulo" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          <textarea rows={2} placeholder="Texto" value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} />
          <button type="button" onClick={() => void create()}>Crear aviso</button>
        </div>
      )}
      {rows.length === 0 && <div className="admin-card is-empty"><em>Sin datos todavia</em></div>}
      <div className="admin-grid">
        {rows.map((n) => (
          <div className="admin-card" key={n.id}>
            <span>{n.active ? 'Activo' : 'Inactivo'} - {new Date(n.created_at).toLocaleString('es-CO')}</span>
            <strong>{n.title}</strong>
            <p>{n.body}</p>
            {isAdmin && (
              <div>
                <button type="button" onClick={() => void toggle(n)}>{n.active ? 'Desactivar' : 'Activar'}</button>{' '}
                <button type="button" onClick={() => void remove(n)}>Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}