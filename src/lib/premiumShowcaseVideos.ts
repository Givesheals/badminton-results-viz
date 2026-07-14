export type ShowcaseBucket = 'phone' | 'desktop'

export type ShowcaseVideoSlide = {
  id: string
  caption: string
  /** How long to show this slide before advancing (should match clip length). */
  displayMs: number
}

/** Breakpoint matching Tailwind `sm` — phone bucket below, desktop at/above. */
export const SHOWCASE_DESKTOP_MIN_WIDTH_PX = 640

/** Hold before motion begins on every clip. */
export const SHOWCASE_CLIP_HOLD_MS = 1000

export const SHOWCASE_VIDEO_SLIDES: ShowcaseVideoSlide[] = [
  {
    id: 'notes',
    caption: 'Personal notes',
    displayMs: SHOWCASE_CLIP_HOLD_MS + 7500,
  },
  {
    id: 'recap',
    caption: 'Tournament recaps',
    displayMs: SHOWCASE_CLIP_HOLD_MS + 7000,
  },
  {
    id: 'summary',
    caption: 'Player summary & milestones',
    displayMs: SHOWCASE_CLIP_HOLD_MS + 7000,
  },
  {
    id: 'people',
    caption: 'Partner chemistry & matchups',
    displayMs: SHOWCASE_CLIP_HOLD_MS + 7000,
  },
]

export function showcaseVideoSrc(slideId: string, bucket: ShowcaseBucket, ext: 'webm' | 'mp4') {
  return `${import.meta.env.BASE_URL}premium-showcase/${slideId}-${bucket}.${ext}`
}

export function showcasePosterSrc(slideId: string, bucket: ShowcaseBucket) {
  return `${import.meta.env.BASE_URL}premium-showcase/${slideId}-${bucket}.jpg`
}

export function resolveShowcaseBucket(widthPx: number): ShowcaseBucket {
  return widthPx >= SHOWCASE_DESKTOP_MIN_WIDTH_PX ? 'desktop' : 'phone'
}
