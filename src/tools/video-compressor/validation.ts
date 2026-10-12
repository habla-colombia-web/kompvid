const ACCEPTED_EXTENSIONS = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi']

export function validateVideoFile(file: File, maxMB: number): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const looksLikeVideo = file.type.startsWith('video/') || ACCEPTED_EXTENSIONS.includes(ext)

  if (!looksLikeVideo) return 'Formato no compatible. Usa MP4, MOV, WEBM, MKV o AVI.'
  if (file.size === 0) return 'El archivo está vacío.'
  if (file.size > maxMB * 1024 * 1024) {
    return 'El archivo supera el límite de ' + maxMB + ' MB de tu plan.'
  }
  return null
}