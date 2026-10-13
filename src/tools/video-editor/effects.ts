import type { CSSProperties } from 'react'

interface FxDef {
  id: string
  label: string
  css: (t: number) => string
  transform?: string | ((t: number) => string)
  ff: string | ((w: number, h: number) => string)
}

const zoom = (rate: number, cap: number) => (t: number) => 'scale(' + Math.min(cap, 1 + rate * t).toFixed(4) + ')'
const zp = (w: number, h: number, z: string, dx = '0', dy = '0') =>
  "zoompan=z='" + z + "':x='iw/2-(iw/zoom/2)+" + dx + "':y='ih/2-(ih/zoom/2)+" + dy + "':d=1:s=" + w + 'x' + h + ':fps=30'

export const FX_LIST: FxDef[] = [
  { id: 'none', label: 'Ninguno', css: () => '', ff: '' },
  { id: 'blur', label: 'Desenfocado', css: () => 'blur(6px)', ff: 'gblur=sigma=6' },
  { id: 'film', label: 'Filmico', css: () => 'sepia(0.6) contrast(1.1)', ff: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,eq=contrast=1.1' },
  { id: 'bw', label: 'Blanco y negro', css: () => 'grayscale(1)', ff: 'hue=s=0' },
  { id: 'neg', label: 'Negativo', css: () => 'invert(1)', ff: 'negate' },
  { id: 'vapor', label: 'Vaporwave', css: () => 'hue-rotate(290deg) saturate(1.6)', ff: 'hue=h=290:s=1.6' },
  { id: 'vhs', label: 'VHS', css: () => 'blur(0.8px) saturate(1.3) contrast(1.1)', ff: 'noise=alls=18:allf=t,gblur=sigma=1,eq=saturation=1.3' },
  { id: 'contrast', label: 'Alto contraste', css: () => 'contrast(1.5) saturate(1.3)', ff: 'eq=contrast=1.5:saturation=1.3' },
  { id: 'pulse', label: 'Pulsos', css: (t) => 'brightness(' + (1 + 0.2 * Math.sin(t * 12.566)).toFixed(3) + ')', ff: "eq=brightness='0.2*sin(2*PI*2*t)':eval=frame" },
  { id: 'spin', label: 'Girar', css: () => '', transform: 'rotate(12deg)', ff: 'rotate=0.209:ow=iw:oh=ih:c=black' },
  { id: 'flip', label: 'Espejo', css: () => '', transform: 'scaleX(-1)', ff: 'hflip' },
  { id: 'zfast', label: 'Zoom rapido', css: () => '', transform: zoom(0.12, 1.5), ff: (w, h) => zp(w, h, 'min(1+0.004*on,1.5)') },
  { id: 'zslow', label: 'Zoom lento', css: () => '', transform: zoom(0.024, 1.3), ff: (w, h) => zp(w, h, 'min(1+0.0008*on,1.3)') },
  { id: 'zrand', label: 'Zoom lento aleatorio', css: () => '', transform: (t) => 'scale(1.15) translate(' + (Math.sin(t * 1.5) * 3).toFixed(2) + '%, ' + (Math.cos(t * 1.1) * 2).toFixed(2) + '%)', ff: (w, h) => zp(w, h, '1.15', 'sin(on/20)*iw*0.03', 'cos(on/27)*ih*0.02') },
  { id: 'flash', label: 'Flash', css: (t) => 'brightness(' + (t % 1.5 < 0.1 ? 1.6 : 1) + ')', ff: "eq=brightness='if(lt(mod(t,1.5),0.1),0.6,0)':eval=frame" },
  { id: 'chroma', label: 'Aberracion cromatica', css: () => 'drop-shadow(2px 0 0 rgba(255,0,0,0.55)) drop-shadow(-2px 0 0 rgba(0,0,255,0.55))', ff: 'rgbashift=rh=-4:bh=4' },
]

export function fxFilter(id: string | undefined, w: number, h: number): string {
  const f = FX_LIST.find((x) => x.id === id)
  if (!f || !f.ff) return ''
  return typeof f.ff === 'function' ? f.ff(w, h) : f.ff
}

export function fxStyle(base: CSSProperties, id: string | undefined, t: number): CSSProperties {
  const f = FX_LIST.find((x) => x.id === id)
  if (!f || f.id === 'none') return base
  const extra = f.css(t)
  return {
    ...base,
    filter: ((base.filter as string | undefined) ?? '') + (extra ? ' ' + extra : ''),
    transform: typeof f.transform === 'function' ? f.transform(t) : f.transform,
  }
}