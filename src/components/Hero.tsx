import { Link } from 'react-router-dom'
import { PRODUCT } from '../config/product'

function PlayIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <rect x="2" y="6" width="40" height="32" rx="8" fill="currentColor" opacity="0.12" />
      <path d="M18 14.5v15l12-7.5z" fill="currentColor" />
    </svg>
  )
}

export default function Hero() {
  return (
    <section className="wrap lh">
      <h1 className="lh-title">{PRODUCT.tagline}</h1>
      <p className="lh-lead">{PRODUCT.subtitle}</p>

      <div className="lh-actions">
        <Link className="btn btn-primary lh-cta" to="/tools/video-compressor">
          Elegir un video
        </Link>
        <Link className="btn btn-secondary" to="/pricing">
          Ver planes
        </Link>
      </div>
      <p className="lh-note">
        Requiere una cuenta gratuita. Tu video se procesa en tu dispositivo y no se sube a ningún servidor.
      </p>

      <figure className="lh-compare" aria-label="Ilustración de un video antes y después de comprimir">
        <div className="lh-card">
          <span className="lh-tag">Original</span>
          <PlayIcon />
          <div className="lh-bar"><span style={{ width: '100%' }} /></div>
        </div>
        <div className="lh-arrow" aria-hidden="true">&rarr;</div>
        <div className="lh-card lh-card-after">
          <span className="lh-tag">Comprimido</span>
          <PlayIcon />
          <div className="lh-bar"><span style={{ width: '38%' }} /></div>
          <span className="lh-badge">Menos peso</span>
        </div>
        <figcaption className="lh-caption">
          Ilustración de ejemplo. El ahorro real depende de cada video.
        </figcaption>
      </figure>
    </section>
  )
}