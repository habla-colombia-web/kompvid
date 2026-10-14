import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Ticket { id: string; subject: string; status: string; staff_note: string | null; created_at: string }
const ST: Record<string, string> = { open: 'Abierto', in_progress: 'En curso', closed: 'Cerrado' }

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState<Ticket[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('support_tickets').select('id,subject,status,staff_note,created_at').order('created_at', { ascending: false })
    setRows((data ?? []) as Ticket[])
  }
  useEffect(() => { void load() }, [])

  async function send() {
    setMsg(null)
    if (!subject.trim() || !message.trim()) { setMsg('Escribe el asunto y el mensaje.'); return }
    const { error } = await supabase.from('support_tickets').insert({ subject: subject.trim(), message: message.trim() })
    if (error) { setMsg('No se pudo enviar. Inicia sesion e intentalo de nuevo.'); return }
    setSubject(''); setMessage(''); setMsg('Mensaje enviado. Te responderemos pronto.')
    void load()
  }

  return (
    <section className="wrap tool-page">
      <h1 className="page-title">Soporte</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
        <input placeholder="Asunto" value={subject} maxLength={120} onChange={(e) => setSubject(e.target.value)} />
        <textarea rows={5} placeholder="Cuentanos que pasa" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} />
        <button type="button" className="btn" onClick={() => void send()}>Enviar</button>
        {msg && <p role="status">{msg}</p>}
      </div>
      <h2>Tus mensajes</h2>
      {rows.length === 0 && <p>Aun no has enviado mensajes.</p>}
      {rows.map((t) => (
        <p key={t.id}><strong>{t.subject}</strong> - {ST[t.status] ?? t.status}{t.staff_note ? '. Respuesta: ' + t.staff_note : ''}</p>
      ))}
    </section>
  )
}