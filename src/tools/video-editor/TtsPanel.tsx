import { useEffect, useRef, useState } from 'react'
import { MAX_CHARS, VOICES, synthesize } from './ttsEngine'

const box = {
  width: '100%',
  padding: 10,
  font: 'inherit',
  color: 'inherit',
  background: 'rgba(128,128,128,.12)',
  border: '1px solid rgba(128,128,128,.45)',
  borderRadius: 8,
  boxSizing: 'border-box' as const,
}
const btn = {
  padding: '10px 14px',
  font: 'inherit',
  fontWeight: 700,
  border: 0,
  borderRadius: 8,
  cursor: 'pointer',
  color: '#fff',
  background: '#6d3df0',
}

export default function TtsPanel({ onFile }: { onFile: (file: File) => void }) {
  const [text, setText] = useState('')
  const [voice, setVoice] = useState(VOICES[0].id)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  async function generate() {
    setBusy(true)
    setBlob(null)
    setUrl(null)
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    try {
      const b = await synthesize(text, voice, setStatus)
      const u = URL.createObjectURL(b)
      urlRef.current = u
      setBlob(b)
      setUrl(u)
      setStatus('Listo. Escúchalo y añádelo al video.')
    } catch (err) {
      setStatus('No se pudo generar la voz: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  function add() {
    if (!blob) return
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    onFile(new File([blob], 'voz-' + stamp + '.wav', { type: 'audio/wav' }))
    setStatus('Audio enviado a Mi multimedia.')
  }

  return (
    <div style={{ display: 'grid', gap: 12, padding: 12 }}>
      <h3 style={{ margin: 0 }}>Texto a voz</h3>
      <p style={{ margin: 0, fontSize: '.85rem', opacity: 0.8 }}>
        Pega un texto y conviértelo en audio. Se genera en tu dispositivo: el texto no se envía a ningún servidor.
        La primera vez se descarga el modelo de voz, que normalmente queda guardado en tu navegador.
      </p>
      <textarea
        style={box}
        rows={7}
        maxLength={MAX_CHARS}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe o pega aquí el texto..."
        aria-label="Texto a convertir en voz"
      />
      <div style={{ fontSize: '.8rem', opacity: 0.7 }}>{text.length} / {MAX_CHARS} caracteres</div>
      <select style={box} value={voice} onChange={(e) => setVoice(e.target.value)} aria-label="Voz">
        {VOICES.map((v) => (
          <option key={v.id} value={v.id}>{v.label}</option>
        ))}
      </select>
      <button type="button" style={{ ...btn, opacity: busy || !text.trim() ? 0.6 : 1 }} disabled={busy || !text.trim()} onClick={generate}>
        {busy ? 'Trabajando...' : 'Generar voz'}
      </button>
      {status && <p role="status" style={{ margin: 0, fontSize: '.88rem' }}>{status}</p>}
      {url && (
        <>
          <audio controls src={url} style={{ width: '100%' }} />
          <button type="button" style={btn} onClick={add}>Añadir al video</button>
        </>
      )}
    </div>
  )
}