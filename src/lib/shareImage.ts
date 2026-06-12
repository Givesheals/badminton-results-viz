import { toPng } from 'html-to-image'

export const SHARE_CAPTURE_WIDTH = 1080
export const SHARE_PIXEL_RATIO = 2

export type CaptureElementOptions = {
  backgroundColor?: string
}

function shouldExcludeNode(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return false
  return node.closest('[data-share-exclude]') != null
}

export async function captureElementAsPng(
  element: HTMLElement,
  options: CaptureElementOptions = {},
): Promise<Blob> {
  const dataUrl = await toPng(element, {
    width: SHARE_CAPTURE_WIDTH,
    pixelRatio: SHARE_PIXEL_RATIO,
    cacheBust: true,
    skipAutoScale: true,
    backgroundColor: options.backgroundColor ?? '#ffffff',
    filter: (node) => !shouldExcludeNode(node),
  })

  const response = await fetch(dataUrl)
  return response.blob()
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function shareOrDownloadPng(
  blob: Blob,
  filename: string,
  title: string,
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' })

  if (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title,
    })
    return 'shared'
  }

  downloadBlob(blob, filename)
  return 'downloaded'
}
