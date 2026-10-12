import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { StaffRole } from './AdminRoute'
import { ADMIN_NAV } from './nav'
import Icon from './Icon'
import './admin.css'

export default function AdminLayout() {
  const { role } = useOutletContext<{ role: StaffRole }>()
  const [open, setOpen] = useState(false)
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

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const items = ADMIN_NAV.filter((i) => !i.adminOnly || role === 'admin')

  return (
    <div className="admin-shell">
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
        <strong>Kompvid · Admin</strong>
        <span className="admin-role">{role === 'admin' ? 'Administrador' : 'Soporte'}</span>
      </header>

      <aside id="admin-sidebar" className={'admin-sidebar' + (open ? ' is-open' : '')}>
        <div className="admin-brand">Kompvid<small>Panel de administración</small></div>
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