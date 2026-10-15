import { Link } from 'react-router-dom'
import { getActiveTools } from '../core/tools/registry'
import { useLang } from '../i18n/LanguageContext'
import './hero-showcase.css'

const compressor = getActiveTools().find((t) => t.id === 'video-compressor')
const TARGET = compressor ? compressor.route : '/register'

export default function HeroShowcase() {
  const { t } = useLang()
  return (
    <section className="hs">
      <div className="hs-head">
        <h1>{t('hero.title')}</h1>
        <p>{t('hero.sub')}</p>
        <Link className="hs-cta" to={TARGET}>
          <span className="hs-plus" aria-hidden="true">+</span>
          {t('hero.cta')}
        </Link>
      </div>

      <div className="hs-stage">
        <figure className="hs-card">
          <span className="hs-tag">{t('hero.original')}</span>
          <img src="/hero-antes.webp" alt={t('hero.altBefore')} width={900} height={900} />
        </figure>

        <div className="hs-arrow" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </div>

        <figure className="hs-card">
          <span className="hs-tag">{t('hero.compressed')}</span>
          <img src="/hero-despues.webp" alt={t('hero.altAfter')} width={900} height={900} loading="lazy" />
          <span className="hs-badge">{t('hero.badge')}</span>
        </figure>
      </div>
      <p className="hs-note">{t('hero.note')}</p>
    </section>
  )
}