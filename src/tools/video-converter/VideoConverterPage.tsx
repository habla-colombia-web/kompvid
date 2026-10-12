import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { PLANS } from '../../config/product'
import { usePlan } from '../../core/billing/usePlan'
import { consumeUsage } from '../../core/usage/consumeUsage'
import { cancelCompression, loadEngine } from '../video-compressor/ffmpegService'
import { baseName, formatBytes } from '../video-compressor/utils'
import { validateVideoFile } from '../video-compressor/validation'
import { convertVideo, type VideoFormat } from './convertService'

const TOOL_ID = 'video-converter'

type Stage = 'idle' | 'ready' | 'preparing' | 'converting' | 'done'

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

export default function VideoConverterPage() {
  const { plan } = usePlan()
  const isPro = plan === 'pro'
  const maxMB = isPro ? (PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB) : PLANS.free.maxFileMB

  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [format, setFormat] = useState<VideoFormat>('mp4')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [dragging, setDragging] = useState(false)

  const runRef = useRef(0)
  const urlRef = useRef<string | null>(null)

  const busy = stage === 'preparing' || stage === 'converting'

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

  function handleFile(f: File | undefined) {
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

  async function handleStart() {
    if (!file || busy) return
    setError(null)
    setNotice(null)
    releaseResult()

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

      setStage('converting')
      const blob = await convertVideo(file, format, setProgress)
      if (run !== runRef.current) return

      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setResult({ url, size: blob.size, name: baseName(file.name) + '-convertido.' + format })
      setStage('done')
    } catch (err) {
      console.error('Kompvid conversor:', err)
      if (run !== runRef.current) return
      setError('No se pudo convertir este video. Detalle tecnico: ' + (err instanceof Error ? err.message : String(err)))
      setStage('ready')
    }
  }

  function handleCancel() {
    runRef.current += 1
    cancelCompression()
    setProgress(0)
    setNotice('Conversion cancelada.')
    setStage('ready')
  }

  return (
    <section className="wrap tool-page">
      <h1 className="page-title">Convertir video</h1>
      <p className="tool-lead">
        Tu video se procesa en tu dispositivo y no se sube a ningun servidor. Plan {isPro ? 'Pro' : 'Gratis'}: hasta {maxMB} MB por archivo. La velocidad depende de tu dispositivo.
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

      {file && (
        <dl className="file-card">
          <dt>Archivo</dt>
          <dd>{file.name}</dd>
          <dt>Peso</dt>
          <dd>{formatBytes(file.size)}</dd>
        </dl>
      )}

      {file && (
        <fieldset className="options" disabled={busy}>
          <legend>Convertir a</legend>
          <label>
            Formato de salida
            <select value={format} onChange={(e) => setFormat(e.target.value as VideoFormat)}>
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="webm">WEBM (mas lento)</option>
            </select>
          </label>
        </fieldset>
      )}

      {file && (
        <div className="tool-actions">
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={busy}>
            Convertir video
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
      {stage === 'converting' && (
        <div className="tool-status" role="status">
          <progress value={progress} max={1} aria-label="Progreso de la conversion" />
          <span>Convirtiendo... {Math.round(progress * 100)}%</span>
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
            <dt>Convertido</dt>
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