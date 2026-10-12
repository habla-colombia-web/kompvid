import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PLANS } from '../config/product'
import { useAuth } from '../core/auth/useAuth'

type Billing = 'monthly' | 'yearly'

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

const usd = (n: number) => 'US$' + n.toFixed(2)

export default function PricingPage() {
  const { session } = useAuth()
  const [billing, setBilling] = useState<Billing>('monthly')

  const yearlyIfMonthly = PLANS.pro.priceMonthly * 12
  const yearlySaving = yearlyIfMonthly - PLANS.pro.priceYearly
  const yearlySavingPct = Math.round((yearlySaving / yearlyIfMonthly) * 100)
  const price = billing === 'monthly' ? PLANS.pro.priceMonthly : PLANS.pro.priceYearly

  return (
    <section className="band band-paper">
      <div className="wrap">
        <div className="pricing-head">
          <h1 className="page-title">Precios</h1>
          <div className="toggle" role="group" aria-label="Periodo de facturación">
            <button type="button" aria-pressed={billing === 'monthly'} onClick={() => setBilling('monthly')}>
              Mensual
            </button>
            <button type="button" aria-pressed={billing === 'yearly'} onClick={() => setBilling('yearly')}>
              Anual
            </button>
          </div>
        </div>

        <div className="plans">
          <article className="plan">
            <h2>{PLANS.free.name}</h2>
            <p className="plan-price">{usd(0)}</p>
            <ul>
              {FREE_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="plan-note">
              Se incluye al crear tu cuenta.{' '}
              {!session && <Link to="/register">Crear cuenta</Link>}
            </p>
          </article>

          <article className="plan plan-pro">
            <h2>{PLANS.pro.name}</h2>
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
  )
}