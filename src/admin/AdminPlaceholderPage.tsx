import { useParams } from 'react-router-dom'
import { ADMIN_NAV } from './nav'

export default function AdminPlaceholderPage() {
  const { section } = useParams()
  const item = ADMIN_NAV.find((i) => i.path === section)
  if (!item) return <h1>Sección no encontrada</h1>
  return (
    <>
      <h1>{item.label}</h1>
      <div className="admin-card is-empty">
        <em>Aún no implementado. Está planeado para la {item.phase}.</em>
      </div>
    </>
  )
}