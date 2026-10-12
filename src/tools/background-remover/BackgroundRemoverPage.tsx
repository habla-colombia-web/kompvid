import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { removeBackground } from '@imgly/background-removal'
import { usePlan } from '../../core/billing/usePlan'
import { consumeUsage } from '../../core/usage/consumeUsage'

const TOOL_ID = 'background-remover'
const MAX_MB = 15
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function baseName(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

export default function BackgroundRemoverPage() {
  const { plan, loaded } = usePlan()
  const isPro = plan === 'pro'

  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultSize, setResultSize] = useState(0)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const runRef = useRef(0)
  const originalRef = useRef<string | null>(null)
  const resultRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      runRef.current += 1
      if (originalRef.current) URL.revokeObjectURL(originalRef.current)
      if (resultRef.current) URL.revokeObjectURL(resultRef.current)
    }
  }, [])

  function releaseResult() {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current)
    resultRef.current = null
    setResultUrl(null)
    setResultSize(0)
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || busy) return
    setError(null)
    releaseResult()

    if (!ACCEPTED.includes(f.type)) {
      setError('Formato no compatible. Usa PNG, JPG o WEBP.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError('La imagen supera el límite de ' + MAX_MB + ' MB.')
      return
    }

    if (originalRef.current) URL.revokeObjectURL(originalRef.current)
    const url = URL.createObjectURL(f)
    originalRef.current = url
    setOriginalUrl(url)
    setFile(f)
  }

  async function handleStart() {
    if (!file || busy) return
    setError(null)
    releaseResult()
    runRef.current += 1
    const run = runRef.current
    setBusy(true)
    setProgress(0)

    try {
      const usage = await consumeUsage(TOOL_ID)
      if (run !== runRef.current) return
      if (usage.error || !usage.result) {
        setError(usage.error ?? 'No se pudo verificar tu acceso. Inténtalo de nuevo.')
        return
      }
      if (!usage.result.allowed) {
        setError(
          usage.result.reason === 'plan_required'
            ? 'Esta herramienta es parte del plan Pro.'
            : 'Alcanzaste tu límite de uso de hoy para esta herramienta.',
        )
        return
      }

      const blob = await removeBackground(file, {
        output: { format: 'image/png' },
        progress: (_key: string, current: number, total: number) => {
          if (run === runRef.current && total > 0) setProgress(current / total)
        },
      })
      if (run !== runRef.current) return

      const url = URL.createObjectURL(blob)
      resultRef.current = url
      setResultUrl(url)
      setResultSize(blob.size)
    } catch (err) {
      if (run !== runRef.current) return
      console.error('Quitar fondo:', err)
      setError(
        'No se pudo quitar el fondo. Detalle técnico: ' + (err instanceof Error ? err.message : String(err)),
      )
    } finally {
      if (run === runRef.current) setBusy(false)
    }
  }

  if (loaded && !isPro) {
    return (
      <section className="wrap tool-page">
        <h1 className="page-title">Quitar fondo de imagen</h1>
        <p className="tool-lead">Esta herramienta es parte del plan Pro.</p>
        <div className="tool-actions">
          <Link className="btn btn-primary" to="/pricing">Ver planes</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="wrap tool-page">
      <h1 className="page-title">Quitar fondo de imagen</h1>
      <p className="tool-lead">
        Tu imagen se procesa en tu dispositivo y no se sube a ningún servidor. La primera vez se descarga el modelo, así que puede tardar. Máximo {MAX_MB} MB por imagen.
      </p>

      <label className="dropzone">
        <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={handleInput} />
        <strong>{file ? 'Elegir otra imagen' : 'Haz clic para elegir una imagen'}</strong>
        <span>PNG, JPG o WEBP</span>
      </label>

      {file && (
        <dl className="file-card">
          <dt>Archivo</dt>
          <dd>{file.name}</dd>
          <dt>Tamaño</dt>
          <dd>{formatSize(file.size)}</dd>
        </dl>
      )}

      {file && (
        <div className="tool-actions">
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={busy}>
            {busy ? 'Procesando...' : 'Quitar fondo'}
          </button>
        </div>
      )}

      {busy && (
        <div className="tool-status" role="status">
          <progress value={progress} max={1} aria-label="Progreso" />
          <span>Procesando... {Math.round(progress * 100)}%</span>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      {originalUrl && (
        <div className="bgr-grid">
          <figure className="bgr-box">
            <figcaption>Original</figcaption>
            <img src={originalUrl} alt="Imagen original" />
          </figure>
          {resultUrl && (
            <figure className="bgr-box">
              <figcaption>Sin fondo ({formatSize(resultSize)})</figcaption>
              <div className="bgr-checker">
                <img src={resultUrl} alt="Imagen sin fondo" />
              </div>
            </figure>
          )}
        </div>
      )}

      {resultUrl && file && (
        <a className="btn btn-primary bgr-download" href={resultUrl} download={baseName(file.name) + '-sin-fondo.png'}>
          Descargar PNG
        </a>
      )}
    </section>
  )
}