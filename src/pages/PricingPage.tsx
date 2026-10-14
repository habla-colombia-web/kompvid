import { useState } from 'react'
import { Link } from 'react-router-dom'
import './pricing.css'
import { PLANS } from '../config/product'
import { useAuth } from '../core/auth/useAuth'
import { tools } from '../core/tools/registry'

type Billing = 'monthly' | 'yearly'

const usd = (n: number) => 'US$' + n.toFixed(2)

function Check() {
  return (
    <svg className="pr-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="m8 12.5 3 3 5-6" />
    </svg>
  )
}

export default function PricingPage() {
  const { session } = useAuth()
  const [billing, setBilling] = useState<Billing>('monthly')

  const monthly = PLANS.pro.priceMonthly
  const yearly = PLANS.pro.priceYearly
  const saving = monthly * 12 - yearly
  const savingPct = Math.round((saving / (monthly * 12)) * 100)
  const price = billing === 'monthly' ? monthly : yearly

  const freeMB = PLANS.free.maxFileMB
  const proMB = PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB
  const freeTools = tools.filter((t) => t.requiredPlan === 'free')
  const proOnly = tools.filter((t) => t.requiredPlan === 'pro')

  const faqs = [
    { q: '¿Se suben mis archivos a un servidor?', a: 'No. Los videos, imágenes y audios se procesan en tu propio dispositivo, dentro del navegador, y no se envían a ningún servidor de Kompvid.' },
    { q: '¿Qué incluye el plan Gratis?', a: 'Necesitas una cuenta registrada. Incluye ' + freeTools.length + ' herramientas, archivos de hasta ' + freeMB + ' MB y ' + PLANS.free.dailyOperations + ' usos al día por herramienta.' },
    { q: '¿Qué pasa si llego al límite diario?', a: 'Puedes volver a usar la herramienta al día siguiente, porque el contador se reinicia cada día (hora UTC). Con Pro no tienes límite diario de usos.' },
    { q: '¿Por qué hay un límite de tamaño por archivo?', a: 'Como todo se procesa en tu dispositivo, archivos muy grandes pueden agotar la memoria del navegador. El límite depende de tu plan y de las pruebas técnicas que hacemos.' },
    { q: '¿Puedo cancelar Pro cuando quiera?', a: 'Los pagos todavía no están activos. Publicaremos las condiciones de cancelación y reembolso antes de activarlos.' },
    { q: '¿Qué métodos de pago habrá?', a: 'Aún no hay un proveedor de pagos activo. Anunciaremos los métodos disponibles cuando se activen.' },
  ]

  return (
    <section className="pr">
      <header className="pr-head">
        <h1>Planes y precios</h1>
        <p>Empieza gratis y pasa a Pro cuando necesites más herramientas y sin límite diario.</p>
        <div className="pr-toggle" role="group" aria-label="Periodo de facturación">
          <button type="button" aria-pressed={billing === 'monthly'} onClick={() => setBilling('monthly')}>Mensual</button>
          <button type="button" aria-pressed={billing === 'yearly'} onClick={() => setBilling('yearly')}>Anual</button>
        </div>
        {saving > 0 && <p className="pr-save">Con el plan anual ahorras {usd(saving)} ({savingPct}%) frente al mensual.</p>}
      </header>

      <div className="pr-plans">
        <article className="pr-plan">
          <h2>{PLANS.free.name}</h2>
          <p className="pr-price">{usd(0)}</p>
          <p className="pr-per">Para siempre</p>
          {session
            ? <Link to="/dashboard" className="pr-btn">Ir a mi panel</Link>
            : <Link to="/register" className="pr-btn">Crear cuenta gratis</Link>}
          <ul className="pr-list">
            <li><Check />{freeTools.length} herramientas incluidas</li>
            <li><Check />Hasta {freeMB} MB por archivo</li>
            <li><Check />{PLANS.free.dailyOperations} usos al día por herramienta</li>
            <li><Check />Procesamiento en tu dispositivo</li>
          </ul>
        </article>

        <article className="pr-plan pr-plan-pro">
          <span className="pr-flag">Recomendado</span>
          <h2>{PLANS.pro.name}</h2>
          <p className="pr-price">{usd(price)}<span> / {billing === 'monthly' ? 'mes' : 'año'}</span></p>
          <p className="pr-per">
            {billing === 'yearly' ? 'Equivale a ' + usd(yearly / 12) + ' al mes' : 'Se cobra cada mes'}
          </p>
          <button type="button" className="pr-btn pr-btn-solid" disabled>Disponible pronto</button>
          <p className="pr-note">Los pagos aún no están activos.</p>
          <ul className="pr-list">
            <li><Check />Todo lo del plan Gratis</li>
            <li><Check />Sin límite diario de usos</li>
            <li><Check />Hasta {proMB} MB por archivo</li>
            {proOnly.map((t) => (
              <li key={t.id}><Check />{t.name} <em>(solo Pro)</em></li>
            ))}
          </ul>
        </article>
      </div>

      <div className="pr-band">
        <h2>En todos los planes</h2>
        <ul>
          <li><Check />Tus archivos no se suben a ningún servidor</li>
          <li><Check />Sin marcas de agua añadidas por Kompvid</li>
          <li><Check />Cuenta gratuita para empezar</li>
        </ul>
      </div>

      <div className="pr-tools">
        <h2>Herramientas por plan</h2>
        <ul>
          {tools.map((t) => (
            <li key={t.id}>
              <span>{t.name}</span>
              <span className={'pr-tag' + (t.requiredPlan === 'pro' ? ' pr-tag-pro' : '')}>
                {t.requiredPlan === 'pro' ? 'Pro' : 'Gratis'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pr-faq">
        <h2>Preguntas frecuentes</h2>
        {faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}