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
          <img src="/hero2.webp" alt="Ilustración del video original" loading="eager" />
          <figcaption className="hs-tag">Original</figcaption>
        </figure>
        <figure className="hs-card">
          <img src="/hero.webp" alt="Ilustración del video comprimido" loading="lazy" />
          <figcaption className="hs-tag">Comprimido</figcaption>
          <span className="hs-badge">Menos peso</span>
        </figure>

        <div className="hs-icon" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="hs-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2fe0d6" />
                <stop offset="1" stopColor="#d63bff" />
              </linearGradient>
            </defs>
            <path d="M8 18a6 6 0 0 1 6-6h12l6 6h18a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z" fill="url(#hs-g)" />
            <path d="M27 28v16l14-8z" fill="#fff" />
          </svg>
        </div>
      </div>
      <p className="hs-note">Ilustración de ejemplo. El ahorro real depende de cada video.</p>
    </section>
  )
}