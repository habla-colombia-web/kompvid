import { fetchFile } from '@ffmpeg/util'
import { loadEngine } from '../video-compressor/ffmpegService'
import { fxFilter } from './effects'
import {
  canvasSize,
  clipDuration,
  totalDuration,
  transOverlap,
  TRANSITIONS,
  type MediaItem,
  type VClip,
  type Project,
  type TextClip,
} from './types'

export interface ExportSettings {
  shortSide: number
  crf: number
}

function fxChain(c: VClip, dur: number, w: number, h: number): { v: string; a: string } {
  let v = ''
  let a = (c.vol ?? 1) !== 1 ? ',volume=' + (c.vol ?? 1).toFixed(2) : ''
  const b = (c.bright ?? 0) / 100
  const ct = (c.contrast ?? 100) / 100
  const s = (c.sat ?? 100) / 100
  if (b !== 0 || ct !== 1 || s !== 1) v += ',eq=brightness=' + b.toFixed(2) + ':contrast=' + ct.toFixed(2) + ':saturation=' + s.toFixed(2)
  if ((c.blur ?? 0) > 0) v += ',gblur=sigma=' + (c.blur ?? 0).toFixed(1)
  if ((c.vig ?? 0) > 0) v += ',vignette=angle=' + (1.2 - ((c.vig ?? 0) / 100) * 0.9).toFixed(2)
  if (fxFilter(c.fx, w, h)) v += ',' + fxFilter(c.fx, w, h)
  const fi = Math.min(c.fadeIn ?? 0, dur / 2)
  const fo = Math.min(c.fadeOut ?? 0, dur / 2)
  if (fi > 0.01) {
    v += ',fade=t=in:st=0:d=' + fi.toFixed(2)
    a += ',afade=t=in:st=0:d=' + fi.toFixed(2)
  }
  if (fo > 0.01) {
    v += ',fade=t=out:st=' + (dur - fo).toFixed(2) + ':d=' + fo.toFixed(2)
    a += ',afade=t=out:st=' + (dur - fo).toFixed(2) + ':d=' + fo.toFixed(2)
  }
  return { v, a }
}

function extOf(name: string): string {
  return /\.[a-z0-9]+$/i.exec(name)?.[0].toLowerCase() ?? ''
}

const even = (n: number) => Math.ceil(n / 2) * 2

async function renderTextPng(t: TextClip, outH: number): Promise<Uint8Array> {
  const px = Math.max(8, Math.round((t.size / 100) * outH))
  const pad = Math.round(px * 0.3)
  const lines = t.text.split('\n')
  const font = 'bold ' + px + 'px ' + (t.font ?? 'sans-serif')
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) throw new Error('Tu navegador no pudo preparar el lienzo de texto.')
  probe.font = font
  const textW = Math.max(...lines.map((l) => probe.measureText(l).width))
  const lineH = Math.round(px * 1.25)
  const w = even(Math.max(2, textW + pad * 2))
  const h = even(Math.max(2, lineH * lines.length + pad * 2))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no pudo preparar el lienzo de texto.')
  if (t.bg) {
    ctx.fillStyle = t.boxColor ?? 'rgba(0,0,0,0.6)'
    const rr = Math.min((t.radius ?? 0) * px, h / 2, w / 2)
    ctx.beginPath()
    ctx.moveTo(rr, 0)
    ctx.arcTo(w, 0, w, h, rr)
    ctx.arcTo(w, h, 0, h, rr)
    ctx.arcTo(0, h, 0, 0, rr)
    ctx.arcTo(0, 0, w, 0, rr)
    ctx.closePath()
    ctx.fill()
  }
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  lines.forEach((l, i) => {
    const y = pad + lineH * i + lineH / 2
    if (t.shadowColor) {
      ctx.fillStyle = t.shadowColor
      ctx.fillText(l, w / 2 + px * 0.06, y + px * 0.06)
    }
    if (t.stroke && t.strokeColor) {
      ctx.lineWidth = t.stroke * px
      ctx.strokeStyle = t.strokeColor
      ctx.strokeText(l, w / 2, y)
    }
    ctx.fillStyle = t.color
    ctx.fillText(l, w / 2, y)
  })
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  canvas.width = 0
  canvas.height = 0
  if (!blob) throw new Error('No se pudo generar la imagen del texto.')
  return new Uint8Array(await blob.arrayBuffer())
}

