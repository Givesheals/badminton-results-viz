import { useEffect, useRef, useState } from 'react'
import {
  resolveShowcaseBucket,
  showcasePosterSrc,
  showcaseVideoSrc,
  type ShowcaseBucket,
} from '../../../lib/premiumShowcaseVideos'

type Props = {
  slideId: string
  active: boolean
  reducedMotion: boolean
  label: string
  onEnded?: () => void
}

function useShowcaseBucket() {
  const [bucket, setBucket] = useState<ShowcaseBucket>(() =>
    typeof window === 'undefined' ? 'phone' : resolveShowcaseBucket(window.innerWidth),
  )

  useEffect(() => {
    const update = () => setBucket(resolveShowcaseBucket(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return bucket
}

export function ShowcaseVideoSlide({ slideId, active, reducedMotion, label, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const bucket = useShowcaseBucket()
  const poster = showcasePosterSrc(slideId, bucket)
  const webm = showcaseVideoSrc(slideId, bucket, 'webm')
  const mp4 = showcaseVideoSrc(slideId, bucket, 'mp4')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!active || reducedMotion) {
      video.pause()
      return
    }

    video.currentTime = 0
    const play = video.play()
    if (play && typeof play.catch === 'function') {
      play.catch(() => {
        // Autoplay can fail if the browser blocks it; poster still shows.
      })
    }
  }, [active, reducedMotion, bucket, slideId])

  // Inactive slides keep a static poster so we don't download every clip up front.
  if (!active) {
    return (
      <div className="relative h-full w-full bg-ink-50">
        <img
          src={poster}
          alt=""
          className="h-full w-full object-cover object-top"
          loading="lazy"
          draggable={false}
        />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-ink-50">
      <video
        key={`${slideId}-${bucket}`}
        ref={videoRef}
        className="h-full w-full object-cover object-top"
        poster={poster}
        muted
        playsInline
        preload="auto"
        aria-label={label}
        onEnded={() => {
          if (active && !reducedMotion) onEnded?.()
        }}
      >
        {/* MP4 first for Safari; WebM for Chromium/Firefox. */}
        <source src={mp4} type="video/mp4" />
        <source src={webm} type="video/webm" />
      </video>
    </div>
  )
}
