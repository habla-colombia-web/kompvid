import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { PLANS } from '../../config/product'
import { usePlan } from '../../core/billing/usePlan'
import { consumeUsage } from '../../core/usage/consumeUsage'
import {
  MIN_VIDEO_BITRATE,
  cancelCompression,
  compressVideo,
  estimateVideoBitrate,
  loadEngine,
} from '../video-compressor/ffmpegService'
import { baseName, formatBytes, formatDuration, getVideoDuration } from '../video-compressor/utils'
import { validateVideoFile } from '../video-compressor/validation'

const TOOL_ID = 'video-target-size'

type Stage = 'idle' | 'ready' | 'preparing' | 'compressing' | 'done'

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

export default function VideoTargetSizePage() {
  const { plan } = usePlan()
  const isPro = plan === 'pro'
  const maxMB = isPro ? (PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB) : PLANS.free.maxFileMB

  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [targetMB, setTargetMB] = useState('')
  const [maxHeight, setMaxHeight] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [dragging, setDragging] = useState(false)

  const runRef = useRef(0)
  const urlRef = useRef<string | null>(null)

  const busy = stage === 'preparing' || stage === 'compressing'

  useEffect(() => {
    return () => {
      runRef.current += 1
      cancelCompression()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  function releaseResult() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setResult(null)
  }

  async function handleFile(f: File | undefined) {
    if (!f || busy || !isPro) return
    setError(null)
    setNotice(null)
    releaseResult()
    const problem = validateVideoFile(f, maxMB)
    if (problem) {
      setError(problem)
      return
    }
    setFile(f)
    setStage('ready')
    setProgress(0)
    setDuration(null)
    setDuration(await getVideoDuration(f))
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
    if (!file || busy || !isPro) return
    setError(null)
    setNotice(null)
    releaseResult()

    const target = Number(targetMB.replace(',', '.'))
    const height = maxHeight ? Number(maxHeight) : null

    if (!Number.isFinite(target) || target <= 0) {
      setError('Indica un tamano objetivo en MB mayor que cero.')
      return
    }
    if (!duration) {
      setError('No se pudo leer la duracion del video, asi que no se puede calcular un tamano objetivo.')
      return
    }
    if (target * 1024 * 1024 >= file.size) {
      setError('El tamano objetivo debe ser menor que el del archivo original.')
      return
    }
    if (estimateVideoBitrate(target, duration) < MIN_VIDEO_BITRATE) {
      setError('Con ' + target + ' MB este video quedaria con una calidad muy baja. Prueba con un tamano mayor o una resolucion menor.')
      return
    }

    runRef.current += 1
    const run = runRef.current
    setStage('preparing')
    setProgress(0)

    try {
      await loadEngine()
      if (run !== runRef.current) return

      const usage = await consumeUsage(TOOL_ID)
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

      setStage('compressing')
      const blob = await compressVideo(
        file,
        { mode: 'custom', targetMB: target, maxHeight: height, durationSec: duration },
        setProgress,
      )
      if (run !== runRef.current) return

      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setResult({ url, size: blob.size, name: baseName(file.name) + '-' + target + 'mb.mp4' })
      setStage('done')
    } catch (err) {
      console.error('Kompvid tamano objetivo:', err)
      if (run !== runRef.current) return
      setError('No se pudo procesar este video. Detalle tecnico: ' + (err instanceof Error ? err.message : String(err)))
      setStage('ready')
    }
  }

  function handleCancel() {
    runRef.current += 1
    cancelCompression()
    setProgress(0)
    setNotice('Proceso cancelado.')
    setStage('ready')
  }

  return (
    <section className="wrap tool-page">
      <h1 className="page-title">Reducir video a un tamano en MB</h1>
      <p className="tool-lead">
        Indica el peso que quieres y el video se ajusta. Se procesa en tu dispositivo y no se sube a ningun servidor. Plan {isPro ? 'Pro' : 'Gratis'}: hasta {maxMB} MB por archivo.
      </p>

      {!isPro && (
        <p className="hint" role="status">
          Esta herramienta es solo para Kompvid Pro. <Link to="/pricing">Ver planes</Link>
        </p>
      )}

      <label
        className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy && isPro) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input className="sr-only" type="file" accept="video/*,.mkv,.avi,.mov" disabled={busy || !isPro} onChange={handleInput} />
        <strong>{file ? 'Elegir otro video' : 'Arrastra tu video aqui o haz clic para elegirlo'}</strong>
        <span>MP4, MOV, WEBM, MKV o AVI</span>
      </label>

      {file && (
        <dl className="file-card">
          <dt>Archivo</dt>
          <dd>{file.name}</dd>
          <dt>Peso</dt>
          <dd>{formatBytes(file.size)}</dd>
          <dt>Duracion</dt>
          <dd>{duration ? formatDuration(duration) : 'No disponible'}</dd>
        </dl>
      )}

      {file && isPro && (
        <fieldset className="options" disabled={busy}>
          <legend>Opciones</legend>
          <label>
            Tamano objetivo (MB)
            <input type="text" inputMode="decimal" value={targetMB} onChange={(e) => setTargetMB(e.target.value)} />
          </label>
          <label>
            Resolucion maxima
            <select value={maxHeight} onChange={(e) => setMaxHeight(e.target.value)}>
              <option value="">Original</option>
              <option value="1080">1080p</option>
              <option value="720">720p</option>
              <option value="480">480p</option>
            </select>
          </label>
          <p className="hint">El tamano final puede variar un poco respecto al objetivo.</p>
        </fieldset>
      )}

      {file && isPro && (
        <div className="tool-actions">
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={busy}>
            Reducir video
          </button>
          {busy && (
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
          )}
        </div>
      )}

      {stage === 'preparing' && (
        <p className="tool-status" role="status">
          Preparando el motor. La primera vez puede tardar unos segundos.
        </p>
      )}
      {stage === 'compressing' && (
        <div className="tool-status" role="status">
          <progress value={progress} max={1} aria-label="Progreso" />
          <span>Procesando... {Math.round(progress * 100)}%</span>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="hint" role="status">{notice}</p>}

      {result && file && (
        <div className="result">
          <h2>Resultado</h2>
          <video className="result-video" src={result.url} controls />
          <dl className="file-card">
            <dt>Original</dt>
            <dd>{formatBytes(file.size)}</dd>
            <dt>Resultado</dt>
            <dd>{formatBytes(result.size)}</dd>
          </dl>
          <a className="btn btn-primary" href={result.url} download={result.name}>
            Descargar video
          </a>
        </div>
      )}
    </section>
  )
}