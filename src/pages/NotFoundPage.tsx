import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="wrap auth-page">
      <h1>Página no encontrada</h1>
      <p className="form-error">La dirección que buscas no existe o fue movida.</p>
      <div className="auth-links">
        <Link to="/">Volver al inicio</Link>
      </div>
    </section>
  )
}