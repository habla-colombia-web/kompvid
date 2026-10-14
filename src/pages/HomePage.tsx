import { Link } from 'react-router-dom'
import './home.css'

const STEPS = [
  {
    title: 'Elige tu v\u00eddeo',
    text: 'Arrastra el archivo o selecci\u00f3nalo desde tu dispositivo.',
    more: 'Acepta MP4, WebM y MOV. Tu video se procesa en tu equipo y no se sube a ning\u00fan servidor.',
    tone: 'y',
  },
  {
    title: 'Define el tama\u00f1o',
    text: 'Deja que Kompvid lo decida o indica el tama\u00f1o que necesitas.',
    more: 'Ajusta la calidad o fija un peso en MB para enviarlo por correo, WhatsApp o redes sociales.',
    tone: 'g',
  },
  {
    title: 'Descarga el resultado',
    text: 'Compara el antes y el despu\u00e9s y guarda el archivo comprimido.',
    more: 'Revisa c\u00f3mo qued\u00f3 y descarga el archivo cuando est\u00e9s conforme. Sin marcas de agua.',
    tone: 'b',
  },
]

function StepIcon({ n }: { n: number }) {
  const p = { width: 34, height: 34, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (n === 0) return (<svg {...p}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>)
  if (n === 1) return (<svg {...p}><path d="M4 7h10" /><path d="M18 7h2" /><circle cx="16" cy="7" r="2" /><path d="M4 17h2" /><path d="M10 17h10" /><circle cx="8" cy="17" r="2" /></svg>)
  return (<svg {...p}><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>)
}
export default function HomePage() {
  return (
    <>
      <section className="hm-band" id="como-funciona">
        <div className="hm-inner">
          <h2>Cómo funciona</h2>
          <ol className="hm-how">
            {STEPS.map((step, i) => (
              <li key={step.title} className="hm-how-card">
                <span className="hm-how-icon"><StepIcon n={i} /></span>
                <h3><mark className={'hm-mark hm-mark-' + step.tone}>{step.title}</mark></h3>
                <p>{step.text}</p>
                <p>{step.more}</p>
              </li>
            ))}
          </ol>        </div>
      </section>

      <section className="hm-section">
        <div className="hm-plans">
          <div>
            <h2>Empieza gratis</h2>
            <p>Pasa a Pro cuando necesites más. Compara los planes y elige el tuyo.</p>
          </div>
          <div className="hm-plans-actions">
            <Link className="hm-btn hm-btn-solid" to="/pricing">Ver planes</Link>
            <Link className="hm-btn" to="/register">Crear cuenta</Link>
          </div>
        </div>
      </section>
    </>
  )
}