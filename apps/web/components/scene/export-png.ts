/**
 * Saves the current view of the 3D canvas as a PNG, with a small DevCity caption in the corner.
 * The WebGL canvas is created with preserveDrawingBuffer, so its last frame can be read here.
 */
export async function exportPng(canvas: HTMLCanvasElement, caption: string, fileName: string) {
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  if (!ctx) return
  ctx.drawImage(canvas, 0, 0)

  const scale = canvas.width / canvas.clientWidth || 1
  const font = 13 * scale
  const pad = 14 * scale
  const styles = getComputedStyle(document.documentElement)
  const mono = styles.getPropertyValue('--mono').trim() || 'monospace'
  ctx.font = `600 ${font}px ${mono}`
  const width = ctx.measureText(caption).width
  ctx.fillStyle = styles.getPropertyValue('--bg').trim() || '#0a0e17'
  ctx.globalAlpha = 0.75
  ctx.beginPath()
  ctx.roundRect(
    out.width - width - pad * 3,
    out.height - font - pad * 3,
    width + pad * 2,
    font + pad * 1.6,
    8 * scale,
  )
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = styles.getPropertyValue('--accent-text').trim() || '#7dd3c0'
  ctx.fillText(caption, out.width - width - pad * 2, out.height - pad * 2.4)

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'))
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
