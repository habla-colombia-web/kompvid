import { useEffect, type ReactNode } from 'react'
import { LEGAL } from '../config/legal'
import { PRODUCT } from '../config/product'
import './legal.css'

export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = title + ' | ' + PRODUCT.name
  }, [title])

  return (
    <article className="lg">
      <h1>{title}</h1>
      <p className="lg-date">Última actualización: {LEGAL.updated}</p>
      {!LEGAL.reviewed && (
        <p className="lg-draft" role="note">
          Borrador pendiente de revisión legal. Los datos marcados como «por completar» deben ser confirmados por el titular del servicio.
        </p>
      )}
      {children}
    </article>
  )
}