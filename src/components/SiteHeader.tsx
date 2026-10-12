import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PRODUCT } from '../config/product'
import { useAuth } from '../core/auth/useAuth'
import { signOut } from '../core/auth/authApi'
import { getActiveTools } from '../core/tools/registry'
import StaffLink from '../admin/StaffLink'
import './header.css'

function toolLabel(tool: unknown): string {
  const t = tool as { name?: string; title?: string; label?: string; id: string }
  return t.name ?? t.title ?? t.label ?? t.id
}

const TOOLS = getActiveTools().map((t) => ({ id: t.id, route: t.route, label: toolLabel(t) }))

export default function SiteHeader() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const toolsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
    setToolsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen && !toolsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setToolsOpen(false)
      }
    }
    const onClick = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen, toolsOpen])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sh">
      <div className="sh-row">
        <Link className="sh-brand" to="/">
          <img src="/logo.svg" alt="" width={36} height={36} />
          <span>{PRODUCT.name}</span>
        </Link>

        <button
          type="button"
          className="sh-burger"
          aria-expanded={menuOpen}
          aria-controls="sh-nav"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <nav id="sh-nav" className={'sh-nav' + (menuOpen ? ' is-open' : '')} aria-label="Principal">
          <div className="sh-links">
            {TOOLS.length > 0 && (
              <div className="sh-tools" ref={toolsRef}>
                <button
                  type="button"
                  className="sh-link sh-tools-btn"
                  aria-expanded={toolsOpen}
                  aria-haspopup="true"
                  onClick={() => setToolsOpen((v) => !v)}
                >
                  Herramientas
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {toolsOpen && (
                  <div className="sh-menu">
                    {TOOLS.map((t) => (
                      <Link key={t.id} to={t.route}>{t.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Link className="sh-link" to="/pricing">Precios</Link>
            <StaffLink className="sh-link" />
          </div>

          <div className="sh-actions">
            {!loading && session && (
              <>
                <Link className="sh-btn" to="/account">Cuenta</Link>
                <button type="button" className="sh-btn" onClick={handleSignOut}>Cerrar sesión</button>
              </>
            )}
            {!loading && !session && (
              <>
                <Link className="sh-btn" to="/login">Iniciar sesión</Link>
                <Link className="sh-btn sh-btn-primary" to="/register">Crear cuenta</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}