export async function exportProject(
  project: Project,
  media: Map<string, MediaItem>,
  settings: ExportSettings,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  const total = totalDuration(project)
  if (project.vclips.length === 0 || total <= 0) throw new Error('El proyecto no tiene clips de video.')

  const ff = await loadEngine()
  const { w, h } = canvasSize(project.format, settings.shortSide)

  const written: string[] = []
  const names = new Map<string, string>()
  const args: string[] = []
  const filters: string[] = []
  let idx = 0

  const handler = ({ progress }: { progress: number }) => {
    onProgress(Math.min(1, Math.max(0, progress)))
  }
  ff.on('progress', handler)

  const ensure = async (m: MediaItem): Promise<string> => {
    const cached = names.get(m.id)
    if (cached) return cached
    const name = 'm' + names.size + extOf(m.name)
    await ff.writeFile(name, await fetchFile(m.file))
    written.push(name)
    names.set(m.id, name)
    return name
  }

  try {
    const fit =
      project.fit === 'fill'
        ? 'scale=' + w + ':' + h + ':force_original_aspect_ratio=increase,crop=' + w + ':' + h
        : 'scale=' + w + ':' + h + ':force_original_aspect_ratio=decrease,pad=' + w + ':' + h + ':(ow-iw)/2:(oh-ih)/2:color=black'

    let curV = 'v0'
    let curA = 'a0'
    let accDur = 0
    for (let i = 0; i < project.vclips.length; i++) {
      const c = project.vclips[i]
      const m = media.get(c.mediaId)
      if (!m) throw new Error('Un clip usa un archivo que ya no esta en el proyecto.')
      const dur = clipDuration(c)
      const fx = fxChain(c, dur, w, h)
      const name = await ensure(m)
      if (m.kind === 'image') args.push('-loop', '1', '-t', dur.toFixed(3), '-i', name)
      else args.push('-ss', c.inSec.toFixed(3), '-t', dur.toFixed(3), '-i', name)

      filters.push('[' + idx + ':v]' + fit + ',setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS' + fx.v + '[v' + i + ']')
      if (project.keepVideoAudio && m.kind === 'video') {
        filters.push('[' + idx + ':a]aresample=44100,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS' + fx.a + '[a' + i + ']')
      } else {
        filters.push('anullsrc=r=44100:cl=stereo:d=' + dur.toFixed(3) + '[a' + i + ']')
      }
      if (i === 0) {
        accDur = dur
      } else {
        const ov = transOverlap(project.vclips, i - 1)
        const tdef = TRANSITIONS.find((x) => x.id === project.vclips[i - 1].trans?.type)
        if (ov > 0.01 && tdef) {
          filters.push('[' + curV + '][v' + i + ']xfade=transition=' + tdef.xfade + ':duration=' + ov.toFixed(3) + ':offset=' + (accDur - ov).toFixed(3) + '[xv' + i + ']')
          filters.push('[' + curA + '][a' + i + ']acrossfade=d=' + ov.toFixed(3) + ',aresample=44100,aformat=channel_layouts=stereo[xa' + i + ']')
          accDur += dur - ov
        } else {
          filters.push('[' + curV + '][' + curA + '][v' + i + '][a' + i + ']concat=n=2:v=1:a=1[xv' + i + '][xa' + i + ']')
          accDur += dur
        }
        curV = 'xv' + i
        curA = 'xa' + i
      }
      idx++
    }
    filters.push('[' + curV + ']null[vc]')
    filters.push('[' + curA + ']anull[ac]')

    let vLabel = 'vc'
    let k = 0
    for (const t of project.texts) {
      if (t.start >= total || !t.text.trim()) continue
      const png = await renderTextPng(t, h)
      const name = 't' + k + '.png'
      await ff.writeFile(name, png)
      written.push(name)
      args.push('-loop', '1', '-t', total.toFixed(3), '-i', name)
      const s = Math.max(0, t.start)
      const e = Math.min(total, t.start + t.duration)
      const next = 'vt' + k
      filters.push(
        '[' + vLabel + '][' + idx + ':v]overlay=x=(W-w)*' + (t.x / 100).toFixed(3) + ':y=(H-h)*' + (t.y / 100).toFixed(3) +
          ":enable='between(t," + s.toFixed(3) + ',' + e.toFixed(3) + ")'[" + next + ']',
      )
      vLabel = next
      idx++
      k++
    }

    const mixLabels: string[] = []
    let ak = 0
    for (const a of project.aclips) {
      const m = media.get(a.mediaId)
      if (!m) throw new Error('Un clip de audio usa un archivo que ya no esta en el proyecto.')
      const dur = Math.min(clipDuration(a), total - a.start)
      if (dur <= 0.05) continue
      const name = await ensure(m)
      args.push('-ss', a.inSec.toFixed(3), '-t', dur.toFixed(3), '-i', name)
      const ms = Math.round(Math.max(0, a.start) * 1000)
      filters.push(
        '[' + idx + ':a]aresample=44100,aformat=channel_layouts=stereo,volume=' + a.volume.toFixed(2) + ',adelay=' + ms + '|' + ms + '[am' + ak + ']',
      )
      mixLabels.push('[am' + ak + ']')
      idx++
      ak++
    }

    let aLabel = 'ac'
    if (mixLabels.length > 0) {
      filters.push('[ac]' + mixLabels.join('') + 'amix=inputs=' + (mixLabels.length + 1) + ':duration=first:normalize=0[aout]')
      aLabel = 'aout'
    }

    const full = [
      ...args,
      '-filter_complex', filters.join(';'),
      '-map', '[' + vLabel + ']',
      '-map', '[' + aLabel + ']',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(settings.crf), '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '160k',
      '-movflags', '+faststart',
      '-t', total.toFixed(3),
      'output.mp4',
    ]

    const code = await ff.exec(full)
    if (code !== 0) throw new Error('FFMPEG_EXIT_' + code)
    const data = await ff.readFile('output.mp4')
    if (typeof data === 'string' || data.length === 0) throw new Error('FFMPEG_BAD_OUTPUT')
    return new Blob([new Uint8Array(data)], { type: 'video/mp4' })
  } finally {
    ff.off('progress', handler)
    for (const name of [...written, 'output.mp4']) {
      try {
        await ff.deleteFile(name)
      } catch {
        // Ya no existe o el motor fue detenido.
      }
    }
  }
}