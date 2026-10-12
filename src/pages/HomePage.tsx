import { Link } from 'react-router-dom'
import { PRODUCT } from '../config/product'
import { tools } from '../core/tools/registry'

const STEPS = [
  { title: 'Elige tu video', text: 'Arrastra el archivo o selecciónalo desde tu dispositivo.' },
  { title: 'Define el tamaño', text: 'Deja que Kompvid lo decida o indica el tamaño que necesitas.' },
  { title: 'Descarga el resultado', text: 'Compara el antes y el después y guarda el archivo comprimido.' },
]

export default function HomePage() {
  const hasActiveTool = tools.some((t) => t.status === 'active')

  return (
    <>
      <section className="wrap hero">
        <div className="hero-copy">
          <h1>{PRODUCT.tagline}</h1>
          <p className="hero-sub">{PRODUCT.subtitle}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/register">Crear cuenta</Link>
            <Link className="btn btn-secondary" to="/pricing">Ver planes</Link>
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
              {tool.status === 'active' ? (
                <Link className="badge badge-on" to={tool.route}>Abrir</Link>
              ) : (
                <span className="badge">Próximamente</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}