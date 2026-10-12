import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { PLANS } from '../../config/product'
import { usePlan } from '../../core/billing/usePlan'
import { consumeUsage } from '../../core/usage/consumeUsage'
import {
  MIN_VIDEO_BITRATE,
  cancelCompression,
  compressVideo,
  estimateVideoBitrate,
  loadEngine,
} from './ffmpegService'
import { baseName, formatBytes, formatDuration, getVideoDuration } from './utils'
import { validateVideoFile } from './validation'

const TOOL_ID = 'video-compressor'

type Stage = 'idle' | 'ready' | 'preparing' | 'compressing' | 'done'

interface ResultInfo {
  url: string
  size: number
  name: string
}

export default function VideoCompressorPage() {
  const { plan } = usePlan()
  const isPro = plan === 'pro'
  const maxMB = isPro ? (PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB) : PLANS.free.maxFileMB

  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [mode, setMode] = useState<'auto' | 'custom'>('auto')
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
  const effectiveMode = isPro ? mode : 'auto'

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
    if (!f || busy) return
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
    if (!file || busy) return
    setError(null)
    setNotice(null)
    releaseResult()

    let target: number | undefined
    const height = maxHeight ? Number(maxHeight) : null

    if (effectiveMode === 'custom') {
      target = Number(targetMB.replace(',', '.'))
      if (!Number.isFinite(target) || target <= 0) {
        setError('Indica un tamaño objetivo en MB mayor que cero.')
        return
      }
      if (!duration) {
        setError('No se pudo leer la duración del video, así que no se puede calcular un tamaño objetivo.')
        return
      }
      if (target * 1024 * 1024 >= file.size) {
        setError('El tamaño objetivo debe ser menor que el del archivo original.')
        return
      }
      if (estimateVideoBitrate(target, duration) < MIN_VIDEO_BITRATE) {
        setError(
          'Con ' + target + ' MB este video quedaría con una calidad muy baja. Prueba con un tamaño mayor o una resolución menor.',
        )
        return
      }
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
        setError(usage.error ?? 'No se pudo verificar tu límite de uso.')
        setStage('ready')
        return
      }
      if (!usage.result.allowed) {
        setError(
          'Alcanzaste el límite de ' + usage.result.limit + ' compresiones por día. El contador se reinicia a las 7:00 p. m. (hora de Colombia).',
        )
        setStage('ready')
        return
      }

      setStage('compressing')
      const blob = await compressVideo(
        file,
        { mode: effectiveMode, targetMB: target, maxHeight: height, durationSec: duration },
        setProgress,
      )
      if (run !== runRef.current) return

      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setResult({ url, size: blob.size, name: baseName(file.name) + '-kompvid.mp4' })
      setStage('done')
    } catch (err) {
      console.error('Kompvid compresor:', err)
      if (run !== runRef.current) return
      setError(
        'No se pudo comprimir este video. Detalle técnico: ' + (err instanceof Error ? err.message : String(err)),
      )
      setStage('ready')
    }
  }

  function handleCancel() {
    runRef.current += 1
    cancelCompression()
    setProgress(0)
    setNotice('Compresión cancelada.')
    setStage('ready')
  }

  function handleDownload() {
    window.setTimeout(() => {
      releaseResult()
      setFile(null)
      setDuration(null)
      setProgress(0)
      setStage('idle')
      setNotice('Descarga iniciada. El video ya se eliminó de la memoria de tu navegador.')
    }, 3000)
  }
  const saved = result && file ? file.size - result.size : 0
  const savedPct = result && file && file.size > 0 ? (saved / file.size) * 100 : 0

  return (
    <section className="wrap tool-page">
      <h1 className="page-title">Compresor de video</h1>
      <p className="tool-lead">
        Tu video se procesa en tu dispositivo y no se sube a ningún servidor. Plan {isPro ? 'Pro' : 'Gratis'}: hasta {maxMB} MB por archivo.
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
        <input
          className="sr-only"
          type="file"
          accept="video/*,.mkv,.avi,.mov"
          disabled={busy}
          onChange={handleInput}
        />
        <strong>{file ? 'Elegir otro video' : 'Arrastra tu video aquí o haz clic para elegirlo'}</strong>
        <span>MP4, MOV, WEBM, MKV o AVI</span>
      </label>

      {file && (
        <dl className="file-card">
          <dt>Archivo</dt>
          <dd>{file.name}</dd>
          <dt>Tamaño</dt>
          <dd>{formatBytes(file.size)}</dd>
          <dt>Duración</dt>
          <dd>{duration ? formatDuration(duration) : 'No disponible'}</dd>
        </dl>
      )}

      {file && (
        <fieldset className="options" disabled={busy}>
          <legend>Modo de compresión</legend>
          <label className="radio">
            <input type="radio" name="mode" checked={effectiveMode === 'auto'} onChange={() => setMode('auto')} />
            <span>
              Automático
              <small>Reduce el peso con una calidad equilibrada.</small>
            </span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="mode"
              checked={effectiveMode === 'custom'}
              disabled={!isPro}
              onChange={() => setMode('custom')}
            />
            <span>
              Personalizado
              <small>{isPro ? 'Elige el tamaño objetivo y la resolución.' : 'Solo en Kompvid Pro, aún no disponible.'}</small>
            </span>
          </label>

          {effectiveMode === 'custom' && (
            <div className="custom-fields">
              <label>
                Tamaño objetivo (MB)
                <input type="text" inputMode="decimal" value={targetMB} onChange={(e) => setTargetMB(e.target.value)} />
              </label>
              <label>
                Resolución máxima
                <select value={maxHeight} onChange={(e) => setMaxHeight(e.target.value)}>
                  <option value="">Original</option>
                  <option value="1080">1080p</option>
                  <option value="720">720p</option>
                  <option value="480">480p</option>
                </select>
              </label>
              <p className="hint">El tamaño final puede variar un poco respecto al objetivo.</p>
            </div>
          )}
        </fieldset>
      )}

      {file && (
        <div className="tool-actions">
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={busy}>
            Comprimir video
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
          Preparando el motor de compresión. La primera vez puede tardar unos segundos.
        </p>
      )}
      {stage === 'compressing' && (
        <div className="tool-status" role="status">
          <progress value={progress} max={1} aria-label="Progreso de la compresión" />
          <span>Comprimiendo... {Math.round(progress * 100)}%</span>
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
            <dt>Comprimido</dt>
            <dd>{formatBytes(result.size)}</dd>
            <dt>Ahorro</dt>
            <dd>
              {saved > 0
                ? formatBytes(saved) + ' (' + savedPct.toFixed(1) + '%)'
                : 'El resultado no es más pequeño que el original.'}
            </dd>
          </dl>
          <a className="btn btn-primary" href={result.url} download={result.name} onClick={handleDownload}>
            Descargar video
          </a>
        </div>
      )}
    </section>
  )
}