import { useState } from 'react'
import { Link } from 'react-router-dom'
import './editor.css'
import { CANVAS_FORMATS, FORMAT_PRESETS, TRACKS, type CanvasFormatId } from './types'

const SIDE_SECTIONS = [
  { label: 'Mi multimedia', tag: 'Fase 2' },
  { label: 'Grabar y crear', tag: 'Futuro' },
  { label: 'Biblioteca de recursos', tag: 'Futuro' },
  { label: 'Texto y titulos', tag: 'Fase 4' },
  { label: 'Musica y efectos', tag: 'Fase 4' },
  { label: 'Transiciones', tag: 'Futuro' },
  { label: 'Filtros y efectos', tag: 'Futuro' },
]

const TIMELINE_SECONDS = 60
const TICK_EVERY = 5

function mmss(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return m + ':' + String(s).padStart(2, '0')
}

export default function VideoEditorPage() {
  const [name, setName] = useState('Proyecto sin titulo')
  const [formatId, setFormatId] = useState<CanvasFormatId>('landscape')
  const [zoom, setZoom] = useState(30)

  const format = CANVAS_FORMATS.find((f) => f.id === formatId) ?? CANVAS_FORMATS[0]
  const width = TIMELINE_SECONDS * zoom
  const ticks: number[] = []
  for (let s = 0; s <= TIMELINE_SECONDS; s += TICK_EVERY) ticks.push(s)

  function applyPreset(id: string) {
    const preset = FORMAT_PRESETS.find((p) => p.id === id)
    if (preset) setFormatId(preset.format)
  }

  return (
    <section className="wrap tool-page ed">
      <h1 className="page-title">Editor de video - Kompvid Studio</h1>
      <p className="ed-notice" role="status">
        Version en construccion: por ahora puedes organizar el proyecto y elegir el formato. Importar, editar y exportar llegan en las siguientes fases. Si solo necesitas reducir el peso de un video, usa el{' '}
        <Link to="/tools/video-compressor">compresor</Link>.
      </p>

      <div className="ed-top">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del proyecto" maxLength={80} />
        <select value={formatId} onChange={(e) => setFormatId(e.target.value as CanvasFormatId)} aria-label="Formato del video">
          {CANVAS_FORMATS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <select value="" onChange={(e) => applyPreset(e.target.value)} aria-label="Preset para redes sociales">
          <option value="">Preset de red social</option>
          {FORMAT_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <span className="ed-top-spacer" />
        <span className="ed-save">Guardado: aun no disponible</span>
        <button type="button" className="ed-btn" disabled title="Disponible en la Fase 3">Deshacer</button>
        <button type="button" className="ed-btn" disabled title="Disponible en la Fase 3">Rehacer</button>
        <button type="button" className="ed-btn" disabled title="Disponible en la Fase 3">Vista previa</button>
        <button type="button" className="ed-btn ed-btn-primary" disabled title="Disponible en la Fase 5">Exportar</button>
      </div>

      <div className="ed-main">
        <aside className="ed-side" aria-label="Recursos del proyecto">
          <h2>Recursos</h2>
          {SIDE_SECTIONS.map((s) => (
            <button key={s.label} type="button" className="ed-side-item" disabled>
              <span>{s.label}</span>
              <span className="ed-tag">{s.tag}</span>
            </button>
          ))}
        </aside>

        <div className="ed-preview">
          <div className="ed-stage">
            <div className="ed-canvas" style={{ aspectRatio: format.ratioW + ' / ' + format.ratioH }}>
              Lienzo {format.ratioW}:{format.ratioH}. Aun no hay medios en el proyecto.
            </div>
          </div>
          <div className="ed-controls">
            <button type="button" className="ed-btn" disabled title="Disponible en la Fase 3">Reproducir</button>
            <span>0:00 / 0:00</span>
          </div>
        </div>
      </div>

      <div className="ed-timeline">
        <div className="ed-tl-bar">
          <label>
            Zoom{' '}
            <input type="range" min={10} max={120} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom de la linea de tiempo" />
          </label>
          <span>{zoom} px por segundo</span>
        </div>
        <div className="ed-tl-scroll">
          <div className="ed-tl-inner" style={{ width: width + 90 }}>
            <div className="ed-ruler" style={{ width }}>
              {ticks.map((s) => (
                <span key={s} className="ed-tick" style={{ left: s * zoom }}>{mmss(s)}</span>
              ))}
            </div>
            {TRACKS.map((t) => (
              <div key={t.id} className="ed-track" style={{ width }}>
                <span className="ed-track-label">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="ed-empty">Las pistas estan vacias. Los clips se podran agregar desde la Fase 2.</p>
      </div>
    </section>
  )
}