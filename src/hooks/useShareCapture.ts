import { useCallback, useRef, useState } from 'react'
import { captureElementAsPng, shareOrDownloadPng } from '../lib/shareImage'

export type ShareCaptureStatus = 'idle' | 'preparing' | 'shared' | 'downloaded' | 'error'

type Options = {
  filename: string
  title: string
}

export function useShareCapture({ filename, title }: Options) {
  const shareRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [status, setStatus] = useState<ShareCaptureStatus>('idle')

  const share = useCallback(async () => {
    const element = shareRef.current
    if (!element || sharing) return

    setSharing(true)
    setStatus('preparing')

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      })

      const blob = await captureElementAsPng(element)
      const result = await shareOrDownloadPng(blob, filename, title)
      setStatus(result)

      window.setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      window.setTimeout(() => setStatus('idle'), 2000)
    } finally {
      setSharing(false)
    }
  }, [filename, sharing, title])

  return { shareRef, share, sharing, status }
}
