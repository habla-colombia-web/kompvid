import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PLANS } from '../../config/product'
import { usePlan } from '../../core/billing/usePlan'
import type { PlanId } from '../../core/tools/types'
import { consumeUsage } from '../../core/usage/consumeUsage'
import { cancelCompression, loadEngine } from '../video-compressor/ffmpegService'
import { baseName, formatBytes } from '../video-compressor/utils'
import { validateVideoFile } from '../video-compressor/validation'
import { getMediaDuration, runAudioJob, validateAudioFile, type AudioJob } from './audioService'

type Stage = 'idle' | 'ready' | 'preparing' | 'working' | 'done'

interface ResultInfo {
  url: string
  size: number
  name: string
}

export interface ToolContext {
  file: File
  duration: number | null
}

interface AudioToolShellProps {
  toolId: string
  title: string
  lead: string
  actionLabel: string
  suffix: string
  kind: 'audio' | 'video'
  requiredPlan: PlanId
  renderOptions: (ctx: ToolContext) => ReactNode
  validate?: (ctx: ToolContext) => string | null
  buildJob: (ctx: ToolContext) => AudioJob
}

function usageMessage(reason?: string, limit?: number | null): string {
  if (reason === 'limit_reached') {
    return 'Alcanzaste el limite de ' + (limit ?? 0) + ' usos por dia en esta herramienta. El contador se reinicia a las 7:00 p. m. (hora de Colombia).'
  }
  if (reason === 'plan_required') return 'Esta herramienta es solo para Kompvid Pro.'
  if (reason === 'tool_unavailable') return 'Esta herramienta no esta disponible por ahora.'
  return 'No se pudo autorizar el uso de esta herramienta.'
}

export default function AudioToolShell(props: AudioToolShellProps) {
  const { toolId, title, lead, actionLabel, suffix, kind, requiredPlan } = props
  const { plan } = usePlan()
  const isPro = plan === 'pro'
  const maxMB = isPro ? (PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB) : PLANS.free.maxFileMB
  const locked = requiredPlan === 'pro' && !isPro

  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [result, setResult] = useState<ResultInfo | null>(null)
  const [dragging, setDragging] = useState(false)

  const runRef = useRef(0)
  const urlRef = useRef<string | null>(null)

  const busy = stage === 'preparing' || stage === 'working'

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
    if (!f || busy || locked) return
    setError(null)
    setNotice(null)
    releaseResult()
    const problem = kind === 'video' ? validateVideoFile(f, maxMB) : validateAudioFile(f, maxMB)
    if (problem) {
      setError(problem)
      return
    }
    setFile(f)
    setStage('ready')
    setProgress(0)
    setDuration(null)
    setDuration(await getMediaDuration(f))
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
    if (!file || busy || locked) return
    setError(null)
    setNotice(null)
    releaseResult()

    const ctx: ToolContext = { file, duration }
    const problem = props.validate?.(ctx)
    if (problem) {
      setError(problem)
      return
    }

    runRef.current += 1
    const run = runRef.current
    setStage('preparing')
    setProgress(0)

    try {
      await loadEngine()
      if (run !== runRef.current) return

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

      setStage('working')
      const job = props.buildJob(ctx)
      const blob = await runAudioJob(file, job, setProgress)
      if (run !== runRef.current) return

      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setResult({ url, size: blob.size, name: baseName(file.name) + '-' + suffix + '.' + job.format })
      setStage('done')
    } catch (err) {
      console.error('Kompvid audio (' + toolId + '):', err)
      if (run !== runRef.current) return
      setError('No se pudo procesar el archivo. Detalle tecnico: ' + (err instanceof Error ? err.message : String(err)))
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

  const accept = kind === 'video' ? 'video/*,.mkv,.avi,.mov' : 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus'
  const formats = kind === 'video' ? 'MP4, MOV, WEBM, MKV o AVI' : 'MP3, WAV, M4A, AAC, OGG o FLAC'

  return (
    <section className="wrap tool-page">
      <h1 className="page-title">{title}</h1>
      <p className="tool-lead">
        {lead} Tu archivo se procesa en tu dispositivo y no se sube a ningun servidor. Plan {isPro ? 'Pro' : 'Gratis'}: hasta {maxMB} MB por archivo. La velocidad depende de tu dispositivo.
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
        <input className="sr-only" type="file" accept={accept} disabled={busy || locked} onChange={handleInput} />
        <strong>{file ? 'Elegir otro archivo' : 'Arrastra tu archivo aqui o haz clic para elegirlo'}</strong>
        <span>{formats}</span>
      </label>

      {file && (
        <dl className="file-card">
          <dt>Archivo</dt>
          <dd>{file.name}</dd>
          <dt>Peso</dt>
          <dd>{formatBytes(file.size)}</dd>
        </dl>
      )}

      {file && !locked && (
        <fieldset className="options" disabled={busy}>
          <legend>Opciones</legend>
          {props.renderOptions({ file, duration })}
        </fieldset>
      )}

      {file && !locked && (
        <div className="tool-actions">
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={busy}>
            {actionLabel}
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
      {stage === 'working' && (
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
          <audio src={result.url} controls style={{ width: '100%' }} />
          <dl className="file-card">
            <dt>Original</dt>
            <dd>{formatBytes(file.size)}</dd>
            <dt>Resultado</dt>
            <dd>{formatBytes(result.size)}</dd>
          </dl>
          <a className="btn btn-primary" href={result.url} download={result.name}>
            Descargar audio
          </a>
        </div>
      )}
    </section>
  )
}