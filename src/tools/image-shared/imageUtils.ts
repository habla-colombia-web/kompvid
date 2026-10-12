import { useEffect, useState } from 'react'

export type OutputType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'

export const OUTPUT_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export const MAX_SIDE = 8192
export const MAX_PIXELS = 50_000_000

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif']

export interface LoadedImage {
  file: File
  bitmap: ImageBitmap
  width: number
  height: number
  url: string
}

export function validateImageFile(file: File, maxMB: number): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const looksLikeImage = file.type.startsWith('image/') || ACCEPTED_EXTENSIONS.includes(ext)
  if (!looksLikeImage) return 'Formato no compatible. Usa JPG, PNG, WebP o AVIF.'
  if (file.size === 0) return 'El archivo esta vacio.'
  if (file.size > maxMB * 1024 * 1024) {
    return 'El archivo supera el limite de ' + maxMB + ' MB de tu plan.'
  }
  return null
}

export async function loadImage(file: File): Promise<LoadedImage> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('No se pudo leer la imagen. Puede estar danada o tu navegador no admite este formato.')
  }
  return { file, bitmap, width: bitmap.width, height: bitmap.height, url: URL.createObjectURL(file) }
}

export function disposeImage(image: LoadedImage) {
  image.bitmap.close()
  URL.revokeObjectURL(image.url)
}

const supportCache = new Map<string, Promise<boolean>>()

// Si el navegador no puede codificar un formato, devuelve PNG; asi se detecta.
export function supportsEncoding(type: OutputType): Promise<boolean> {
  if (type === 'image/png') return Promise.resolve(true)
  let cached = supportCache.get(type)
  if (!cached) {
    cached = new Promise<boolean>((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      canvas.toBlob((blob) => resolve(!!blob && blob.type === type), type, 0.8)
    })
    supportCache.set(type, cached)
  }
  return cached
}

export function useEncodingSupport(): Record<OutputType, boolean> {
  const [support, setSupport] = useState<Record<OutputType, boolean>>({
    'image/jpeg': true,
    'image/png': true,
    'image/webp': true,
    'image/avif': false,
  })
  useEffect(() => {
    let alive = true
    void Promise.all([supportsEncoding('image/webp'), supportsEncoding('image/avif')]).then(
      ([webp, avif]) => {
        if (alive) setSupport((s) => ({ ...s, 'image/webp': webp, 'image/avif': avif }))
      },
    )
    return () => {
      alive = false
    }
  }, [])
  return support
}

export async function pickOutputType(file: File): Promise<OutputType> {
  const t = file.type
  if (t === 'image/jpeg' || t === 'image/png' || t === 'image/webp' || t === 'image/avif') {
    if (await supportsEncoding(t)) return t
  }
  return 'image/png'
}

export interface RenderOptions {
  source: ImageBitmap
  sx: number
  sy: number
  sw: number
  sh: number
  width: number
  height: number
  type: OutputType
  quality?: number
}

export async function renderToBlob(o: RenderOptions): Promise<Blob> {
  if (o.width > MAX_SIDE || o.height > MAX_SIDE || o.width * o.height > MAX_PIXELS) {
    throw new Error('La imagen resultante es demasiado grande para procesarla en el navegador.')
  }
  const canvas = document.createElement('canvas')
  canvas.width = o.width
  canvas.height = o.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no pudo preparar el lienzo de dibujo.')
  if (o.type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, o.width, o.height)
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(o.source, o.sx, o.sy, o.sw, o.sh, 0, 0, o.width, o.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, o.type, o.quality))
  canvas.width = 0
  canvas.height = 0
  if (!blob) throw new Error('No se pudo generar la imagen.')
  if (blob.type !== o.type) throw new Error('Tu navegador no puede generar este formato.')
  return blob
}