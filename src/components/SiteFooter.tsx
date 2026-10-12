import { Link } from 'react-router-dom'
import { PRODUCT } from '../config/product'
import { SOCIAL } from '../config/social'
import { useAuth } from '../core/auth/useAuth'
import './footer.css'

const YEAR = new Date().getFullYear()

const ICONS: Record<string, { label: string; svg: React.ReactNode }> = {
  facebook: { label: 'Facebook', svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  instagram: { label: 'Instagram', svg: <><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z" /><path d="M17.5 6.5h.01" /></> },
  x: { label: 'X', svg: <path d="M4 4l11.7 16H20L8.3 4zM4 20l6.8-6.8M13.2 10.8 20 4" /> },
  whatsapp: { label: 'WhatsApp', svg: <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21zM9 9c0 3 3 6 6 6l1.2-1.4-2-1-1 .6c-.8-.4-1.6-1.2-2-2l.6-1-1-2L9 9z" /> },
}

export default function SiteFooter() {
  const { session, loading } = useAuth()
  const socials = Object.entries(SOCIAL).filter(([, url]) => url)

  return (
    <footer className="site-footer">
      <div className="sf-wrap">
        <Link className="sf-brand" to="/">
          <span className="sf-logo"><img src="/logo.svg" alt="" width={32} height={32} /></span>
          <span>{PRODUCT.name}</span>
        </Link>

        <div className="sf-cols">
          <nav aria-label="Producto">
            <h2>Producto</h2>
            <Link to="/">Inicio</Link>
            <Link to="/pricing">Precios</Link>
          </nav>
          <nav aria-label="Cuenta">
            <h2>Cuenta</h2>
            {!loading && session ? (
              <Link to="/account">Mi cuenta</Link>
            ) : (
              <>
                <Link to="/login">Iniciar sesión</Link>
                <Link to="/register">Crear cuenta</Link>
              </>
            )}
          </nav>
        </div>

        <div className="sf-row">
          <div className="sf-social">
            {socials.map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={ICONS[key].label}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[key].svg}</svg>
              </a>
            ))}
          </div>
          <div className="sf-pills">
            <span className="sf-pill">Es</span>
            <span className="sf-pill">USD</span>
          </div>
        </div>

        <div className="sf-stores">
          <div className="sf-store"><small>Próximamente en</small><strong>Google Play</strong></div>
          <div className="sf-store"><small>Próximamente en</small><strong>App Store</strong></div>
        </div>

        <div className="sf-bottom">
          <p>&copy; {YEAR} {PRODUCT.name}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}