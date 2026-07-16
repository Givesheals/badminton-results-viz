import { useEffect, useRef, useState } from 'react'
import { SHOWCASE_VIDEO_SLIDES } from '../../lib/premiumShowcaseVideos'
import { ShowcaseErrorBoundary } from './showcase/ShowcaseErrorBoundary'
import { ShowcaseVideoSlide } from './showcase/ShowcaseVideoSlide'

export function PremiumShowcaseCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [transitionsEnabled, setTransitionsEnabled] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const activeIndexRef = useRef(activeIndex)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setTransitionsEnabled(true), 50)
    return () => window.clearTimeout(timer)
  }, [])

  function goNext() {
    setActiveIndex((activeIndexRef.current + 1) % SHOWCASE_VIDEO_SLIDES.length)
  }

  // Fallback timer in case ended never fires (e.g. reduced motion / load failure).
  useEffect(() => {
    if (reducedMotion) return
    const duration = SHOWCASE_VIDEO_SLIDES[activeIndex]!.displayMs
    const timer = window.setTimeout(goNext, duration + 250)
    return () => window.clearTimeout(timer)
  }, [activeIndex, reducedMotion])

  const activeSlide = SHOWCASE_VIDEO_SLIDES[activeIndex]!
  const animateSlides = transitionsEnabled && !reducedMotion
  const slideSharePercent = 100 / SHOWCASE_VIDEO_SLIDES.length

  return (
    <ShowcaseErrorBoundary>
      <figure className="overflow-hidden rounded-xl border-2 border-dashed border-ink-200 bg-ink-100/90">
        <div className="border-b border-ink-200 bg-gradient-to-r from-ink-100 to-ink-50 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            Preview
          </span>
        </div>

        <div className="relative aspect-[5/4] min-h-[280px] overflow-hidden sm:aspect-[2/1] sm:min-h-[240px]">
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
            <div
              className={`premium-showcase-track flex h-full ${animateSlides ? 'premium-showcase-track-animated' : ''}`}
              style={{
                width: `${SHOWCASE_VIDEO_SLIDES.length * 100}%`,
                transform: `translateX(-${activeIndex * slideSharePercent}%)`,
              }}
            >
              {SHOWCASE_VIDEO_SLIDES.map((slide, index) => {
                const isActive = index === activeIndex
                return (
                  <div
                    key={slide.id}
                    className="h-full shrink-0"
                    style={{ width: `${slideSharePercent}%` }}
                  >
                    <ShowcaseVideoSlide
                      slideId={slide.id}
                      active={isActive}
                      reducedMotion={reducedMotion}
                      label={slide.caption}
                      onEnded={goNext}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <figcaption className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-ink-200/90 bg-white/95 px-3 py-2 backdrop-blur-sm">
            <p className="text-sm font-medium text-ink-800">{activeSlide.caption}</p>
            <div
              className="pointer-events-auto flex items-center gap-1.5"
              role="tablist"
              aria-label="Jump to preview slide"
            >
              {SHOWCASE_VIDEO_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={slide.caption}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    index === activeIndex ? 'w-5 bg-brand-600' : 'w-2 bg-ink-200 hover:bg-ink-300'
                  }`}
                />
              ))}
            </div>
          </figcaption>
        </div>
      </figure>
    </ShowcaseErrorBoundary>
  )
}
