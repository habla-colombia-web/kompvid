import { Link } from 'react-router-dom'
import './home.css'

const STEPS = [
  { title: 'Elige tu video', text: 'Arrastra el archivo o selecciónalo desde tu dispositivo.' },
  { title: 'Define el tamaño', text: 'Deja que Kompvid lo decida o indica el tamaño que necesitas.' },
  { title: 'Descarga el resultado', text: 'Compara el antes y el después y guarda el archivo comprimido.' },
]

export default function HomePage() {
  return (
    <>
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