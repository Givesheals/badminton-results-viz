import confetti from 'canvas-confetti'

/** How big the celebration burst should feel after a card reveal. */
export type ConfettiIntensity =
  | 'spectacular'
  | 'high'
  | 'medium'
  | 'light'
  | 'minimal'
  | 'none'

type BurstProfile = {
  particleCount: number
  spread: number
  startVelocity: number
  scalar: number
  colors: string[]
  ticks: number
}

const PROFILES: Record<Exclude<ConfettiIntensity, 'none'>, BurstProfile> = {
  spectacular: {
    particleCount: 160,
    spread: 100,
    startVelocity: 45,
    scalar: 1.15,
    colors: ['#fff500', '#d9cf72', '#7030a5', '#2f8e39', '#ffffff'],
    ticks: 220,
  },
  high: {
    particleCount: 100,
    spread: 80,
    startVelocity: 38,
    scalar: 1,
    colors: ['#b0b0b0', '#7030a5', '#d9cf72', '#ffffff'],
    ticks: 200,
  },
  medium: {
    particleCount: 70,
    spread: 70,
    startVelocity: 32,
    scalar: 0.95,
    colors: ['#eda687', '#7030a5', '#d9cf72', '#159eda'],
    ticks: 180,
  },
  light: {
    particleCount: 40,
    spread: 55,
    startVelocity: 28,
    scalar: 0.85,
    colors: ['#7030a5', '#2f8e39', '#d9cf72'],
    ticks: 160,
  },
  minimal: {
    particleCount: 22,
    spread: 45,
    startVelocity: 22,
    scalar: 0.75,
    colors: ['#7030a5', '#d9cf72'],
    ticks: 140,
  },
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Fire a canvas-confetti burst from an element's centre.
 * Intensity maps to particle count / spread so better results feel bigger.
 */
export function fireConfettiBurst(
  originEl: HTMLElement | null,
  intensity: ConfettiIntensity,
): void {
  if (intensity === 'none' || prefersReducedMotion()) return

  const profile = PROFILES[intensity]
  const rect = originEl?.getBoundingClientRect()
  const origin = rect
    ? {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      }
    : { x: 0.5, y: 0.4 }

  void confetti({
    ...profile,
    origin,
    disableForReducedMotion: true,
  })

  // Second smaller burst for spectacular / high wins
  if (intensity === 'spectacular' || intensity === 'high') {
    window.setTimeout(() => {
      void confetti({
        particleCount: Math.round(profile.particleCount * 0.45),
        spread: profile.spread + 20,
        startVelocity: profile.startVelocity * 0.7,
        scalar: profile.scalar * 0.9,
        colors: profile.colors,
        ticks: profile.ticks,
        origin: {
          x: origin.x,
          y: Math.max(0.15, origin.y - 0.08),
        },
        disableForReducedMotion: true,
      })
    }, 180)
  }
}
