import { useEffect, useRef, useState } from 'react'
import { LANGS, useLang } from '../i18n/LanguageContext'

function Flag({ code }: { code: string }) {
  if (code === 'es') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <defs><clipPath id="ls-es"><circle cx="11" cy="11" r="11" /></clipPath></defs>
        <g clipPath="url(#ls-es)">
          <rect width="22" height="22" fill="#AA151B" />
          <rect width="22" height="11" y="5.5" fill="#F1BF00" />
        </g>
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  )
}

export default function LanguageSelect() {
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <div className="ls" ref={ref}>
      <button type="button" className="sf-pill ls-btn" aria-haspopup="listbox" aria-expanded={open}
        aria-label={t('footer.language')} onClick={() => setOpen((v) => !v)}>
        <Flag code={lang} />
        {lang === 'es' ? 'Es' : 'En'}
      </button>
      {open && (
        <ul className="ls-list" role="listbox" aria-label={t('footer.language')}>
          {LANGS.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button type="button" onClick={() => { setLang(l.code); setOpen(false) }}>
                <Flag code={l.code} />
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}