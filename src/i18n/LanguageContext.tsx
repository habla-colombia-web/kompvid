import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { es } from './es'
import { en } from './en'

export type Lang = 'es' | 'en'

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

const DICTS: Record<Lang, Record<string, string>> = { es, en }
const KEY = 'kompvid-lang'

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  tn: (id: string, fallback: string) => string
  td: (id: string, fallback: string) => string
}

const LanguageContext = createContext<Ctx | null>(null)

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch {
    /* sin almacenamiento */
  }
  return 'es'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(KEY, l)
    } catch {
      /* el cambio dura solo esta sesion */
    }
  }, [])

  const value = useMemo<Ctx>(() => {
    const d = DICTS[lang]
    return {
      lang,
      setLang,
      t: (key) => d[key] ?? es[key] ?? key,
      tn: (id, fallback) => d['tool.' + id + '.name'] ?? fallback,
      td: (id, fallback) => d['tool.' + id + '.desc'] ?? fallback,
    }
  }, [lang, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang(): Ctx {
  const c = useContext(LanguageContext)
  if (!c) throw new Error('useLang debe usarse dentro de LanguageProvider')
  return c
}