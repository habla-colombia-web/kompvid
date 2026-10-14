import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT } from '../config/product'
import { SOCIAL } from '../config/social'
import { useAuth } from '../core/auth/useAuth'
import { getActiveTools } from '../core/tools/registry'
import './footer.css'

const YEAR = new Date().getFullYear()

function toolLabel(tool: unknown): string {
  const t = tool as { name?: string; title?: string; label?: string; id: string }
  return t.name ?? t.title ?? t.label ?? t.id
}
const TOOLS = getActiveTools().map((t) => ({ id: t.id, route: t.route, label: toolLabel(t) }))

const ICONS: { key: keyof typeof SOCIAL; label: string; svg: ReactNode }[] = [
  { key: 'facebook', label: 'Facebook', svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  { key: 'instagram', label: 'Instagram', svg: <><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z" /><path d="M17.5 6.5h.01" /></> },
  { key: 'x', label: 'X', svg: <path d="M4 4l11.7 16H20L8.3 4zM4 20l6.8-6.8M13.2 10.8 20 4" /> },
  { key: 'whatsapp', label: 'WhatsApp', svg: <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21zM9 9c0 3 3 6 6 6l1.2-1.4-2-1-1 .6c-.8-.4-1.6-1.2-2-2l.6-1-1-2L9 9z" /> },
]

function SocialIcon({ label, svg }: { label: string; svg: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={label}>{svg}</svg>
  )
}

function ColombiaFlag() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="sf-flag">
      <defs><clipPath id="co-clip"><circle cx="11" cy="11" r="11" /></clipPath></defs>
      <g clipPath="url(#co-clip)">
        <rect width="22" height="11" y="0" fill="#FCD116" />
        <rect width="22" height="5.5" y="11" fill="#003893" />
        <rect width="22" height="5.5" y="16.5" fill="#CE1126" />
      </g>
    </svg>
  )
}

export default function SiteFooter() {
  const { session, loading } = useAuth()

  return (
    <footer className="site-footer">
      <div className="sf-wrap">
        <Link className="sf-brand" to="/">
          <span className="sf-logo"><img src="/logo.svg" alt="" width={32} height={32} /></span>
          <span>{PRODUCT.name}</span>
        </Link>

        <div className="sf-cols">
          <nav aria-label="Compañía">
            <h2>Compañía</h2>
            <Link to="/">Inicio</Link>
            <Link to="/pricing">Precios</Link>
          </nav>
          <nav aria-label="Herramientas">
            <h2>Herramientas</h2>
            {TOOLS.length > 0
              ? TOOLS.map((t) => <Link key={t.id} to={t.route}>{t.label}</Link>)
              : <span className="sf-soon">Próximamente</span>}
          </nav>
          <nav aria-label="Planes">
            <h2>Planes</h2>
            <Link to="/pricing">Gratis</Link>
            <Link to="/pricing">Pro</Link>
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
            {ICONS.map(({ key, label, svg }) =>
              SOCIAL[key] ? (
                <a key={key} href={SOCIAL[key]} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <SocialIcon label={label} svg={svg} />
                </a>
              ) : (
                <span key={key} className="sf-off"><SocialIcon label={label} svg={svg} /></span>
              ),
            )}
          </div>
          <div className="sf-pills">
            <span className="sf-pill"><ColombiaFlag />Es</span>
            <span className="sf-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2v20M17 6.5C16 5 14.2 4.5 12 4.5c-2.8 0-4.5 1.3-4.5 3.2 0 4.8 9.5 2.3 9.5 7.1 0 2-2 3.7-5 3.7-2.4 0-4.4-.8-5.5-2.5" /></svg>
              USD
            </span>
          </div>
        </div>

        <div className="sf-stores">
          <div className="sf-store"><small>Próximamente en</small><strong>Google Play</strong></div>
          <div className="sf-store"><small>Próximamente en</small><strong>App Store</strong></div>
        </div>

        <div className="sf-bottom">
          <nav className="sf-legal" aria-label="Legal"><Link to="/terminos">Términos y condiciones</Link><Link to="/privacidad">Privacidad y cookies</Link><Link to="/suscripcion">Políticas de suscripción</Link></nav>
          <p>&copy; {YEAR} {PRODUCT.name}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}