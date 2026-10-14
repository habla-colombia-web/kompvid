import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'

const wrap: CSSProperties = {
  position: 'fixed',
  right: 12,
  bottom: 12,
  zIndex: 1000,
  display: 'flex',
  gap: 8,
}
const pill: CSSProperties = {
  padding: '8px 14px',
  font: 'inherit',
  fontSize: '.85rem',
  fontWeight: 600,
  color: '#fff',
  background: 'rgba(10,0,48,.85)',
  border: '1px solid rgba(255,255,255,.25)',
  borderRadius: 999,
  cursor: 'pointer',
  textDecoration: 'none',
}

export default function EditorChrome() {
  const [full, setFull] = useState(Boolean(document.fullscreenElement))

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }, [])

  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      /* el navegador no lo permitio */
    }
  }

  return (
    <div style={wrap}>
      <button type="button" style={pill} onClick={toggle}>
        {full ? 'Salir de pantalla completa' : 'Pantalla completa'}
      </button>
      <Link to="/dashboard" style={pill}>Salir del editor</Link>
    </div>
  )
}