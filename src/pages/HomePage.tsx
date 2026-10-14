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

const WHY = [
  '\u00bfTienes un video demasiado pesado para enviarlo por WhatsApp o correo, o para subirlo a Instagram, Facebook o YouTube? Con Kompvid puedes reducir su peso y conservar la calidad que necesitas.',
  'Un archivo m\u00e1s liviano se sube m\u00e1s r\u00e1pido, ocupa menos espacio en tu dispositivo y se comparte sin errores por l\u00edmite de tama\u00f1o.',
  'No necesitas saber de edici\u00f3n: eliges el video, defines el tama\u00f1o y descargas el resultado. Todo se procesa en tu dispositivo, sin subir tus archivos a ning\u00fan servidor.',
]

const FAQ = [
  { q: '\u00bfMis videos se suben a alg\u00fan servidor?', a: 'No. El procesamiento ocurre en tu dispositivo, por eso tus archivos no salen de tu equipo.' },
  { q: '\u00bfQu\u00e9 formatos puedo usar?', a: 'En el compresor puedes cargar MP4, WebM y MOV. Cada herramienta indica los formatos que acepta.' },
  { q: '\u00bfPierdo calidad al comprimir?', a: 'Al reducir el peso siempre hay alg\u00fan cambio de calidad. Puedes ajustar el nivel y comparar el antes y el despu\u00e9s antes de descargar.' },
  { q: '\u00bfNecesito una cuenta?', a: 'S\u00ed, para usar las herramientas necesitas crear una cuenta gratuita.' },
  { q: '\u00bfCu\u00e1l es la diferencia entre Gratis y Pro?', a: 'El plan Gratis tiene l\u00edmites diarios y de tama\u00f1o. Pro ampl\u00eda esos l\u00edmites y habilita herramientas exclusivas. Mira el detalle en la p\u00e1gina de precios.' },
  { q: '\u00bfPuedo usarlo desde el celular?', a: 'Puedes abrirlo desde el navegador del celular, pero los videos largos pueden ir m\u00e1s lento o fallar por la memoria del equipo.' },
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

      <section className="hm-section hm-why" id="por-que-reducir">
        <h2>{'\u00bfPor qu\u00e9 reducir el tama\u00f1o de un video?'}</h2>
        {WHY.map((t) => (
          <p key={t.slice(0, 24)}>{t}</p>
        ))}
      </section>

      <section className="hm-section hm-faq" id="preguntas-frecuentes">
        <h2>Preguntas frecuentes</h2>
        {FAQ.map((f) => (
          <details key={f.q} className="hm-faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
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