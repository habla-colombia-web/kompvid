import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'
import './home.css'

const STEPS = ['s1', 's2', 's3']

export default function HomePage() {
  const { t } = useLang()
  return (
    <>
      <section className="hm-band" id="como-funciona">
        <div className="hm-inner">
          <h2>{t('home.how')}</h2>
          <ol className="hm-steps">
            {STEPS.map((s, i) => (
              <li key={s}>
                <span className="hm-num">{i + 1}</span>
                <h3>{t('home.' + s + '.title')}</h3>
                <p>{t('home.' + s + '.text')}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="hm-section">
        <div className="hm-plans">
          <div>
            <h2>{t('home.free.title')}</h2>
            <p>{t('home.free.text')}</p>
          </div>
          <div className="hm-plans-actions">
            <Link className="hm-btn hm-btn-solid" to="/pricing">{t('home.plans')}</Link>
            <Link className="hm-btn" to="/register">{t('home.create')}</Link>
          </div>
        </div>
      </section>
    </>
  )
}