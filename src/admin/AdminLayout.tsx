import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { StaffRole } from './AdminRoute'
import { ADMIN_NAV } from './nav'
import Icon from './Icon'
import './admin.css'

type Theme = 'dark' | 'light'
const THEME_KEY = 'kompvid-admin-theme'

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export default function AdminLayout() {
  const { role } = useOutletContext<{ role: StaffRole }>()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(readTheme)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* sin almacenamiento: el cambio solo dura esta sesion */
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const items = ADMIN_NAV.filter((i) => !i.adminOnly || role === 'admin')

  return (
    <div className="admin-shell" data-theme={theme}>
      <header className="admin-topbar">
        <button
          type="button"
          className="admin-burger"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
        <Link to="/" className="admin-logo" aria-label="Kompvid, ir al sitio">
          <img src="/logo.svg" alt="" width={32} height={32} />
          <span>Kompvid</span>
        </Link>
        <span className="admin-role">{role === 'admin' ? 'Administrador' : 'Soporte'}</span>
        <button
          type="button"
          className="admin-theme"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a fondo blanco' : 'Cambiar a fondo oscuro'}
          title={theme === 'dark' ? 'Fondo blanco' : 'Fondo oscuro'}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </header>

      <aside id="admin-sidebar" className={'admin-sidebar' + (open ? ' is-open' : '')}>
        <div className="admin-brand">Panel de administración</div>
        <nav aria-label="Administración">
          {items.map((i) => (
            <NavLink key={i.path} to={i.path ? `/admin/${i.path}` : '/admin'} end={!i.path}
              className={({ isActive }) => 'admin-link' + (isActive ? ' is-active' : '')}>
              <Icon name={i.icon} />{i.label}
            </NavLink>
          ))}
          <button type="button" className="admin-link admin-logout" onClick={signOut}>
            <Icon name="logout" />Cerrar sesión
          </button>
        </nav>
      </aside>
      {open && <div className="admin-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <main className="admin-main">
        <Outlet context={{ role }} />
      </main>
    </div>
  )
}