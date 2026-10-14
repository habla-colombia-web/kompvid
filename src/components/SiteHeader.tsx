import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PRODUCT } from '../config/product'
import { useAuth } from '../core/auth/useAuth'
import { signOut } from '../core/auth/authApi'
import { getActiveTools } from '../core/tools/registry'
import StaffLink from '../admin/StaffLink'
import './header.css'

type Action = 'compress' | 'convert' | 'edit'

const ACTIONS: { id: Action; label: string }[] = [
  { id: 'compress', label: 'Comprimir' },
  { id: 'convert', label: 'Convertir' },
  { id: 'edit', label: 'Editar' },
]

const COMPRESS = ['video-compressor', 'video-target-size', 'image-compressor']
const CONVERT = ['video-converter', 'image-converter', 'audio-converter', 'audio-extractor']

const CATEGORY_LABELS: Record<string, string> = {
  video: 'Video',
  image: 'Imágenes',
  audio: 'Audio',
  document: 'Documentos',
}
const CATEGORY_ORDER = ['video', 'image', 'audio', 'document']

function actionOf(id: string): Action {
  if (COMPRESS.includes(id)) return 'compress'
  if (CONVERT.includes(id)) return 'convert'
  return 'edit'
}

const ITEMS = getActiveTools().map((t) => ({
  id: t.id,
  name: t.name,
  route: t.route,
  category: String(t.category),
  pro: t.requiredPlan === 'pro',
  action: actionOf(t.id),
}))

function groupsFor(action: Action) {
  const list = ITEMS.filter((i) => i.action === action)
  const cats = Array.from(new Set([...CATEGORY_ORDER, ...list.map((i) => i.category)]))
  return cats
    .map((c) => ({ category: c, label: CATEGORY_LABELS[c] ?? c, items: list.filter((i) => i.category === c) }))
    .filter((g) => g.items.length > 0)
}

const MENUS = ACTIONS.map((a) => ({ ...a, groups: groupsFor(a.id) })).filter((m) => m.groups.length > 0)

export default function SiteHeader() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<Action | null>(null)
  const headerRef = useRef<HTMLElement>(null)

  function closeAll() {
    setMenuOpen(false)
    setOpenMenu(null)
  }

  useEffect(() => {
    setMenuOpen(false)
    setOpenMenu(null)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen && !openMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setOpenMenu(null)
      }
    }
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setOpenMenu(null)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [menuOpen, openMenu])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sh" ref={headerRef}>
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
            {MENUS.map((m) => (
              <div className="sh-item" key={m.id}>
                <button
                  type="button"
                  className={'sh-link sh-trigger' + (openMenu === m.id ? ' is-open' : '')}
                  aria-expanded={openMenu === m.id}
                  aria-controls={'sh-menu-' + m.id}
                  onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                >
                  {m.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {openMenu === m.id && (
                  <div className="sh-mega" id={'sh-menu-' + m.id}>
                    {m.groups.map((g) => (
                      <div className="sh-col" key={g.category}>
                        <h3>{g.label}</h3>
                        {g.items.map((i) => (
                          <Link key={i.id} to={i.route} onClick={closeAll}>
                            {i.name}
                            {i.pro && <span className="sh-pro">Pro</span>}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link className="sh-link" to="/pricing">Precios</Link>
            <StaffLink className="sh-link" />
          </div>

          <div className="sh-actions">
            {!loading && session && (
              <>
                <Link className="sh-btn" to="/dashboard">Mi panel</Link>
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