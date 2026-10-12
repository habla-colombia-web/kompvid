import { useEffect, useState, type MouseEvent } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { PRODUCT } from '../config/product'
import { useAuth } from '../core/auth/useAuth'
import { signOut } from '../core/auth/authApi'
import StaffLink from '../admin/StaffLink'

const CURRENT_YEAR = new Date().getFullYear()

export default function Layout() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  function handleNavClick(e: MouseEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest('a, button')) setMenuOpen(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap header-row">
          <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
            <img src="/logo.svg" alt="" width={36} height={36} />
            <span>{PRODUCT.name}</span>
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle-bars" aria-hidden="true" />
          </button>

          <nav
            id="main-nav"
            className={menuOpen ? 'nav nav-open' : 'nav'}
            aria-label="Principal"
            onClick={handleNavClick}
          >
            <Link to="/pricing">Precios</Link>
            <StaffLink />
            {!loading && session && (
              <>
                <Link to="/account">Cuenta</Link>
                <button type="button" className="nav-button" onClick={handleSignOut}>
                  Cerrar sesión
                </button>
              </>
            )}
            {!loading && !session && (
              <>
                <Link to="/login">Iniciar sesión</Link>
                <Link className="nav-cta" to="/register">Crear cuenta</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>{PRODUCT.name} · {PRODUCT.domain}</p>
          <p>© {CURRENT_YEAR} {PRODUCT.name}</p>
        </div>
      </footer>
    </>
  )
}