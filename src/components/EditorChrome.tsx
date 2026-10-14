import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
    <>
      <button type="button" className="ed-btn" onClick={toggle}>
        {full ? 'Salir de pantalla completa' : 'Pantalla completa'}
      </button>
      <Link
        to="/dashboard"
        className="ed-btn"
        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
      >
        Salir del editor
      </Link>
    </>
  )
}