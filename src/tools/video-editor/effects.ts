import type { CSSProperties } from 'react'

interface FxDef {
  id: string
  label: string
  css: (t: number) => string
  transform?: string
  ff: string
}

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
]

export function fxFilter(id?: string): string {
  const f = FX_LIST.find((x) => x.id === id)
  return f && f.ff ? f.ff : ''
}

export function fxStyle(base: CSSProperties, id: string | undefined, t: number): CSSProperties {
  const f = FX_LIST.find((x) => x.id === id)
  if (!f || f.id === 'none') return base
  const extra = f.css(t)
  return {
    ...base,
    filter: ((base.filter as string | undefined) ?? '') + (extra ? ' ' + extra : ''),
    transform: f.transform,
  }
}