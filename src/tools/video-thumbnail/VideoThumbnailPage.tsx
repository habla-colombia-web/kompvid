import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { PLANS } from '../../config/product'
import { usePlan } from '../../core/billing/usePlan'
import { consumeUsage } from '../../core/usage/consumeUsage'
import { baseName, formatBytes } from '../video-compressor/utils'
import { validateVideoFile } from '../video-compressor/validation'

const TOOL_ID = 'video-thumbnail'

interface ResultInfo {
  url: string
  size: number
  name: string
}

function usageMessage(reason?: string, limit?: number | null): string {
  if (reason === 'limit_reached') {
    return 'Alcanzaste el limite de ' + (limit ?? 0) + ' usos por dia en esta herramienta. El contador se reinicia a las 7:00 p. m. (hora de Colombia).'
  }
  if (reason === 'plan_required') return 'Esta herramienta es solo para Kompvid Pro.'
  if (reason === 'tool_unavailable') return 'Esta herramienta no esta disponible por ahora.'
  return 'No se pudo autorizar el uso de esta herramienta.'
}

export default function VideoThumbnailPage() {
  const { plan } = usePlan()
  const isPro = plan === 'pro'
  const maxMB = isPro ? (PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB) : PLANS.free.maxFileMB

  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [dragging, setDragging] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrlRef = useRef<string | null>(null)
  const resultUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    }
  }, [])

  function releaseResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    resultUrlRef.current = null
    setResult(null)
  }

  function handleFile(f: File | undefined) {
    if (!f || busy) return
    setError(null)
    releaseResult()
    const problem = validateVideoFile(f, maxMB)
    if (problem) {
      setError(problem)
      return
    }
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current)
    const url = URL.createObjectURL(f)
    videoUrlRef.current = url
    setFile(f)
    setVideoUrl(url)
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    handleFile(f)
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleCapture() {
    const video = videoRef.current
    if (!file || !video || busy) return
    setError(null)
    releaseResult()

    if (!video.videoWidth || !video.videoHeight) {
      setError('Tu navegador no pudo leer este video, asi que no se puede sacar un fotograma. Prueba con MP4 o WEBM.')
      return
    }

    video.pause()
    setBusy(true)
    try {
      const usage = await consumeUsage(TOOL_ID)
      if (usage.error || !usage.result) {
        setError(usage.error ?? 'No se pudo verificar tu limite de uso.')
        return
      }
      if (!usage.result.allowed) {
        setError(usageMessage(usage.result.reason, usage.result.limit))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Tu navegador no pudo preparar el lienzo de dibujo.')
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, 0.92))
      canvas.width = 0
      canvas.height = 0
      if (!blob) throw new Error('No se pudo generar la imagen.')

      const url = URL.createObjectURL(blob)
      resultUrlRef.current = url
      const ext = format === 'image/png' ? 'png' : 'jpg'
      const second = Math.round(video.currentTime)
      setResult({ url, size: blob.size, name: baseName(file.name) + '-miniatura-' + second + 's.' + ext })
    } catch (err) {
      console.error('Kompvid miniatura:', err)
      setError('No se pudo crear la miniatura. ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="wrap tool-page">
      <h1 className="page-title">Miniatura de video</h1>
      <p className="tool-lead">
        Elige el fotograma que quieras y guardalo como imagen. Tu video se procesa en tu dispositivo y no se sube a ningun servidor. Plan {isPro ? 'Pro' : 'Gratis'}: hasta {maxMB} MB por archivo.
      </p>

      <label
        className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input className="sr-only" type="file" accept="video/*,.mkv,.avi,.mov" disabled={busy} onChange={handleInput} />
        <strong>{file ? 'Elegir otro video' : 'Arrastra tu video aqui o haz clic para elegirlo'}</strong>
        <span>MP4, MOV, WEBM, MKV o AVI</span>
      </label>

      {file && videoUrl && (
        <>
          <video ref={videoRef} className="result-video" src={videoUrl} controls preload="metadata" />
          <p className="hint">Pausa el video en el fotograma que quieras y pulsa el boton.</p>

          <fieldset className="options" disabled={busy}>
            <legend>Opciones</legend>
            <label>
              Formato de la imagen
              <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
                <option value="image/jpeg">JPG</option>
                <option value="image/png">PNG</option>
              </select>
            </label>
          </fieldset>

          <div className="tool-actions">
            <button type="button" className="btn btn-primary" onClick={handleCapture} disabled={busy}>
              Guardar este fotograma
            </button>
          </div>
        </>
      )}

      {busy && <p className="tool-status" role="status">Procesando...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {result && (
        <div className="result">
          <h2>Resultado</h2>
          <img src={result.url} alt="Miniatura generada" style={{ maxWidth: '100%', maxHeight: '60vh' }} />
          <dl className="file-card">
            <dt>Peso</dt>
            <dd>{formatBytes(result.size)}</dd>
          </dl>
          <a className="btn btn-primary" href={result.url} download={result.name}>
            Descargar imagen
          </a>
        </div>
      )}
    </section>
  )
}