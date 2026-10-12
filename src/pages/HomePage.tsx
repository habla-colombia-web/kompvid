import { Link } from 'react-router-dom'
import { tools } from '../core/tools/registry'
import './home.css'

const STEPS = [
  { title: 'Elige tu video', text: 'Arrastra el archivo o selecciónalo desde tu dispositivo.' },
  { title: 'Define el tamaño', text: 'Deja que Kompvid lo decida o indica el tamaño que necesitas.' },
  { title: 'Descarga el resultado', text: 'Compara el antes y el después y guarda el archivo comprimido.' },
]

function ToolIcon({ id }: { id: string }) {
  const isImage = id.includes('background') || id.includes('image')
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {isImage ? (
        <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-5-5L5 21" /></>
      ) : (
        <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M10 9.5v5l4.5-2.5z" /></>
      )}
    </svg>
  )
}

export default function HomePage() {
  return (
    <>
      <section className="hm-section" id="herramientas">
        <h2>Herramientas</h2>
        <ul className="hm-tools">
          {tools.map((tool) => (
            <li key={tool.id} className="hm-tool">
              <span className="hm-tool-icon"><ToolIcon id={tool.id} /></span>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
              {tool.status === 'active' ? (
                <Link className="hm-btn" to={tool.route}>Abrir</Link>
              ) : (
                <span className="hm-soon">Próximamente</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="hm-band" id="como-funciona">
        <div className="hm-inner">
          <h2>Cómo funciona</h2>
          <ol className="hm-steps">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="hm-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
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