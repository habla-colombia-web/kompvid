import { useState } from 'react'
import './App.css'
import { PRODUCT, PLANS } from './config/product'
import { tools } from './core/tools/registry'

type Billing = 'monthly' | 'yearly'

const STEPS = [
  { title: 'Elige tu video', text: 'Arrastra el archivo o selecciónalo desde tu dispositivo.' },
  { title: 'Define el tamaño', text: 'Deja que Kompvid lo decida o indica el tamaño que necesitas.' },
  { title: 'Descarga el resultado', text: 'Compara el antes y el después y guarda el archivo comprimido.' },
]

const FREE_FEATURES = [
  'Cuenta registrada requerida',
  'Compresión automática',
  'Hasta ' + PLANS.free.maxFileMB + ' MB por archivo',
  PLANS.free.dailyOperations + ' compresiones por día',
]

const PRO_PLANNED = [
  'Tamaño objetivo personalizado',
  'Ajustes avanzados de calidad y resolución',
  'Archivos de mayor tamaño, sujeto a pruebas técnicas',
  'Acceso a nuevas herramientas premium',
]

const CURRENT_YEAR = new Date().getFullYear()

const usd = (n: number) => 'US$' + n.toFixed(2)

export default function App() {
  const [billing, setBilling] = useState<Billing>('monthly')

  const yearlyIfMonthly = PLANS.pro.priceMonthly * 12
  const yearlySaving = yearlyIfMonthly - PLANS.pro.priceYearly
  const yearlySavingPct = Math.round((yearlySaving / yearlyIfMonthly) * 100)
  const price = billing === 'monthly' ? PLANS.pro.priceMonthly : PLANS.pro.priceYearly
  const hasActiveTool = tools.some((t) => t.status === 'active')

  return (
    <>
      <header className="site-header">
        <div className="wrap header-row">
          <a className="brand" href="#inicio">
            <img src="/logo.svg" alt="" width={36} height={36} />
            <span>{PRODUCT.name}</span>
          </a>
          <nav className="nav" aria-label="Principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#herramientas">Herramientas</a>
            <a href="#precios">Precios</a>
          </nav>
        </div>
      </header>

      <main id="inicio">
        <section className="wrap hero">
          <div className="hero-copy">
            <h1>{PRODUCT.tagline}</h1>
            <p className="hero-sub">{PRODUCT.subtitle}</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#precios">Ver planes</a>
              <a className="btn btn-secondary" href="#como-funciona">Cómo funciona</a>
            </div>
            {!hasActiveTool && (
              <p className="hero-note">El compresor de video está en desarrollo.</p>
            )}
          </div>

          <figure className="visual" aria-label="Ilustración de un video que reduce su tamaño">
            <div className="visual-row">
              <span className="visual-label">Original</span>
              <div className="bar bar-original" />
            </div>
            <div className="visual-row">
              <span className="visual-label">Comprimido</span>
              <div className="bar bar-compressed" />
            </div>
            <figcaption>Ilustración del concepto, sin resultados reales.</figcaption>
          </figure>
        </section>

        <section className="band" id="como-funciona">
          <div className="wrap">
            <h2>Cómo funciona</h2>
            <ol className="steps">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <span className="step-num">{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="wrap section" id="herramientas">
          <h2>Herramientas</h2>
          <ul className="tool-list">
            {tools.map((tool) => (
              <li key={tool.id}>
                <div>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                </div>
                <span className={tool.status === 'active' ? 'badge badge-on' : 'badge'}>
                  {tool.status === 'active' ? 'Disponible' : 'Próximamente'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="band band-paper" id="precios">
          <div className="wrap">
            <div className="pricing-head">
              <h2>Precios</h2>
              <div className="toggle" role="group" aria-label="Periodo de facturación">
                <button
                  type="button"
                  aria-pressed={billing === 'monthly'}
                  onClick={() => setBilling('monthly')}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  aria-pressed={billing === 'yearly'}
                  onClick={() => setBilling('yearly')}
                >
                  Anual
                </button>
              </div>
            </div>

            <div className="plans">
              <article className="plan">
                <h3>{PLANS.free.name}</h3>
                <p className="plan-price">{usd(0)}</p>
                <ul>
                  {FREE_FEATURES.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <p className="plan-note">Disponible cuando se active el registro de cuentas.</p>
              </article>

              <article className="plan plan-pro">
                <h3>{PLANS.pro.name}</h3>
                <p className="plan-price">
                  {usd(price)}
                  <span> / {billing === 'monthly' ? 'mes' : 'año'}</span>
                </p>
                <p className="plan-sub">
                  {billing === 'yearly'
                    ? 'Equivale a ' + usd(PLANS.pro.priceYearly / 12) + ' al mes. Ahorras ' + usd(yearlySaving) + ' (' + yearlySavingPct + '%) frente al plan mensual.'
                    : 'Se renueva cada mes hasta que canceles.'}
                </p>
                <p className="plan-planned">Planeado para Pro</p>
                <ul>
                  {PRO_PLANNED.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <p className="plan-note">Aún no disponible. Los pagos se activarán más adelante.</p>
              </article>
            </div>
          </div>
        </section>
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
