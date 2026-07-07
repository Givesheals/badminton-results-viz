import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PremiumNotesCaptureDemo } from './PremiumNotesCaptureDemo'
import { PremiumShowcaseProvider } from './showcase/PremiumShowcaseContext'
import { ShowcaseErrorBoundary } from './showcase/ShowcaseErrorBoundary'
import {
  PeopleShowcaseSlide,
  PlayerSummaryShowcaseSlide,
  RecapShowcaseSlide,
  SHOWCASE_SCROLL_FAST_MS,
  SHOWCASE_SCROLL_PEOPLE_MS,
} from './showcase/PremiumShowcaseSlides'

type Slide = {
  id: string
  caption: string
  displayMs: number
  render: (active: boolean) => ReactNode
}

const SLIDE_TRANSITION_MS = 500
const SLIDE_BUFFER_MS = 200

const SLIDES: Slide[] = [
  {
    id: 'notes',
    caption: 'Scouting notes & match journal',
    displayMs: 7500,
    render: (active) => <PremiumNotesCaptureDemo active={active} />,
  },
  {
    id: 'recap',
    caption: 'Tournament recaps',
    displayMs: SHOWCASE_SCROLL_FAST_MS + SLIDE_BUFFER_MS + SLIDE_TRANSITION_MS,
    render: (active) => <RecapShowcaseSlide active={active} />,
  },
  {
    id: 'summary',
    caption: 'Player summary & milestones',
    displayMs: SHOWCASE_SCROLL_FAST_MS + SLIDE_BUFFER_MS + SLIDE_TRANSITION_MS,
    render: (active) => <PlayerSummaryShowcaseSlide active={active} />,
  },
  {
    id: 'people',
    caption: 'Partner chemistry & matchups',
    displayMs: SHOWCASE_SCROLL_PEOPLE_MS + SLIDE_BUFFER_MS + SLIDE_TRANSITION_MS,
    render: (active) => <PeopleShowcaseSlide active={active} />,
  },
]

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

  useEffect(() => {
    if (reducedMotion) return
    const duration = SLIDES[activeIndex]!.displayMs
    const timer = window.setTimeout(() => {
      setActiveIndex((activeIndexRef.current + 1) % SLIDES.length)
    }, duration)
    return () => window.clearTimeout(timer)
  }, [activeIndex, reducedMotion])

  const activeSlide = SLIDES[activeIndex]!
  const animateSlides = transitionsEnabled && !reducedMotion
  const slideSharePercent = 100 / SLIDES.length

  return (
    <ShowcaseErrorBoundary>
      <PremiumShowcaseProvider>
        <figure className="overflow-hidden rounded-xl border-2 border-dashed border-ink-200 bg-ink-100/90">
          <div className="border-b border-ink-200 bg-gradient-to-r from-ink-100 to-ink-50 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Preview
            </span>
          </div>

          <div className="relative aspect-[2/1] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
              <div
                className={`premium-showcase-track flex h-full ${animateSlides ? 'premium-showcase-track-animated' : ''}`}
                style={{
                  width: `${SLIDES.length * 100}%`,
                  transform: `translateX(-${activeIndex * slideSharePercent}%)`,
                }}
              >
                {SLIDES.map((slide, index) => {
                  const isActive = index === activeIndex
                  return (
                    <div
                      key={slide.id}
                      className="h-full shrink-0"
                      style={{ width: `${slideSharePercent}%` }}
                    >
                      {slide.render(isActive)}
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
                {SLIDES.map((slide, index) => (
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
      </PremiumShowcaseProvider>
    </ShowcaseErrorBoundary>
  )
}
