import { Link } from 'react-router-dom'
import { getActiveTools } from '../core/tools/registry'
import './hero-showcase.css'

const compressor = getActiveTools().find((t) => t.id === 'video-compressor')
const TARGET = compressor ? compressor.route : '/register'

export default function HeroShowcase() {
  return (
    <section className="hs">
      <div className="hs-head">
        <h1>Comprimir video</h1>
        <p>Reduce el tamaño de tus videos online</p>
        <Link className="hs-cta" to={TARGET}>
          <span className="hs-plus" aria-hidden="true">+</span>
          Elige un archivo
        </Link>
      </div>

      <div className="hs-stage">
        <figure className="hs-card">
          <span className="hs-tag">Original</span>
          <img src="/hero-antes.webp" alt="Ilustración de un video pesado sobre una báscula" width={900} height={900} />
        </figure>

        <div className="hs-arrow" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </div>

        <figure className="hs-card">
          <span className="hs-tag">Comprimido</span>
          <img src="/hero-despues.webp" alt="Ilustración del mismo video, ahora liviano" width={900} height={900} loading="lazy" />
          <span className="hs-badge">Menos peso</span>
        </figure>
      </div>
      <p className="hs-note">Ilustración de ejemplo. El ahorro real depende de cada video.</p>
    </section>
  )
}