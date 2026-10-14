import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { fetchFile } from '@ffmpeg/util'
import { PLANS } from '../../config/product'
import { usePlan } from '../../core/billing/usePlan'
import { consumeUsage } from '../../core/usage/consumeUsage'
import { cancelCompression, loadEngine } from '../video-compressor/ffmpegService'
import { formatBytes } from '../video-compressor/utils'

const FORMATS = [
  { id: 'landscape', label: 'Horizontal 16:9', rw: 16, rh: 9 },
  { id: 'vertical', label: 'Vertical 9:16', rw: 9, rh: 16 },
  { id: 'square', label: 'Cuadrado 1:1', rw: 1, rh: 1 },
  { id: 'portrait', label: 'Retrato 4:5', rw: 4, rh: 5 },
] as const

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2)

function usageMessage(reason?: string, limit?: number | null): string {
  if (reason === 'limit_reached') return 'Alcanzaste el limite de ' + (limit ?? 0) + ' usos por dia.'
  if (reason === 'plan_required') return 'Esta herramienta es solo para Kompvid Pro.'
  if (reason === 'tool_unavailable') return 'Esta herramienta no esta disponible por ahora.'
  return 'No se pudo autorizar el uso de esta herramienta.'
}

export default function VideoGifPage() {
  const { plan } = usePlan()
  const isPro = plan === 'pro'
  const maxSec = isPro ? 30 : 10
  const maxMB = isPro ? 500 : PLANS.free.maxFileMB

  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [fmt, setFmt] = useState<(typeof FORMATS)[number]['id']>('landscape')
  const [fit, setFit] = useState<'fit' | 'fill'>('fill')
  const [start, setStart] = useState(0)
  const [dur, setDur] = useState(3)
  const [width, setWidth] = useState(480)
  const [fps, setFps] = useState(12)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; size: number } | null>(null)
  const runRef = useRef(0)
  const urlRef = useRef<string | null>(null)
  const resRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      runRef.current += 1
      cancelCompression()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      if (resRef.current) URL.revokeObjectURL(resRef.current)
    }
  }, [])

  function clearResult() {
    if (resRef.current) URL.revokeObjectURL(resRef.current)
    resRef.current = null
    setResult(null)
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError(null)
    clearResult()
    if (!f.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v)$/i.test(f.name)) {
      setError('Elige un video MP4, WebM o MOV.')
      return
    }
    if (f.size > maxMB * 1024 * 1024) {
      setError('El archivo supera el limite de ' + maxMB + ' MB de tu plan.')
      return
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    const u = URL.createObjectURL(f)
    urlRef.current = u
    setFile(f)
    setUrl(u)
    setStart(0)
  }

  async function convert() {
    if (!file || busy) return
    setError(null)
    clearResult()
    const d = Math.min(Math.max(0.5, dur), maxSec)
    const f = FORMATS.find((x) => x.id === fmt) ?? FORMATS[0]
    const w = even(width)
    const h = even((width * f.rh) / f.rw)
    runRef.current += 1
    const run = runRef.current
    setBusy(true)
    setProgress(0)
    const inName = 'gin' + (/\.[a-z0-9]+$/i.exec(file.name)?.[0].toLowerCase() ?? '.mp4')
    const outName = 'out.gif'
    let ff: Awaited<ReturnType<typeof loadEngine>> | null = null
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.min(1, Math.max(0, p)))
    try {
      ff = await loadEngine()
      if (run !== runRef.current) return
      const usage = await consumeUsage('video-gif')
      if (run !== runRef.current) return
      if (usage.error || !usage.result) throw new Error(usage.error ?? 'No se pudo verificar tu limite de uso.')
      if (!usage.result.allowed) throw new Error(usageMessage(usage.result.reason, usage.result.limit))
      ff.on('progress', handler)
      await ff.writeFile(inName, await fetchFile(file))
      const scale =
        fit === 'fill'
          ? 'scale=' + w + ':' + h + ':force_original_aspect_ratio=increase,crop=' + w + ':' + h
          : 'scale=' + w + ':' + h + ':force_original_aspect_ratio=decrease,pad=' + w + ':' + h + ':(ow-iw)/2:(oh-ih)/2:color=black'
      const vf = 'fps=' + fps + ',' + scale + ',setsar=1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'
      const code = await ff.exec(['-ss', start.toFixed(2), '-t', d.toFixed(2), '-i', inName, '-vf', vf, '-loop', '0', outName])
      if (code !== 0) throw new Error('FFMPEG_EXIT_' + code)
      const data = await ff.readFile(outName)
      if (typeof data === 'string' || data.length === 0) throw new Error('FFMPEG_BAD_OUTPUT')
      if (run !== runRef.current) return
      const blob = new Blob([new Uint8Array(data)], { type: 'image/gif' })
      const u = URL.createObjectURL(blob)
      resRef.current = u
      setResult({ url: u, size: blob.size })
    } catch (err) {
      if (run === runRef.current) setError('No se pudo crear el GIF. ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      if (ff) {
        ff.off('progress', handler)
        for (const n of [inName, outName]) {
          try {
            await ff.deleteFile(n)
          } catch {
            // Ya no existe.
          }
        }
      }
      if (run === runRef.current) setBusy(false)
    }
  }

  function cancel() {
    runRef.current += 1
    cancelCompression()
    setBusy(false)
    setProgress(0)
  }

  const box = { display: 'flex', flexDirection: 'column' as const, gap: 4, fontSize: '0.9rem' }
  return (
    <section className="wrap tool-page">
      <h1 className="page-title">Video a GIF</h1>
      <p>Tu video se procesa en tu dispositivo y no se sube a ningun servidor. Plan {isPro ? 'Pro' : 'Gratis'}: hasta {maxSec} s de GIF y {maxMB} MB.</p>
      <label style={box}>
        Video
        <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v" onChange={onPick} disabled={busy} />
      </label>
      {url && <video src={url} controls style={{ maxWidth: '100%', maxHeight: 260, marginTop: 12 }} />}
      {file && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '14px 0' }}>
          <label style={box}>Formato
            <select value={fmt} onChange={(e) => setFmt(e.target.value as typeof fmt)} disabled={busy}>
              {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
          <label style={box}>Ajuste
            <select value={fit} onChange={(e) => setFit(e.target.value as 'fit' | 'fill')} disabled={busy}>
              <option value="fill">Rellenar (recortar bordes)</option>
              <option value="fit">Ajustar (barras negras)</option>
            </select>
          </label>
          <label style={box}>Inicio (s)
            <input type="number" min={0} step={0.5} value={start} onChange={(e) => setStart(Math.max(0, Number(e.target.value)))} disabled={busy} style={{ width: 90 }} />
          </label>
          <label style={box}>Duracion (s, max {maxSec})
            <input type="number" min={0.5} max={maxSec} step={0.5} value={dur} onChange={(e) => setDur(Math.min(maxSec, Math.max(0.5, Number(e.target.value))))} disabled={busy} style={{ width: 90 }} />
          </label>
          <label style={box}>Ancho
            <select value={width} onChange={(e) => setWidth(Number(e.target.value))} disabled={busy}>
              <option value={320}>320 px</option>
              <option value={480}>480 px</option>
              <option value={640}>640 px</option>
            </select>
          </label>
          <label style={box}>Fotogramas por segundo
            <select value={fps} onChange={(e) => setFps(Number(e.target.value))} disabled={busy}>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={15}>15</option>
            </select>
          </label>
        </div>
      )}
      {file && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn" onClick={() => void convert()} disabled={busy}>{busy ? 'Creando GIF...' : 'Crear GIF'}</button>
          {busy && <button type="button" className="btn" onClick={cancel}>Cancelar</button>}
        </div>
      )}
      {busy && <p role="status"><progress value={progress} max={1} /> {Math.round(progress * 100)}%</p>}
      {error && <p role="alert" style={{ color: '#ff8a8a' }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 14 }}>
          <img src={result.url} alt="GIF creado" style={{ maxWidth: '100%', maxHeight: 360 }} />
          <p>Peso del GIF: {formatBytes(result.size)}. Si pesa mucho, baja el ancho, los fotogramas o la duracion.</p>
          <a className="btn" href={result.url} download={(file?.name.replace(/\.[^.]+$/, '') || 'video') + '-kompvid.gif'}>Descargar GIF</a>
        </div>
      )}
    </section>
  )
}