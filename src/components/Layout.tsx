import { Link, Outlet, useNavigate } from 'react-router-dom'
import { PRODUCT } from '../config/product'
import { useAuth } from '../core/auth/useAuth'
import { signOut } from '../core/auth/authApi'

const CURRENT_YEAR = new Date().getFullYear()

export default function Layout() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap header-row">
          <Link className="brand" to="/">
            <img src="/logo.svg" alt="" width={36} height={36} />
            <span>{PRODUCT.name}</span>
          </Link>
          <nav className="nav" aria-label="Principal">
            <Link to="/pricing">Precios</Link>
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