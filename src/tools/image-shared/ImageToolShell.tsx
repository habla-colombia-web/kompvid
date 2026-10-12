import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PLANS } from '../../config/product'
import { usePlan } from '../../core/billing/usePlan'
import type { PlanId } from '../../core/tools/types'
import { consumeUsage } from '../../core/usage/consumeUsage'
import { baseName, formatBytes } from '../video-compressor/utils'
import {
  OUTPUT_EXTENSIONS,
  disposeImage,
  loadImage,
  validateImageFile,
  type LoadedImage,
} from './imageUtils'

type Stage = 'idle' | 'ready' | 'working' | 'done'

interface ResultInfo {
  url: string
  size: number
  name: string
}

interface ImageToolShellProps {
  toolId: string
  title: string
  lead: string
  actionLabel: string
  requiredPlan: PlanId
  suffix: string
  onImageChange?: (image: LoadedImage) => void
  renderOptions: (image: LoadedImage) => ReactNode
  validate?: (image: LoadedImage) => string | null
  process: (image: LoadedImage) => Promise<Blob>
}


function usageMessage(reason?: string, limit?: number | null): string {
  if (reason === 'limit_reached') {
    return 'Alcanzaste el limite de ' + (limit ?? 0) + ' usos por dia en esta herramienta. El contador se reinicia a las 7:00 p. m. (hora de Colombia).'
  }
  if (reason === 'plan_required') return 'Esta herramienta es solo para Kompvid Pro.'
  if (reason === 'tool_unavailable') return 'Esta herramienta no esta disponible por ahora.'
  if (reason === 'unknown_tool') return 'Esta herramienta no esta registrada.'
  return 'No se pudo autorizar el uso de esta herramienta.'
}
export default function ImageToolShell(props: ImageToolShellProps) {
  const { toolId, title, lead, actionLabel, requiredPlan, suffix } = props
  const { plan } = usePlan()
  const isPro = plan === 'pro'
  const maxMB = isPro ? (PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB) : PLANS.free.maxFileMB
  const locked = requiredPlan === 'pro' && !isPro

  const [image, setImage] = useState<LoadedImage | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [dragging, setDragging] = useState(false)

  const runRef = useRef(0)
  const imageRef = useRef<LoadedImage | null>(null)
  const urlRef = useRef<string | null>(null)

  const busy = stage === 'working'

  useEffect(() => {
    return () => {
      runRef.current += 1
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      if (imageRef.current) disposeImage(imageRef.current)
    }
  }, [])

  function releaseResult() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setResult(null)
  }

  async function handleFile(f: File | undefined) {
    if (!f || busy || locked) return
    setError(null)
    releaseResult()
    const problem = validateImageFile(f, maxMB)
    if (problem) {
      setError(problem)
      return
    }
    try {
      const loaded = await loadImage(f)
      if (imageRef.current) disposeImage(imageRef.current)
      imageRef.current = loaded
      setImage(loaded)
      setStage('ready')
      props.onImageChange?.(loaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer la imagen.')
    }
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    void handleFile(f)
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    void handleFile(e.dataTransfer.files[0])
  }

  async function handleStart() {
    if (!image || busy || locked) return
    setError(null)
    releaseResult()

    const problem = props.validate?.(image)
    if (problem) {
      setError(problem)
      return
    }

    runRef.current += 1
    const run = runRef.current
    setStage('working')

    try {
      const usage = await consumeUsage(toolId)
      if (run !== runRef.current) return
      if (usage.error || !usage.result) {
        setError(usage.error ?? 'No se pudo verificar tu limite de uso.')
        setStage('ready')
        return
      }
      if (!usage.result.allowed) {
        setError(usageMessage(usage.result.reason, usage.result.limit))
        setStage('ready')
        return
      }

      const blob = await props.process(image)
      if (run !== runRef.current) return

      const url = URL.createObjectURL(blob)
      urlRef.current = url
      const ext = OUTPUT_EXTENSIONS[blob.type] ?? 'png'
      setResult({ url, size: blob.size, name: baseName(image.file.name) + '-' + suffix + '.' + ext })
      setStage('done')
    } catch (err) {
      console.error('Kompvid imagen (' + toolId + '):', err)
      if (run !== runRef.current) return
      setError('No se pudo procesar la imagen. ' + (err instanceof Error ? err.message : String(err)))
      setStage('ready')
    }
  }

  const diff = result && image ? image.file.size - result.size : 0

  return (
    <section className="wrap tool-page">
      <h1 className="page-title">{title}</h1>
      <p className="tool-lead">
        {lead} Tu imagen se procesa en tu dispositivo y no se sube a ningun servidor. Plan{' '}
        {isPro ? 'Pro' : 'Gratis'}: hasta {maxMB} MB por archivo.
      </p>

      {locked && (
        <p className="hint" role="status">
          Esta herramienta es solo para Kompvid Pro. <Link to="/pricing">Ver planes</Link>
        </p>
      )}

      <label
        className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy && !locked) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
          disabled={busy || locked}
          onChange={handleInput}
        />
        <strong>{image ? 'Elegir otra imagen' : 'Arrastra tu imagen aqui o haz clic para elegirla'}</strong>
        <span>JPG, PNG, WebP o AVIF</span>
      </label>

      {image && (
        <dl className="file-card">
          <dt>Archivo</dt>
          <dd>{image.file.name}</dd>
          <dt>Peso</dt>
          <dd>{formatBytes(image.file.size)}</dd>
          <dt>Dimensiones</dt>
          <dd>{image.width} x {image.height} px</dd>
        </dl>
      )}

      {image && !locked && (
        <fieldset className="options" disabled={busy}>
          <legend>Opciones</legend>
          {props.renderOptions(image)}
        </fieldset>
      )}

      {image && !locked && (
        <div className="tool-actions">
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={busy}>
            {actionLabel}
          </button>
        </div>
      )}

      {busy && <p className="tool-status" role="status">Procesando...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {result && image && (
        <div className="result">
          <h2>Resultado</h2>
          <img src={result.url} alt="Vista previa del resultado" style={{ maxWidth: '100%', maxHeight: '60vh' }} />
          <dl className="file-card">
            <dt>Original</dt>
            <dd>{formatBytes(image.file.size)}</dd>
            <dt>Resultado</dt>
            <dd>{formatBytes(result.size)}</dd>
            <dt>Diferencia</dt>
            <dd>
              {diff > 0
                ? 'Ahorro de ' + formatBytes(diff) + ' (' + ((diff / image.file.size) * 100).toFixed(1) + '%)'
                : 'El resultado no es mas liviano que el original.'}
            </dd>
          </dl>
          <a className="btn btn-primary" href={result.url} download={result.name}>
            Descargar imagen
          </a>
        </div>
      )}
    </section>
  )
}